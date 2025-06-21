// src/routes/healthRoutes.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Banco FERREMAS',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    message: '🏦 API Banco FERREMAS funcionando correctamente'
  });
});

module.exports = router;
