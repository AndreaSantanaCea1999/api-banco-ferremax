const express = require('express');
const router = express.Router();
const webpayController = require('../controllers/webpayController');

// Rutas para WebPay
router.post('/iniciar', webpayController.iniciarTransaccion);
router.post('/confirmar', webpayController.confirmarTransaccion);

module.exports = router;