// src/routes/bancoApiRoutes.js
const express = require('express');
const router = express.Router();

// Importar todas las rutas bancarias
const bancoRoutes = require('./bancoRoutes');
const cuentaBancariaRoutes = require('./cuentaBancariaRoutes');
const transaccionBancariaRoutes = require('./transaccionBancariaRoutes');
const tarjetaRoutes = require('./tarjetaRoutes');
const pagoBancarioRoutes = require('./pagoBancarioRoutes');
const transbankRoutes = require('./transbankRoutes');

// Montar todas las rutas bajo /api/banco
router.use('/bancos', bancoRoutes);
router.use('/cuentas', cuentaBancariaRoutes);
router.use('/transacciones', transaccionBancariaRoutes);
router.use('/tarjetas', tarjetaRoutes);
router.use('/pagos', pagoBancarioRoutes);
router.use('/webpay', transbankRoutes);

// Ruta para verificar el estado de la API bancaria
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Bancaria funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date()
  });
});

module.exports = router;