const express = require('express');
const router = express.Router();
const tarjetaController = require('../controllers/tarjetaController');

// Rutas para tarjetas
router.get('/', tarjetaController.getAllTarjetas);
router.get('/:id', tarjetaController.getTarjetaById);
router.get('/cliente/:clienteId', tarjetaController.getTarjetasByCliente);
router.post('/', tarjetaController.createTarjeta);
router.put('/:id', tarjetaController.updateTarjeta);
router.post('/:id/estado', tarjetaController.cambiarEstadoTarjeta);
router.post('/validar', tarjetaController.validarTarjeta);

module.exports = router;