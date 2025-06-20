// src/routes/divisasRoutes.js
const express = require('express');
const router = express.Router();
const divisasController = require('../controllers/divisasController');

// Documentación de la API
router.get('/', (req, res) => {
  res.json({
    message: 'API Conversión de Divisas - FERREMAS',
    version: '1.0.0',
    status: 'Activo',
    integracion: 'Banco Central de Chile',
    endpoints: {
      tipos_cambio: 'GET /tipos-cambio - Obtener tipos de cambio actuales',
      convertir: 'POST /convertir - Convertir monto entre divisas'
    },
    divisas_soportadas: ['CLP', 'USD', 'EUR'],
    ejemplo_conversion: {
      url: 'POST /convertir',
      body: {
        monto: 50000,
        divisa_origen: 'CLP',
        divisa_destino: 'USD'
      }
    }
  });
});

// Obtener tipos de cambio actuales
router.get('/tipos-cambio', divisasController.obtenerTiposCambio);

// Convertir monto entre divisas
router.post('/convertir', divisasController.convertirMonto);

module.exports = router;