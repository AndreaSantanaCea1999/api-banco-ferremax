// c:\Users\andre\api-banco-ferremax\src\routes\divisas.routes.js

const express = require('express');
const router = express.Router();
const divisasController = require('../controllers/divisas.controller');

// Ruta para obtener el valor del dólar
// GET /api/divisas/valor-dolar
router.get('/valor-dolar', divisasController.obtenerValorDolar);

// Ruta para convertir un monto de USD a CLP
// POST /api/divisas/convertir
router.post('/convertir', divisasController.convertirMonto);

module.exports = router;
