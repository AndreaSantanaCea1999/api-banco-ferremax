const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventario.controller'); // Ajusta la ruta

// Endpoint para verificar stock
router.get('/stock', inventarioController.verificarStock);

// Endpoint para actualizar un registro de inventario por su ID
router.patch('/:id', inventarioController.actualizarInventario);

module.exports = router;
