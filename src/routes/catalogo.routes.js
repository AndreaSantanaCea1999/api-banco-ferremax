// src/routes/catalogo.routes.js
const express = require('express');
const router = express.Router();
const catalogoController = require('../controllers/catalogo.controller');

// Rutas de productos del catálogo
router.get('/productos', catalogoController.obtenerProductos);
router.get('/productos/buscar', catalogoController.buscarProductos);
router.get('/productos/categoria/:categoriaId', catalogoController.obtenerProductosPorCategoria);
router.get('/productos/marca/:marcaId', catalogoController.obtenerProductosPorMarca);
router.get('/productos/:id', catalogoController.obtenerProductoPorId);

module.exports = router;