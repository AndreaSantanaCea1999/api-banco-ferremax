const express = require('express');
const router = express.Router();
const divisasController = require('../controllers/divisasController');

// Rutas para divisas
router.get('/', divisasController.getAllDivisas);
router.get('/:id', divisasController.getDivisaById);
router.post('/', divisasController.createDivisa);
router.put('/:id', divisasController.updateDivisa);
router.delete('/:id', divisasController.deleteDivisa); // Ruta para eliminar divisa
router.patch('/:id/default', divisasController.setDefaultDivisa);

module.exports = router;