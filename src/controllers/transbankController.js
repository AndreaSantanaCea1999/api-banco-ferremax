// src/controllers/transbankController.js
const { TransbankTransaccion, PagoBancario, Pagos, Tarjeta, CuentaBancaria, TransaccionBancaria } = require('../models/indexBanco');
const { sequelize } = require('../config/database');
const crypto = require('crypto');

// Constantes para simulación
const CODIGO_COMERCIO = 'FERREMAS_WEBPAY_001';
const URL_WEBPAY = 'https://webpay.transbank.cl/api/simulacion';

// Función para generar un token único
const generarToken = () => {
  return crypto.randomUUID();
};

// Iniciar transacción Transbank
exports.iniciarTransaccion = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { 
      ID_Pago, 
      Monto, 
      URL_Retorno 
    } = req.body;
    
    // Validación básica
    if (!ID_Pago || !Monto || !URL_Retorno) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos obligatorios'
      });
    }
    
    // Verificar que el pago existe
    const pago = await Pagos.findByPk(ID_Pago, { transaction: t });
    if (!pago) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: 'Pago no encontrado'
      });
    }
    
    // Verificar que el pago esté en estado pendiente
    if (pago.Estado !== 'Pendiente') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `No se puede iniciar una transacción para un pago en estado ${pago.Estado}`
      });
    }
    
    // Verificar si ya existe una transacción para este pago
    const transaccionExistente = await TransbankTransaccion.findOne({
      where: { 
        ID_Pago,
        Estado: {
          [Op.in]: ['Iniciada', 'Confirmada']
        }
      },
      transaction: t
    });
    
    if (transaccionExistente) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Ya existe una transacción activa para este pago',
        data: {
          ID_Transbank: transaccionExistente.ID_Transbank,
          Token_Transaccion: transaccionExistente.Token_Transaccion,
          Estado: transaccionExistente.Estado
        }
      });
    }
    
    // Generar token único para la transacción
    const tokenTransaccion = generarToken();
    
    // Generar número de orden único
    const numeroOrden = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // Crear la transacción en Transbank (simulación)
    const respuestaTransbank = {
      token: tokenTransaccion,
      url: `${URL_WEBPAY}?token=${tokenTransaccion}`,
      codigo_comercio: CODIGO_COMERCIO,
      orden_compra: numeroOrden,
      fecha_transaccion: new Date().toISOString(),
      estado: 'INICIADA'
    };
    
    // Registrar la transacción en la base de datos
    const nuevaTransaccion = await TransbankTransaccion.create({
      ID_Pago,
      Token_Transaccion: tokenTransaccion,
      Codigo_Comercio: CODIGO_COMERCIO,
      Numero_Orden: numeroOrden,
      Monto,
      URL_Retorno,
      Estado: 'Iniciada',
      JSON_Respuesta: JSON.stringify(respuestaTransbank)
    }, { transaction: t });
    
    // Actualizar el estado del pago
    await pago.update({
      Estado: 'Procesando',
      Procesador_Pago: 'Transbank',
      Numero_Transaccion: tokenTransaccion
    }, { transaction: t });
    
    await t.commit();
    
    return res.status(201).json({
      success: true,
      message: 'Transacción Transbank iniciada exitosamente',
      data: {
        ID_Transbank: nuevaTransaccion.ID_Transbank,
        Token_Transaccion: tokenTransaccion,
        URL_Redireccion: respuestaTransbank.url,
        Orden_Compra: numeroOrden
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al iniciar transacción Transbank:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al iniciar transacción Transbank',
      message: error.message
    });
  }
};

// Confirmar transacción Transbank
exports.confirmarTransaccion = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { 
      Token_Transaccion, 
      Resultado,
      Tarjeta_Tipo = 'Credito',
      Tarjeta_Numero 
    } = req.body;
    
    // Validación básica
    if (!Token_Transaccion || !Resultado) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos obligatorios'
      });
    }
    
    // Verificar que la transacción existe
    const transaccion = await TransbankTransaccion.findOne({
      where: { Token_Transaccion },
      include: [
        { model: Pagos, as: 'pago' }
      ],
      transaction: t
    });
    
    if (!transaccion) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: 'Transacción no encontrada'
      });
    }
    
    // Verificar que la transacción esté en estado iniciada
    if (transaccion.Estado !== 'Iniciada') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `No se puede confirmar una transacción en estado ${transaccion.Estado}`
      });
    }
    
    // Procesar el resultado
    if (Resultado === 'APROBADA') {
      // Generar código de autorización aleatorio
      const codigoAutorizacion = `AUTH-${Math.floor(Math.random() * 1000000)}`;
      
      // Crear registro en PAGOS_BANCARIOS
      const pagoBancario = await PagoBancario.create({
        ID_Pago: transaccion.ID_Pago,
        Tipo_Pago: `Tarjeta_${Tarjeta_Tipo}`,
        Codigo_Autorizacion: codigoAutorizacion,
        Estado: 'Aprobado'
      }, { transaction: t });
      
      // Actualizar la transacción
      await transaccion.update({
        Estado: 'Confirmada',
        ID_Pago_Bancario: pagoBancario.ID_Pago_Bancario,
        JSON_Respuesta: JSON.stringify({
          resultado: Resultado,
          codigo_autorizacion: codigoAutorizacion,
          tarjeta_tipo: Tarjeta_Tipo,
          tarjeta_numero: Tarjeta_Numero ? `XXXX-XXXX-XXXX-${Tarjeta_Numero.slice(-4)}` : 'XXXX-XXXX-XXXX-1234',
          fecha_confirmacion: new Date().toISOString()
        })
      }, { transaction: t });
      
      // Actualizar el pago
      await transaccion.pago.update({
        Estado: 'Completado'
      }, { transaction: t });
      
      await t.commit();
      
      return res.status(200).json({
        success: true,
        message: 'Transacción confirmada exitosamente',
        data: {
          ID_Transbank: transaccion.ID_Transbank,
          ID_Pago: transaccion.ID_Pago,
          Codigo_Autorizacion: codigoAutorizacion,
          Estado: 'Confirmada'
        }
      });
    } else {
      // Transacción fallida
      await transaccion.update({
        Estado: 'Fallida',
        JSON_Respuesta: JSON.stringify({
          resultado: Resultado,
          mensaje: 'Transacción rechazada por el banco emisor',
          fecha_rechazo: new Date().toISOString()
        })
      }, { transaction: t });
      
      // Actualizar el pago
      await transaccion.pago.update({
        Estado: 'Rechazado'
      }, { transaction: t });
      
      await t.commit();
      
      return res.status(200).json({
        success: true,
        message: 'Transacción rechazada',
        data: {
          ID_Transbank: transaccion.ID_Transbank,
          ID_Pago: transaccion.ID_Pago,
          Estado: 'Fallida',
          Motivo: 'Rechazada por el banco emisor'
        }
      });
    }
  } catch (error) {
    await t.rollback();
    console.error('Error al confirmar transacción Transbank:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al confirmar transacción Transbank',
      message: error.message
    });
  }
};

// Anular transacción Transbank
exports.anularTransaccion = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { 
      ID_Transbank, 
      Motivo 
    } = req.body;
    
    // Validación básica
    if (!ID_Transbank) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere el ID de la transacción'
      });
    }
    
    // Verificar que la transacción existe
    const transaccion = await TransbankTransaccion.findByPk(ID_Transbank, {
      include: [
        { model: Pagos, as: 'pago' },
        { model: PagoBancario, as: 'pagoBancario' }
      ],
      transaction: t
    });
    
    if (!transaccion) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: 'Transacción no encontrada'
      });
    }
    
    // Verificar que la transacción se pueda anular (solo si está confirmada)
    if (transaccion.Estado !== 'Confirmada') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `No se puede anular una transacción en estado ${transaccion.Estado}`
      });
    }
    
    // Anular la transacción
    await transaccion.update({
      Estado: 'Anulada',
      JSON_Respuesta: JSON.stringify({
        resultado: 'ANULADA',
        motivo: Motivo || 'Anulación solicitada por el comercio',
        fecha_anulacion: new Date().toISOString()
      })
    }, { transaction: t });
    
    // Actualizar el pago bancario si existe
    if (transaccion.pagoBancario) {
      await transaccion.pagoBancario.update({
        Estado: 'Anulado'
      }, { transaction: t });
    }
    
    // Actualizar el pago
    await transaccion.pago.update({
      Estado: 'Anulado'
    }, { transaction: t });
    
    await t.commit();
    
    return res.status(200).json({
      success: true,
      message: 'Transacción anulada exitosamente',
      data: {
        ID_Transbank: transaccion.ID_Transbank,
        ID_Pago: transaccion.ID_Pago,
        Estado: 'Anulada'
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al anular transacción Transbank:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al anular transacción Transbank',
      message: error.message
    });
  }
};

// Obtener todas las transacciones Transbank
exports.getAllTransacciones = async (req, res) => {
  try {
    const transacciones = await TransbankTransaccion.findAll({
      include: [
        { model: Pagos, as: 'pago' },
        { model: PagoBancario, as: 'pagoBancario' }
      ],
      order: [['Fecha_Transaccion', 'DESC']],
      limit: 100 // Limitar para mejor rendimiento
    });
    
    return res.status(200).json({
      success: true,
      count: transacciones.length,
      data: transacciones
    });
  } catch (error) {
    console.error('Error al obtener transacciones Transbank:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener transacciones Transbank',
      message: error.message
    });
  }
};

// Obtener transacción Transbank por ID
exports.getTransaccionById = async (req, res) => {
  try {
    const transaccion = await TransbankTransaccion.findByPk(req.params.id, {
      include: [
        { 
          model: Pagos, 
          as: 'pago'
        },
        { 
          model: PagoBancario, 
          as: 'pagoBancario'
        }
      ]
    });
    
    if (!transaccion) {
      return res.status(404).json({
        success: false,
        error: 'Transacción Transbank no encontrada'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: transaccion
    });
  } catch (error) {
    console.error('Error al obtener transacción Transbank:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener transacción Transbank',
      message: error.message
    });
  }
};

// Obtener estado de una transacción por token
exports.getEstadoTransaccion = async (req, res) => {
  try {
    const { token } = req.params;
    
    const transaccion = await TransbankTransaccion.findOne({
      where: { Token_Transaccion: token },
      include: [
        { model: Pagos, as: 'pago' },
        { model: PagoBancario, as: 'pagoBancario' }
      ]
    });
    
    if (!transaccion) {
      return res.status(404).json({
        success: false,
        error: 'Transacción no encontrada'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        ID_Transbank: transaccion.ID_Transbank,
        ID_Pago: transaccion.ID_Pago,
        Monto: transaccion.Monto,
        Estado: transaccion.Estado,
        Fecha_Transaccion: transaccion.Fecha_Transaccion,
        Estado_Pago: transaccion.pago.Estado
      }
    });
  } catch (error) {
    console.error('Error al obtener estado de transacción:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener estado de transacción',
      message: error.message
    });
  }
};