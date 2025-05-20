const { TiposCambio, Divisas } = require('../models');
const bancoCentralService = require('../services/bancoCentralService');

// Obtener todos los tipos de cambio
const getAllTiposCambio = async (req, res) => {
  try {
    const tiposCambio = await TiposCambio.findAll({
      include: [
        { model: Divisas, as: 'DivisaOrigen' },
        { model: Divisas, as: 'DivisaDestino' }
      ]
    });
    res.status(200).json(tiposCambio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener tipo de cambio para una fecha y par de divisas
const getTipoCambio = async (req, res) => {
  try {
    const { origen, destino, fecha } = req.query;
    
    if (!origen || !destino) {
      return res.status(400).json({ message: 'Se requieren los códigos de divisa origen y destino' });
    }
    
    const fechaBusqueda = fecha ? new Date(fecha) : new Date();
    
    // Buscar las divisas por código
    const divisaOrigen = await Divisas.findOne({ where: { Codigo: origen } });
    const divisaDestino = await Divisas.findOne({ where: { Codigo: destino } });
    
    if (!divisaOrigen || !divisaDestino) {
      return res.status(404).json({ message: 'Una o ambas divisas no encontradas' });
    }
    
    // Buscar tipo de cambio en la base de datos
    const tipoCambio = await TiposCambio.findOne({
      where: {
        ID_Divisa_Origen: divisaOrigen.ID_Divisa,
        ID_Divisa_Destino: divisaDestino.ID_Divisa,
        Fecha: fechaBusqueda
      },
      include: [
        { model: Divisas, as: 'DivisaOrigen' },
        { model: Divisas, as: 'DivisaDestino' }
      ]
    });
    
    // Si existe, retornarlo
    if (tipoCambio) {
      return res.status(200).json(tipoCambio);
    }
    
    // Si no existe, consultar a la API del Banco Central y guardar el resultado
    const tasaCambio = await bancoCentralService.obtenerTipoCambio(origen, destino, fechaBusqueda);
    
    const nuevoTipoCambio = await TiposCambio.create({
      ID_Divisa_Origen: divisaOrigen.ID_Divisa,
      ID_Divisa_Destino: divisaDestino.ID_Divisa,
      Fecha: fechaBusqueda,
      Tasa_Cambio: tasaCambio,
      Fuente: 'Banco Central de Chile'
    });
    
    const tipoCambioCompleto = await TiposCambio.findByPk(nuevoTipoCambio.ID_Tipo_Cambio, {
      include: [
        { model: Divisas, as: 'DivisaOrigen' },
        { model: Divisas, as: 'DivisaDestino' }
      ]
    });
    
    res.status(200).json(tipoCambioCompleto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Convertir monto entre divisas
const convertirMonto = async (req, res) => {
  try {
    const { monto, origen, destino, fecha } = req.body;
    
    if (!monto || !origen || !destino) {
      return res.status(400).json({ message: 'Se requieren monto, divisa origen y divisa destino' });
    }
    
    const fechaConversion = fecha ? new Date(fecha) : new Date();
    
    // Obtener tipo de cambio
    const resultado = await bancoCentralService.convertirMonto(monto, origen, destino, fechaConversion);
    
    res.status(200).json({
      montoOriginal: parseFloat(monto),
      divisaOrigen: origen,
      montoConvertido: resultado.montoConvertido,
      divisaDestino: destino,
      tasaCambio: resultado.tasaCambio,
      fecha: fechaConversion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar tipos de cambio desde Banco Central
const actualizarTiposCambio = async (req, res) => {
  try {
    const resultado = await bancoCentralService.actualizarTiposCambio();
    
    res.status(200).json({
      message: 'Tipos de cambio actualizados correctamente',
      actualizados: resultado.actualizados,
      errores: resultado.errores
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllTiposCambio,
  getTipoCambio,
  convertirMonto,
  actualizarTiposCambio
};