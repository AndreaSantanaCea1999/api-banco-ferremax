const express = require('express');
const router = express.Router();
const sucursalController = require('../controllers/sucursal.controller');
const { validarCrearSucursal, validarActualizarSucursal } = require('../middlewares/validators/sucursal.validator');

// Rutas para sucursales
router.get('/', sucursalController.obtenerSucursales);
router.get('/:id', sucursalController.obtenerSucursalPorId);
router.post('/', validarCrearSucursal, sucursalController.crearSucursal);
router.patch('/:id', validarActualizarSucursal, sucursalController.actualizarSucursal);
router.delete('/:id', sucursalController.eliminarSucursal);
router.get('/:id/estadisticas', sucursalController.obtenerEstadisticasSucursal);

module.exports = router;