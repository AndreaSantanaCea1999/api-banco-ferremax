const express = require('express');
const router = express.Router();
const webpayController = require('../controllers/webpayController');

// Asegúrate de que todas estas funciones están definidas en el controlador
router.post('/iniciar', webpayController.iniciarTransaccion);
router.post('/confirmar', webpayController.confirmarTransaccion);
router.post('/estado-transaccion', webpayController.verificarEstadoTransaccion);

module.exports = router;