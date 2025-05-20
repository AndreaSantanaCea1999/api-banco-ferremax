const express = require('express');
const router = express.Router();
const tiposCambioController = require('../controllers/tiposCambioController');

// Rutas para tipos de cambio
router.get('/', tiposCambioController.getAllTiposCambio);
router.get('/consulta', tiposCambioController.getTipoCambio);
router.post('/convertir', tiposCambioController.convertirMonto);
router.post('/actualizar', tiposCambioController.actualizarTiposCambio);

module.exports = router;