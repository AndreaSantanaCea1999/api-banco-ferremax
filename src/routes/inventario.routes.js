const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventario.controller');

// Rutas para verificación de stock
router.get('/stock', inventarioController.verificarStock);

// Rutas para actualización de inventario (integración con API de inventario)
router.patch('/:id', inventarioController.actualizarInventario);

module.exports = router;