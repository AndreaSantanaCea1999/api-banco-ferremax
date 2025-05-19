// src/routes/pagoBancarioRoutes.js
const express = require('express');
const router = express.Router();
const pagoBancarioController = require('../controllers/pagoBancarioController');

// Rutas CRUD para pagos bancarios
router.get('/', pagoBancarioController.getAllPagosBancarios);
router.get('/:id', pagoBancarioController.getPagoBancarioById);
router.get('/pago/:pagoId', pagoBancarioController.getPagosBancariosByPago);
router.post('/', pagoBancarioController.createPagoBancario);
router.put('/:id', pagoBancarioController.updatePagoBancario);
router.post('/:id/anular', pagoBancarioController.anularPagoBancario);

// Ruta de integración con API Inventario
router.post('/procesar-pago-pedido', pagoBancarioController.procesarPagoPedido);

module.exports = router;