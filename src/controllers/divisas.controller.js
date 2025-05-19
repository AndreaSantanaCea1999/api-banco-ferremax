// src/controllers/divisas.controller.js
const bancoCentralService = require('../services/bancoCentral.service');
const pool = require('../config/database');

/**
 * Obtiene la tasa actual del dólar desde el Banco Central
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerTasaDolarActual = async (req, res) => {
  try {
    const tasaDolar = await bancoCentralService.getDolarRate();
    
    if (!tasaDolar || !tasaDolar.valor) {
      return res.status(500).json({
        error: 'Error al obtener tasa de dólar',
        message: 'No se pudo obtener la tasa actual del dólar'
      });
    }
    
    // Actualizar tasa en base de datos para USD
    try {
      await pool.execute(
        'UPDATE DIVISAS SET Tasa_Conversion = ?, Fecha_Actualizacion = NOW() WHERE Codigo = ?',
        [tasaDolar.valor, 'USD']
      );
      console.log('Tasa de dólar actualizada en la base de datos:', tasaDolar.valor);
    } catch (dbError) {
      console.error('Error al actualizar tasa de dólar en la base de datos:', dbError);
      // No fallar la petición por esto, seguir adelante
    }
    
    res.status(200).json({
      codigo: 'USD',
      valor: tasaDolar.valor,
      fecha: tasaDolar.fecha
    });
  } catch (error) {
    console.error('Error al obtener tasa del dólar:', error);
    res.status(500).json({
      error: 'Error al obtener tasa de dólar',
      message: error.message
    });
  }
};

/**
 * Convierte un monto entre divisas
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.convertirMoneda = async (req, res) => {
  try {
    const { monto, desde, hacia } = req.body;
    
    // Validar parámetros
    if (!monto || isNaN(monto) || monto <= 0) {
      return res.status(400).json({
        error: 'Parámetro inválido',
        message: 'El monto debe ser un número positivo'
      });
    }
    
    if (!desde || !hacia) {
      return res.status(400).json({
        error: 'Parámetros incompletos',
        message: 'Se requieren los códigos de divisa de origen (desde) y destino (hacia)'
      });
    }
    
    // Obtener tasas de conversión desde la base de datos
    const [divisas] = await pool.execute(
      'SELECT Codigo, Tasa_Conversion FROM DIVISAS WHERE Codigo IN (?, ?)',
      [desde, hacia]
    );
    
    if (divisas.length < 2) {
      return res.status(400).json({
        error: 'Divisas no encontradas',
        message: 'Una o ambas divisas no están registradas en el sistema'
      });
    }
    
    // Encontrar las tasas correspondientes
    const tasaDesde = divisas.find(d => d.Codigo === desde)?.Tasa_Conversion;
    const tasaHacia = divisas.find(d => d.Codigo === hacia)?.Tasa_Conversion;
    
    if (!tasaDesde || !tasaHacia) {
      return res.status(400).json({
        error: 'Tasas no disponibles',
        message: 'No se encontraron tasas de conversión para las divisas especificadas'
      });
    }
    
    // Realizar la conversión
    // 1. Convertir a la moneda base (CLP)
    const montoEnCLP = monto * tasaDesde;
    // 2. Convertir de CLP a la moneda destino
    const montoFinal = montoEnCLP / tasaHacia;
    
    // Devolver resultado
    res.status(200).json({
      montoOriginal: monto,
      divisaOrigen: desde,
      divisaDestino: hacia,
      tasaOrigen: tasaDesde,
      tasaDestino: tasaHacia,
      resultado: parseFloat(montoFinal.toFixed(2)),
      fecha: new Date()
    });
  } catch (error) {
    console.error('Error al convertir moneda:', error);
    res.status(500).json({
      error: 'Error al convertir moneda',
      message: error.message
    });
  }
};

/**
 * Lista todas las divisas disponibles
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.listarDivisas = async (req, res) => {
  try {
    const [divisas] = await pool.execute(
      'SELECT ID_Divisa, Codigo, Nombre, Tasa_Conversion, Fecha_Actualizacion, Divisa_Base FROM DIVISAS ORDER BY Divisa_Base DESC, Codigo'
    );
    
    res.status(200).json({
      total: divisas.length,
      divisas
    });
  } catch (error) {
    console.error('Error al listar divisas:', error);
    res.status(500).json({
      error: 'Error al obtener lista de divisas',
      message: error.message
    });
  }
};

/**
 * Obtiene una divisa específica por su código
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerDivisaPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;
    
    const [divisas] = await pool.execute(
      'SELECT ID_Divisa, Codigo, Nombre, Tasa_Conversion, Fecha_Actualizacion, Divisa_Base FROM DIVISAS WHERE Codigo = ?',
      [codigo]
    );
    
    if (divisas.length === 0) {
      return res.status(404).json({
        error: 'Divisa no encontrada',
        message: `No se encontró una divisa con el código ${codigo}`
      });
    }
    
    res.status(200).json(divisas[0]);
  } catch (error) {
    console.error(`Error al obtener divisa ${req.params.codigo}:`, error);
    res.status(500).json({
      error: 'Error al obtener divisa',
      message: error.message
    });
  }
};

/**
 * Actualiza la tasa de una divisa
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.actualizarTasaDivisa = async (req, res) => {
  try {
    const { codigo } = req.params;
    const { tasa } = req.body;
    
    // Validar que la tasa sea un número positivo
    if (!tasa || isNaN(tasa) || tasa <= 0) {
      return res.status(400).json({
        error: 'Tasa inválida',
        message: 'La tasa de conversión debe ser un número positivo'
      });
    }
    
    // Verificar si la divisa existe
    const [divisas] = await pool.execute(
      'SELECT ID_Divisa FROM DIVISAS WHERE Codigo = ?',
      [codigo]
    );
    
    if (divisas.length === 0) {
      return res.status(404).json({
        error: 'Divisa no encontrada',
        message: `No se encontró una divisa con el código ${codigo}`
      });
    }
    
    // Actualizar la tasa
    await pool.execute(
      'UPDATE DIVISAS SET Tasa_Conversion = ?, Fecha_Actualizacion = NOW() WHERE Codigo = ?',
      [tasa, codigo]
    );
    
    // Obtener la divisa actualizada
    const [divisaActualizada] = await pool.execute(
      'SELECT ID_Divisa, Codigo, Nombre, Tasa_Conversion, Fecha_Actualizacion, Divisa_Base FROM DIVISAS WHERE Codigo = ?',
      [codigo]
    );
    
    res.status(200).json({
      mensaje: `Tasa de ${codigo} actualizada correctamente`,
      divisa: divisaActualizada[0]
    });
  } catch (error) {
    console.error(`Error al actualizar tasa de divisa ${req.params.codigo}:`, error);
    res.status(500).json({
      error: 'Error al actualizar tasa de divisa',
      message: error.message
    });
  }
};

module.exports = {
  obtenerTasaDolarActual,
  convertirMoneda,
  listarDivisas,
  obtenerDivisaPorCodigo,
  actualizarTasaDivisa
};
Claude
