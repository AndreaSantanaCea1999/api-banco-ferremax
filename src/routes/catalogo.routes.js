const express = require('express');
const router = express.Router(); // Creates an instance of a router
const catalogoController = require('../controllers/catalogo.controller');

router.get('/productos', catalogoController.obtenerProductos);
router.get('/productos/:id', catalogoController.obtenerProductoPorId);

module.exports = router; // Exports the router instance
