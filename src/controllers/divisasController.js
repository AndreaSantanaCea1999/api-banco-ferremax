// src/controllers/divisasController.js
const bancoCentralService = require('../services/bancoCentralService');

// GET /api/v1/divisas/tipos-cambio
async function obtenerTiposCambio(req, res) {
  try {
    console.log('💱 [obtenerTiposCambio] Consultando tipos de cambio...');
    
    const tiposCambio = await bancoCentralService.obtenerTiposCambio();
    
    return res.status(200).json({
      success: true,
      message: 'Tipos de cambio obtenidos exitosamente',
      data: tiposCambio.data
    });
    
  } catch (error) {
    console.error('❌ Error en obtenerTiposCambio:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener tipos de cambio',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// POST /api/v1/divisas/convertir
async function convertirMonto(req, res) {
  try {
    const { monto, divisa_origen, divisa_destino } = req.body;
    
    if (!monto || !divisa_origen || !divisa_destino) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros requeridos: monto, divisa_origen, divisa_destino'
      });
    }
    
    if (isNaN(monto) || monto <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser un número positivo'
      });
    }
    
    console.log(`💱 [convertirMonto] ${monto} ${divisa_origen} → ${divisa_destino}`);
    
    const conversion = await bancoCentralService.convertirDivisa(monto, divisa_origen, divisa_destino);
    
    return res.status(200).json({
      success: true,
      message: 'Conversión realizada exitosamente',
      data: conversion
    });
    
  } catch (error) {
    console.error('❌ Error en convertirMonto:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al convertir monto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = {
  obtenerTiposCambio,
  convertirMonto
};