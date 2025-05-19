// src/routes/divisas.routes.js
const express = require('express');
const router = express.Router();
const divisasController = require('../controllers/divisas.controller');

// Rutas para obtención de tasas
router.get('/dolar', divisasController.obtenerTasaDolarActual);
router.get('/', divisasController.listarDivisas);
router.get('/:codigo', divisasController.obtenerDivisaPorCodigo);

// Rutas para conversión
router.post('/convertir', divisasController.convertirMoneda);

// Rutas de administración (deberían estar protegidas con autenticación)
router.patch('/:codigo/tasa', divisasController.actualizarTasaDivisa);

module.exports = router;