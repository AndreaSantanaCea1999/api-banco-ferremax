// src/routes/cuentaBancariaRoutes.js
const express = require('express');
const router = express.Router();
const cuentaBancariaController = require('../controllers/cuentaBancariaController');

// Rutas para cuentas bancarias
router.get('/', cuentaBancariaController.getAllCuentas);
router.get('/:id', cuentaBancariaController.getCuentaById);
router.get('/cliente/:clienteId', cuentaBancariaController.getCuentasByCliente);
router.post('/', cuentaBancariaController.createCuenta);
router.put('/:id', cuentaBancariaController.updateCuenta);
router.delete('/:id', cuentaBancariaController.deleteCuenta);

module.exports = router;