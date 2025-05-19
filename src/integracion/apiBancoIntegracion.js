// src/integracion/apiBancoIntegracion.js
const { sequelize } = require('../config/database');
const { 
  CuentaBancaria, 
  TransaccionBancaria, 
  Tarjeta, 
  PagoBancario, 
  TransbankTransaccion 
} = require('../models/indexBanco');

/**
 * Integración entre API Bancaria y API de Inventario
 * Este módulo proporciona funciones para conectar ambos sistemas
 */

/**
 * Procesa el pago de un pedido utilizando los servicios bancarios
 * @param {number} idPedido - ID del pedido a procesar
 * @param {string} metodoPago - Método de pago (Transferencia, Débito, Crédito, Webpay)
 * @param {Object} datosPago - Datos adicionales del pago (ID_Cuenta, ID_Tarjeta, etc.)
 */
exports.procesarPagoPedido = async (idPedido, metodoPago, datosPago = {}) => {
  const t = await sequelize.transaction();
  
  try {
    // Verificar si el pedido existe
    const pedido = await sequelize.query(
      `SELECT * FROM PEDIDOS WHERE ID_Pedido = ?`,
      {
        replacements: [idPedido],
        type: sequelize.QueryTypes.SELECT,
        transaction: t
      }
    );
    
    if (!pedido || pedido.length === 0) {
      await t.rollback();
      throw new Error('Pedido no encontrado');
    }
    
    const pedidoInfo = pedido[0];
    
    // Verificar si ya existe un pago para este pedido
    const pagosExistentes = await sequelize.query(
      `SELECT * FROM PAGOS WHERE ID_Pedido = ? AND Estado != 'Anulado'`,
      {
        replacements: [idPedido],
        type: sequelize.QueryTypes.SELECT,
        transaction: t
      }
    );
    
    if (pagosExistentes && pagosExistentes.length > 0) {
      await t.rollback();
      throw new Error('Ya existe un pago registrado para este pedido');
    }
    
    // Crear el pago en la tabla PAGOS
    const nuevoPagoId = await sequelize.query(
      `INSERT INTO PAGOS (ID_Pedido, Fecha_Pago, Metodo_Pago, Monto, ID_Divisa, Estado) 
       VALUES (?, NOW(), ?, ?, ?, 'Pendiente')`,
      {
        replacements: [
          idPedido,
          metodoPago,
          pedidoInfo.Total,
          pedidoInfo.ID_Divisa || 1
        ],
        type: sequelize.QueryTypes.INSERT,
        transaction: t
      }
    );
    
    const pagoId = nuevoPagoId[0]; // El ID del pago insertado
    
    // Procesar según el método de pago
    switch (metodoPago) {
      case 'Transferencia': {
        if (!datosPago.ID_Cuenta) {
          await t.rollback();
          throw new Error('Para pagos por transferencia se requiere ID de cuenta bancaria');
        }
        
        // Verificar la cuenta bancaria
        const cuenta = await CuentaBancaria.findByPk(datosPago.ID_Cuenta, { transaction: t });
        if (!cuenta) {
          await t.rollback();
          throw new Error('Cuenta bancaria no encontrada');
        }
        
        // Verificar saldo
        if (parseFloat(cuenta.Saldo) < parseFloat(pedidoInfo.Total)) {
          await t.rollback();
          throw new Error('Saldo insuficiente en la cuenta bancaria');
        }
        
        // Realizar la transacción
        const nuevoSaldo = parseFloat(cuenta.Saldo) - parseFloat(pedidoInfo.Total);
        
        const transaccion = await TransaccionBancaria.create({
          ID_Cuenta: datosPago.ID_Cuenta,
          Tipo_Transaccion: 'Pago',
          Monto: pedidoInfo.Total,
          Saldo_Resultante: nuevoSaldo,
          Descripcion: `Pago FERREMAS - Pedido #${idPedido}`,
          Estado: 'Completada'
        }, { transaction: t });
        
        // Actualizar saldo
        await cuenta.update({
          Saldo: nuevoSaldo,
          Fecha_Actualizacion: new Date()
        }, { transaction: t });
        
        // Crear pago bancario
        const pagoBancario = await PagoBancario.create({
          ID_Pago: pagoId,
          ID_Transaccion: transaccion.ID_Transaccion,
          Tipo_Pago: 'Cuenta_Bancaria',
          Codigo_Autorizacion: `AUTH-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          Estado: 'Aprobado'
        }, { transaction: t });
        
        // Actualizar el pago
        await sequelize.query(
          `UPDATE PAGOS SET Estado = 'Completado', Procesador_Pago = 'API_Bancaria', 
           Numero_Transaccion = ? WHERE ID_Pago = ?`,
          {
            replacements: [
              transaccion.ID_Transaccion.toString(),
              pagoId
            ],
            type: sequelize.QueryTypes.UPDATE,
            transaction: t
          }
        );
        
        // Actualizar estado del pedido
        await sequelize.query(
          `UPDATE PEDIDOS SET Estado = 'Aprobado' WHERE ID_Pedido = ?`,
          {
            replacements: [idPedido],
            type: sequelize.QueryTypes.UPDATE,
            transaction: t
          }
        );
        
        // Registrar el cambio de estado en el histórico
        await sequelize.query(
          `INSERT INTO HISTORICO_ESTADOS_PEDIDO (ID_Pedido, Estado_Anterior, Estado_Nuevo, 
           Fecha_Cambio, ID_Usuario, Comentario)
           VALUES (?, 'Pendiente', 'Aprobado', NOW(), 1, 'Pago procesado exitosamente')`,
          {
            replacements: [idPedido],
            type: sequelize.QueryTypes.INSERT,
            transaction: t
          }
        );
        
        await t.commit();
        
        return {
          success: true,
          message: 'Pago procesado exitosamente mediante cuenta bancaria',
          data: {
            ID_Pago: pagoId,
            ID_Pedido: idPedido,
            ID_Pago_Bancario: pagoBancario.ID_Pago_Bancario,
            ID_Transaccion: transaccion.ID_Transaccion,
            Monto: pedidoInfo.Total,
            Estado: 'Completado',
            Codigo_Autorizacion: pagoBancario.Codigo_Autorizacion
          }
        };
      }
      
      case 'Débito':
      case 'Crédito': {
        if (!datosPago.ID_Tarjeta) {
          await t.rollback();
          throw new Error(`Para pagos con ${metodoPago.toLowerCase()} se requiere ID de tarjeta`);
        }
        
        // Verificar la tarjeta
        const tarjeta = await Tarjeta.findByPk(datosPago.ID_Tarjeta, { transaction: t });
        if (!tarjeta) {
          await t.rollback();
          throw new Error('Tarjeta no encontrada');
        }
        
        // Verificar estado
        if (tarjeta.Estado !== 'Activa') {
          await t.rollback();
          throw new Error(`La tarjeta no está activa (Estado: ${tarjeta.Estado})`);
        }
        
        // Verificar tipo
        const tipoTarjeta = metodoPago === 'Débito' ? 'Debito' : 'Credito';
        if (tarjeta.Tipo_Tarjeta !== tipoTarjeta) {
          await t.rollback();
          throw new Error(`El tipo de tarjeta (${tarjeta.Tipo_Tarjeta}) no coincide con el método de pago seleccionado`);
        }
        
        // Para débito, verificar saldo de la cuenta asociada
        let transaccionId = null;
        
        if (tipoTarjeta === 'Debito' && tarjeta.ID_Cuenta) {
          const cuenta = await CuentaBancaria.findByPk(tarjeta.ID_Cuenta, { transaction: t });
          if (!cuenta) {
            await t.rollback();
            throw new Error('La tarjeta de débito no tiene una cuenta bancaria asociada válida');
          }
          
          // Verificar saldo
          if (parseFloat(cuenta.Saldo) < parseFloat(pedidoInfo.Total)) {
            await t.rollback();
            throw new Error('Saldo insuficiente en la cuenta asociada a la tarjeta de débito');
          }
          
          // Realizar la transacción
          const nuevoSaldo = parseFloat(cuenta.Saldo) - parseFloat(pedidoInfo.Total);
          
          const transaccion = await TransaccionBancaria.create({
            ID_Cuenta: cuenta.ID_Cuenta,
            Tipo_Transaccion: 'Pago',
            Monto: pedidoInfo.Total,
            Saldo_Resultante: nuevoSaldo,
            Descripcion: `Pago con tarjeta débito FERREMAS - Pedido #${idPedido}`,
            Estado: 'Completada'
          }, { transaction: t });
          
          // Actualizar saldo
          await cuenta.update({
            Saldo: nuevoSaldo,
            Fecha_Actualizacion: new Date()
          }, { transaction: t });
          
          transaccionId = transaccion.ID_Transaccion;
        } else if (tipoTarjeta === 'Credito') {
          // Para crédito, verificar límite disponible
          const saldoActual = parseFloat(tarjeta.Saldo_Actual || 0);
          const limiteCredito = parseFloat(tarjeta.Limite_Credito || 0);
          
          if (limiteCredito > 0 && (saldoActual + parseFloat(pedidoInfo.Total)) > limiteCredito) {
            await t.rollback();
            throw new Error('El monto excede el límite de crédito disponible');
          }
          
          // Actualizar saldo de la tarjeta
          await tarjeta.update({
            Saldo_Actual: saldoActual + parseFloat(pedidoInfo.Total),
            Fecha_Actualizacion: new Date()
          }, { transaction: t });
        }
        
        // Crear pago bancario
        const pagoBancario = await PagoBancario.create({
          ID_Pago: pagoId,
          ID_Transaccion: transaccionId,
          ID_Tarjeta: datosPago.ID_Tarjeta,
          Tipo_Pago: `Tarjeta_${tipoTarjeta}`,
          Codigo_Autorizacion: `AUTH-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          Estado: 'Aprobado'
        }, { transaction: t });
        
        // Actualizar el pago
        await sequelize.query(
          `UPDATE PAGOS SET Estado = 'Completado', Procesador_Pago = 'API_Bancaria', 
           Numero_Transaccion = ? WHERE ID_Pago = ?`,
          {
            replacements: [
              pagoBancario.Codigo_Autorizacion,
              pagoId
            ],
            type: sequelize.QueryTypes.UPDATE,
            transaction: t
          }
        );
        
        // Actualizar estado del pedido
        await sequelize.query(
          `UPDATE PEDIDOS SET Estado = 'Aprobado' WHERE ID_Pedido = ?`,
          {
            replacements: [idPedido],
            type: sequelize.QueryTypes.UPDATE,
            transaction: t
          }
        );
        
        // Registrar el cambio de estado en el histórico
        await sequelize.query(
          `INSERT INTO HISTORICO_ESTADOS_PEDIDO (ID_Pedido, Estado_Anterior, Estado_Nuevo, 
           Fecha_Cambio, ID_Usuario, Comentario)
           VALUES (?, 'Pendiente', 'Aprobado', NOW(), 1, 'Pago con tarjeta procesado exitosamente')`,
          {
            replacements: [idPedido],
            type: sequelize.QueryTypes.INSERT,
            transaction: t
          }
        );
        
        await t.commit();
        
        return {
          success: true,
          message: `Pago procesado exitosamente mediante tarjeta de ${tipoTarjeta.toLowerCase()}`,
          data: {
            ID_Pago: pagoId,
            ID_Pedido: idPedido,
            ID_Pago_Bancario: pagoBancario.ID_Pago_Bancario,
            ID_Tarjeta: datosPago.ID_Tarjeta,
            Monto: pedidoInfo.Total,
            Estado: 'Completado',
            Codigo_Autorizacion: pagoBancario.Codigo_Autorizacion
          }
        };
      }
      
      case 'Webpay': {
        // Para Webpay, solo registramos el pago y dejamos que se complete por la API de Transbank
        await t.commit();
        
        return {
          success: true,
          message: 'Pago registrado, pendiente de procesar con Webpay',
          data: {
            ID_Pago: pagoId,
            ID_Pedido: idPedido,
            Monto: pedidoInfo.Total,
            Estado: 'Pendiente'
          }
        };
      }
      
      default: {
        await t.rollback();
        throw new Error(`Método de pago '${metodoPago}' no soportado por la API bancaria`);
      }
    }
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Consulta el estado de un pago
 * @param {number} idPago - ID del pago a consultar
 */
exports.consultarEstadoPago = async (idPago) => {
  try {
    // Consultar en tabla PAGOS
    const pago = await sequelize.query(
      `SELECT * FROM PAGOS WHERE ID_Pago = ?`,
      {
        replacements: [idPago],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (!pago || pago.length === 0) {
      throw new Error('Pago no encontrado');
    }
    
    const pagoInfo = pago[0];
    
    // Buscar información adicional según el tipo de pago
    let pagoBancario = null;
    let transaccionTransbank = null;
    
    // Verificar si hay pago bancario
    const pagosBancarios = await PagoBancario.findAll({
      where: { ID_Pago: idPago }
    });
    
    if (pagosBancarios && pagosBancarios.length > 0) {
      pagoBancario = pagosBancarios[0];
      
      // Si es Transbank, buscar la transacción correspondiente
      if (pagoBancario.Tipo_Pago === 'Transbank') {
        transaccionTransbank = await TransbankTransaccion.findOne({
          where: { ID_Pago_Bancario: pagoBancario.ID_Pago_Bancario }
        });
      }
    }
    
    return {
      success: true,
      data: {
        pago: pagoInfo,
        pagoBancario: pagoBancario,
        transaccionTransbank: transaccionTransbank
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Anula un pago realizado
 * @param {number} idPago - ID del pago a anular
 * @param {string} motivo - Motivo de la anulación
 */
exports.anularPago = async (idPago, motivo) => {
  const t = await sequelize.transaction();
  
  try {
    // Verificar si el pago existe
    const pago = await sequelize.query(
      `SELECT * FROM PAGOS WHERE ID_Pago = ?`,
      {
        replacements: [idPago],
        type: sequelize.QueryTypes.SELECT,
        transaction: t
      }
    );
    
    if (!pago || pago.length === 0) {
      await t.rollback();
      throw new Error('Pago no encontrado');
    }
    
    const pagoInfo = pago[0];
    
    // Verificar que el pago no esté ya anulado
    if (pagoInfo.Estado === 'Anulado') {
      await t.rollback();
      throw new Error('El pago ya está anulado');
    }
    
    // Verificar si hay pago bancario
    const pagosBancarios = await PagoBancario.findAll({
      where: { ID_Pago: idPago },
      transaction: t
    });
    
    if (pagosBancarios && pagosBancarios.length > 0) {
      const pagoBancario = pagosBancarios[0];
      
      // Verificar el tipo de pago para hacer la reversión apropiada
      if (pagoBancario.Tipo_Pago === 'Cuenta_Bancaria' && pagoBancario.ID_Transaccion) {
        // Revertir transacción bancaria
        const transaccion = await TransaccionBancaria.findByPk(pagoBancario.ID_Transaccion, {
          include: [{ model: CuentaBancaria, as: 'cuenta' }],
          transaction: t
        });
        
        if (transaccion && transaccion.cuenta) {
          // Crear transacción de reversión
          const nuevoSaldo = parseFloat(transaccion.cuenta.Saldo) + parseFloat(transaccion.Monto);
          
          await TransaccionBancaria.create({
            ID_Cuenta: transaccion.ID_Cuenta,
            Tipo_Transaccion: 'Deposito',
            Monto: transaccion.Monto,
            Saldo_Resultante: nuevoSaldo,
            Descripcion: `Anulación de pago - ${motivo || 'Sin motivo especificado'}`,
            Estado: 'Completada',
            ID_Transaccion_Relacionada: transaccion.ID_Transaccion
          }, { transaction: t });
          
          // Actualizar saldo de la cuenta
          await transaccion.cuenta.update({
            Saldo: nuevoSaldo,
            Fecha_Actualizacion: new Date()
          }, { transaction: t });
        }
      } else if ((pagoBancario.Tipo_Pago === 'Tarjeta_Credito' || pagoBancario.Tipo_Pago === 'Tarjeta_Debito') && pagoBancario.ID_Tarjeta) {
        // Revertir cargo a tarjeta
        const tarjeta = await Tarjeta.findByPk(pagoBancario.ID_Tarjeta, { transaction: t });
        
        if (tarjeta && tarjeta.Tipo_Tarjeta === 'Credito') {
          // Revertir cargo a tarjeta de crédito
          const nuevoSaldo = Math.max(0, parseFloat(tarjeta.Saldo_Actual) - parseFloat(pagoInfo.Monto));
          
          await tarjeta.update({
            Saldo_Actual: nuevoSaldo,
            Fecha_Actualizacion: new Date()
          }, { transaction: t });
        } else if (tarjeta && tarjeta.Tipo_Tarjeta === 'Debito' && tarjeta.ID_Cuenta) {
          // Para débito, si hay cuenta asociada, revertir la transacción
          const cuenta = await CuentaBancaria.findByPk(tarjeta.ID_Cuenta, { transaction: t });
          
          if (cuenta) {
            const nuevoSaldo = parseFloat(cuenta.Saldo) + parseFloat(pagoInfo.Monto);
            
            await TransaccionBancaria.create({
              ID_Cuenta: cuenta.ID_Cuenta,
              Tipo_Transaccion: 'Deposito',
              Monto: pagoInfo.Monto,
              Saldo_Resultante: nuevoSaldo,
              Descripcion: `Anulación de pago con tarjeta débito - ${motivo || 'Sin motivo especificado'}`,
              Estado: 'Completada'
            }, { transaction: t });
            
            await cuenta.update({
              Saldo: nuevoSaldo,
              Fecha_Actualizacion: new Date()
            }, { transaction: t });
          }
        }
      } else if (pagoBancario.Tipo_Pago === 'Transbank') {
        // Anular transacción Transbank
        const transaccionTransbank = await TransbankTransaccion.findOne({
          where: { ID_Pago_Bancario: pagoBancario.ID_Pago_Bancario },
          transaction: t
        });
        
        if (transaccionTransbank && transaccionTransbank.Estado === 'Confirmada') {
          await transaccionTransbank.update({
            Estado: 'Anulada',
            JSON_Respuesta: JSON.stringify({
              resultado: 'ANULADA',
              motivo: motivo || 'Anulación solicitada',
              fecha_anulacion: new Date().toISOString()
            })
          }, { transaction: t });
        }
      }
      
      // Actualizar estado del pago bancario
      await pagoBancario.update({
        Estado: 'Anulado'
      }, { transaction: t });
    }
    
    // Actualizar estado del pago
    await sequelize.query(
      `UPDATE PAGOS SET Estado = 'Anulado' WHERE ID_Pago = ?`,
      {
        replacements: [idPago],
        type: sequelize.QueryTypes.UPDATE,
        transaction: t
      }
    );
    
    // Si el pago es de un pedido, actualizar el estado del pedido
    if (pagoInfo.ID_Pedido) {
      await sequelize.query(
        `UPDATE PEDIDOS SET Estado = 'Pendiente' WHERE ID_Pedido = ?`,
        {
          replacements: [pagoInfo.ID_Pedido],
          type: sequelize.QueryTypes.UPDATE,
          transaction: t
        }
      );
      
      // Registrar el cambio de estado en el histórico
      await sequelize.query(
        `INSERT INTO HISTORICO_ESTADOS_PEDIDO (ID_Pedido, Estado_Anterior, Estado_Nuevo, 
         Fecha_Cambio, ID_Usuario, Comentario)
         VALUES (?, 'Aprobado', 'Pendiente', NOW(), 1, ?)`,
        {
          replacements: [
            pagoInfo.ID_Pedido,
            `Pago anulado - ${motivo || 'Sin motivo especificado'}`
          ],
          type: sequelize.QueryTypes.INSERT,
          transaction: t
        }
      );
    }
    
    await t.commit();
    
    return {
      success: true,
      message: 'Pago anulado exitosamente',
      data: {
        ID_Pago: idPago,
        ID_Pedido: pagoInfo.ID_Pedido,
        Estado: 'Anulado',
        Motivo: motivo || 'Sin motivo especificado'
      }
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Consulta información de una moneda extranjera
 * @param {string} codigoMoneda - Código ISO de la moneda (USD, EUR, etc.)
 */
exports.consultarTipoCambio = async (codigoMoneda) => {
  try {
    // Buscar en tabla DIVISAS
    const divisa = await sequelize.query(
      `SELECT * FROM DIVISAS WHERE Codigo = ?`,
      {
        replacements: [codigoMoneda],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (!divisa || divisa.length === 0) {
      throw new Error(`Divisa con código '${codigoMoneda}' no encontrada`);
    }
    
    // Buscar el tipo de cambio más reciente
    const tipoCambio = await sequelize.query(
      `SELECT * FROM TIPOS_CAMBIO 
       WHERE (ID_Divisa_Origen = ? OR ID_Divisa_Destino = ?) 
       ORDER BY Fecha DESC LIMIT 1`,
      {
        replacements: [divisa[0].ID_Divisa, divisa[0].ID_Divisa],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (!tipoCambio || tipoCambio.length === 0) {
      throw new Error(`No se encontró un tipo de cambio reciente para la divisa '${codigoMoneda}'`);
    }
    
    return {
      success: true,
      data: {
        divisa: divisa[0],
        tipoCambio: tipoCambio[0]
      }
    };
  } catch (error) {
    throw error;
  }
};