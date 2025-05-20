const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagosController');

// Rutas para pagos
router.get('/', pagosController.getAllPagos);
router.get('/pedido/:pedidoId', pagosController.getPagosByPedidoId);
router.post('/', pagosController.createPago);
router.patch('/:id/estado', pagosController.updateEstadoPago);

module.exports = router;