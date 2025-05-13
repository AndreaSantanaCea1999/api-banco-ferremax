console.log('Cargando rutas de divisas...');

const express = require('express');
const router = express.Router();
const divisasController = require('../controllers/divisas.controller'); // Asegúrate que la ruta al controlador sea correcta

// Ruta para obtener la tasa del dólar
router.get('/dolar', divisasController.obtenerTasaDolarActual); // Verifica que el método sea 'obtenerTasaDolarActual' o como lo hayas llamado

// Ruta para convertir divisas
router.post('/convertir', divisasController.convertirMoneda);

module.exports = router;
