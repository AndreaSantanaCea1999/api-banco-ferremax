const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventario.controller'); // Ajusta la ruta

// Endpoint para verificar stock
router.get('/stock', inventarioController.verificarStock);

module.exports = router;
