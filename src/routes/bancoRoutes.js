// src/routes/bancoRoutes.js
const express = require('express');
const router = express.Router();
const bancoController = require('../controllers/bancoController');

// Rutas para bancos
router.get('/', bancoController.getAllBancos);
router.get('/:id', bancoController.getBancoById);
router.post('/', bancoController.createBanco);
router.put('/:id', bancoController.updateBanco);
router.delete('/:id', bancoController.deleteBanco);

module.exports = router;
