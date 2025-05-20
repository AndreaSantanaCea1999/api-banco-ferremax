const express = require('express');
const router = express.Router();
const detallesPedidoController = require('../controllers/detallesPedidoController');

// Rutas para detalles de pedido
router.get('/pedido/:pedidoId', detallesPedidoController.getDetallesByPedidoId);
router.patch('/:id/estado', detallesPedidoController.updateEstadoDetalle);

module.exports = router;