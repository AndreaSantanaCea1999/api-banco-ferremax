// src/routes/transbankRoutes.js
const express = require('express');
const router = express.Router();
const transbankController = require('../controllers/transbankController');

// Rutas para transacciones Transbank
router.get('/', transbankController.getAllTransacciones);
router.get('/:id', transbankController.getTransaccionById);
router.get('/token/:token', transbankController.getEstadoTransaccion);
router.post('/iniciar', transbankController.iniciarTransaccion);
router.post('/confirmar', transbankController.confirmarTransaccion);
router.post('/anular', transbankController.anularTransaccion);

module.exports = router;