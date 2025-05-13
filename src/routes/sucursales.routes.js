const express = require('express');
const router = express.Router();
const sucursalController = require('../controllers/sucursal.controller');
const { validarCrearSucursal, validarActualizarSucursal } = require('../middlewares/validators/sucursal.validator');

// GET /api/sucursales - Obtener todas las sucursales
router.get('/', sucursalController.obtenerSucursales);

// POST /api/sucursales - Crear una nueva sucursal
router.post('/', validarCrearSucursal, sucursalController.crearSucursal);

// GET /api/sucursales/:id - Obtener una sucursal por ID
router.get('/:id', sucursalController.obtenerSucursalPorId);

// PATCH /api/sucursales/:id - Actualizar una sucursal por ID
router.patch('/:id', validarActualizarSucursal, sucursalController.actualizarSucursal);

// DELETE /api/sucursales/:id - Eliminar una sucursal por ID (lógica o física)
router.delete('/:id', sucursalController.eliminarSucursal);

module.exports = router;