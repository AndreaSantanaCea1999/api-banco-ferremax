// src/routes/clientes.routes.js
const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/cliente.controller');

// Rutas para clientes
router.get('/', clienteController.obtenerClientes);
router.get('/:id', clienteController.obtenerClientePorId);
router.post('/', clienteController.crearCliente);
router.patch('/:id', clienteController.actualizarCliente);
router.delete('/:id', clienteController.eliminarCliente);
router.get('/:id/pedidos', clienteController.obtenerPedidosCliente);

module.exports = router;