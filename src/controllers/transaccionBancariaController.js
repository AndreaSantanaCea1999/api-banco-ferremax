// src/controllers/transaccionBancariaController.js
const { TransaccionBancaria, CuentaBancaria, Cliente, Banco } = require('../models/indexBanco');
const { sequelize } = require('../config/database');

// Obtener todas las transacciones bancarias
exports.getAllTransacciones = async (req, res) => {
  try {
    const transacciones = await TransaccionBancaria.findAll({
      include: [
        { 
          model: CuentaBancaria, 
          as: 'cuenta',
          include: [
            { model: Banco, as: 'banco', attributes: ['ID_Banco', 'Nombre', 'Codigo'] },
            { model: Cliente, as: 'cliente', attributes: ['ID_Cliente', 'ID_Usuario'] }
          ]
        }
      ],
      order: [['Fecha_Transaccion', 'DESC']],
      limit: 100 // Limitar resultados para mejor rendimiento
    });
    
    return res.status(200).json({
      success: true,
      count: transacciones.length,
      data: transacciones
    });
  } catch (error) {
    console.error('Error al obtener transacciones bancarias:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener transacciones bancarias',
      message: error.message
    });
  }
};

// Obtener transacción bancaria por ID
exports.getTransaccionById = async (req, res) => {
  try {
    const transaccion = await TransaccionBancaria.findByPk(req.params.id, {
      include: [
        { 
          model: CuentaBancaria, 
          as: 'cuenta',
          include: [
            { model: Banco, as: 'banco', attributes: ['ID_Banco', 'Nombre', 'Codigo'] },
            { model: Cliente, as: 'cliente', attributes: ['ID_Cliente', 'ID_Usuario'] }
          ]
        },
        { 
          model: TransaccionBancaria, 
          as: 'transaccionRelacionada',
          include: [
            { 
              model: CuentaBancaria, 
              as: 'cuenta',
              attributes: ['ID_Cuenta', 'Numero_Cuenta'],
              include: [
                { model: Banco, as: 'banco', attributes: ['Nombre', 'Codigo'] }
              ]
            }
          ]
        }
      ]
    });
    
    if (!transaccion) {
      return res.status(404).json({
        success: false,
        error: 'Transacción bancaria no encontrada'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: transaccion
    });
  } catch (error) {
    console.error('Error al obtener transacción bancaria:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener transacción bancaria',
      message: error.message
    });
  }
};

// Obtener transacciones por cuenta
exports.getTransaccionesByCuenta = async (req, res) => {
  try {
    const { cuentaId } = req.params;
    
    const cuenta = await CuentaBancaria.findByPk(cuentaId);
    if (!cuenta) {
      return res.status(404).json({
        success: false,
        error: 'Cuenta bancaria no encontrada'
      });
    }
    
    const transacciones = await TransaccionBancaria.findAll({
      where: { ID_Cuenta: cuentaId },
      order: [['Fecha_Transaccion', 'DESC']],
      limit: 50 // Limitar para mejor rendimiento
    });
    
    return res.status(200).json({
      success: true,
      count: transacciones.length,
      data: transacciones
    });
  } catch (error) {
    console.error('Error al obtener transacciones de la cuenta:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener transacciones de la cuenta',
      message: error.message
    });
  }
};

// Realizar un depósito (aumenta el saldo)
exports.realizarDeposito = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { 
      ID_Cuenta, 
      Monto, 
      Descripcion,
      Referencia 
    } = req.body;
    
    // Validación básica
    if (!ID_Cuenta || !Monto || Monto <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere una cuenta válida y un monto positivo'
      });
    }
    
    // Obtener la cuenta
    const cuenta = await CuentaBancaria.findByPk(ID_Cuenta, { transaction: t });
    if (!cuenta) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: 'Cuenta bancaria no encontrada'
      });
    }
    
    // Verificar que la cuenta esté activa
    if (cuenta.Estado !== 'Activa') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `No se puede realizar depósitos a una cuenta ${cuenta.Estado.toLowerCase()}`
      });
    }
    
    // Calcular nuevo saldo
    const nuevoSaldo = parseFloat(cuenta.Saldo) + parseFloat(Monto);
    
    // Crear la transacción
    const transaccion = await TransaccionBancaria.create({
      ID_Cuenta,
      Tipo_Transaccion: 'Deposito',
      Monto,
      Saldo_Resultante: nuevoSaldo,
      Descripcion: Descripcion || 'Depósito',
      Referencia,
      Estado: 'Completada'
    }, { transaction: t });
    
    // Actualizar el saldo de la cuenta
    await cuenta.update({
      Saldo: nuevoSaldo,
      Fecha_Actualizacion: new Date()
    }, { transaction: t });
    
    await t.commit();
    
    return res.status(201).json({
      success: true,
      message: 'Depósito realizado exitosamente',
      data: {
        transaccion,
        saldoActual: nuevoSaldo
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al realizar depósito:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al realizar depósito',
      message: error.message
    });
  }
};

// Realizar un retiro (disminuye el saldo)
exports.realizarRetiro = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { 
      ID_Cuenta, 
      Monto, 
      Descripcion,
      Referencia 
    } = req.body;
    
    // Validación básica
    if (!ID_Cuenta || !Monto || Monto <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere una cuenta válida y un monto positivo'
      });
    }
    
    // Obtener la cuenta
    const cuenta = await CuentaBancaria.findByPk(ID_Cuenta, { transaction: t });
    if (!cuenta) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: 'Cuenta bancaria no encontrada'
      });
    }
    
    // Verificar que la cuenta esté activa
    if (cuenta.Estado !== 'Activa') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `No se puede realizar retiros de una cuenta ${cuenta.Estado.toLowerCase()}`
      });
    }
    
    // Verificar fondos suficientes
    if (parseFloat(cuenta.Saldo) < parseFloat(Monto)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Saldo insuficiente para realizar el retiro'
      });
    }
    
    // Calcular nuevo saldo
    const nuevoSaldo = parseFloat(cuenta.Saldo) - parseFloat(Monto);
    
    // Crear la transacción
    const transaccion = await TransaccionBancaria.create({
      ID_Cuenta,
      Tipo_Transaccion: 'Retiro',
      Monto,
      Saldo_Resultante: nuevoSaldo,
      Descripcion: Descripcion || 'Retiro',
      Referencia,
      Estado: 'Completada'
    }, { transaction: t });
    
    // Actualizar el saldo de la cuenta
    await cuenta.update({
      Saldo: nuevoSaldo,
      Fecha_Actualizacion: new Date()
    }, { transaction: t });
    
    await t.commit();
    
    return res.status(201).json({
      success: true,
      message: 'Retiro realizado exitosamente',
      data: {
        transaccion,
        saldoActual: nuevoSaldo
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al realizar retiro:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al realizar retiro',
      message: error.message
    });
  }
};

// Realizar una transferencia entre cuentas
exports.realizarTransferencia = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { 
      ID_Cuenta_Origen, 
      ID_Cuenta_Destino, 
      Monto, 
      Descripcion 
    } = req.body;
    
    // Validación básica
    if (!ID_Cuenta_Origen || !ID_Cuenta_Destino || !Monto || Monto <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos o el monto es inválido'
      });
    }
    
    // Verificar que las cuentas no sean la misma
    if (ID_Cuenta_Origen === ID_Cuenta_Destino) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'No se puede transferir a la misma cuenta'
      });
    }
    
    // Obtener la cuenta origen
    const cuentaOrigen = await CuentaBancaria.findByPk(ID_Cuenta_Origen, { transaction: t });
    if (!cuentaOrigen) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: 'Cuenta de origen no encontrada'
      });
    }
    
    // Obtener la cuenta destino
    const cuentaDestino = await CuentaBancaria.findByPk(ID_Cuenta_Destino, { transaction: t });
    if (!cuentaDestino) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: 'Cuenta de destino no encontrada'
      });
    }
    
    // Verificar que ambas cuentas estén activas
    if (cuentaOrigen.Estado !== 'Activa') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `No se puede realizar transferencias desde una cuenta ${cuentaOrigen.Estado.toLowerCase()}`
      });
    }
    
    if (cuentaDestino.Estado !== 'Activa') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `No se puede realizar transferencias a una cuenta ${cuentaDestino.Estado.toLowerCase()}`
      });
    }
    
    // Verificar fondos suficientes
    if (parseFloat(cuentaOrigen.Saldo) < parseFloat(Monto)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Saldo insuficiente para realizar la transferencia'
      });
    }
    
    // Calcular nuevos saldos
    const nuevoSaldoOrigen = parseFloat(cuentaOrigen.Saldo) - parseFloat(Monto);
    const nuevoSaldoDestino = parseFloat(cuentaDestino.Saldo) + parseFloat(Monto);
    
    // Crear la transacción de salida
    const transaccionSalida = await TransaccionBancaria.create({
      ID_Cuenta: ID_Cuenta_Origen,
      Tipo_Transaccion: 'Transferencia',
      Monto,
      Saldo_Resultante: nuevoSaldoOrigen,
      Descripcion: `${Descripcion || 'Transferencia'} (Enviada)`,
      Referencia: `A ${cuentaDestino.Numero_Cuenta}`,
      Estado: 'Completada'
    }, { transaction: t });
    
    // Crear la transacción de entrada
    const transaccionEntrada = await TransaccionBancaria.create({
      ID_Cuenta: ID_Cuenta_Destino,
      Tipo_Transaccion: 'Transferencia',
      Monto,
      Saldo_Resultante: nuevoSaldoDestino,
      Descripcion: `${Descripcion || 'Transferencia'} (Recibida)`,
      Referencia: `Desde ${cuentaOrigen.Numero_Cuenta}`,
      Estado: 'Completada',
      ID_Transaccion_Relacionada: transaccionSalida.ID_Transaccion
    }, { transaction: t });
    
    // Relacionar la transacción de salida con la de entrada
    await transaccionSalida.update({
      ID_Transaccion_Relacionada: transaccionEntrada.ID_Transaccion
    }, { transaction: t });
    
    // Actualizar saldos de ambas cuentas
    await cuentaOrigen.update({
      Saldo: nuevoSaldoOrigen,
      Fecha_Actualizacion: new Date()
    }, { transaction: t });
    
    await cuentaDestino.update({
      Saldo: nuevoSaldoDestino,
      Fecha_Actualizacion: new Date()
    }, { transaction: t });
    
    await t.commit();
    
    return res.status(201).json({
      success: true,
      message: 'Transferencia realizada exitosamente',
      data: {
        origen: {
          cuenta: cuentaOrigen.Numero_Cuenta,
          saldoActual: nuevoSaldoOrigen,
          transaccion: transaccionSalida.ID_Transaccion
        },
        destino: {
          cuenta: cuentaDestino.Numero_Cuenta,
          saldoActual: nuevoSaldoDestino,
          transaccion: transaccionEntrada.ID_Transaccion
        }
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al realizar transferencia:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al realizar transferencia',
      message: error.message
    });
  }
};

// Obtener estado de cuenta (historial de transacciones con filtros)
exports.getEstadoCuenta = async (req, res) => {
  try {
    const { cuentaId } = req.params;
    const { fechaInicio, fechaFin, tipo } = req.query;
    
    // Verificar que la cuenta existe
    const cuenta = await CuentaBancaria.findByPk(cuentaId, {
      include: [
        { model: Banco, as: 'banco', attributes: ['ID_Banco', 'Nombre', 'Codigo'] },
        { model: Cliente, as: 'cliente', attributes: ['ID_Cliente', 'ID_Usuario'] }
      ]
    });
    
    if (!cuenta) {
      return res.status(404).json({
        success: false,
        error: 'Cuenta bancaria no encontrada'
      });
    }
    
    // Construir condiciones de búsqueda
    const whereCondition = { ID_Cuenta: cuentaId };
    
    // Filtrar por tipo si se proporciona
    if (tipo) {
      whereCondition.Tipo_Transaccion = tipo;
    }
    
    // Filtrar por rango de fechas si se proporciona
    if (fechaInicio && fechaFin) {
      whereCondition.Fecha_Transaccion = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
      };
    } else if (fechaInicio) {
      whereCondition.Fecha_Transaccion = {
        [Op.gte]: new Date(fechaInicio)
      };
    } else if (fechaFin) {
      whereCondition.Fecha_Transaccion = {
        [Op.lte]: new Date(fechaFin)
      };
    }
    
    // Obtener transacciones
    const transacciones = await TransaccionBancaria.findAll({
      where: whereCondition,
      order: [['Fecha_Transaccion', 'DESC']],
      limit: 100 // Limitar para mejor rendimiento
    });
    
    // Calcular totales por tipo de transacción
    const totales = {
      Deposito: 0,
      Retiro: 0,
      Transferencia: 0,
      Pago: 0,
      Cargo: 0
    };
    
    transacciones.forEach(t => {
      if (t.Estado === 'Completada') {
        totales[t.Tipo_Transaccion] += parseFloat(t.Monto);
      }
    });
    
    return res.status(200).json({
      success: true,
      cuenta: {
        numero: cuenta.Numero_Cuenta,
        tipo: cuenta.Tipo_Cuenta,
        banco: cuenta.banco.Nombre,
        saldoActual: cuenta.Saldo
      },
      totales,
      count: transacciones.length,
      transacciones
    });
  } catch (error) {
    console.error('Error al obtener estado de cuenta:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener estado de cuenta',
      message: error.message
    });
  }
};