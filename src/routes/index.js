const express = require('express');
const router = express.Router();

const pedidosRoutes = require('./pedidosRoutes');
const detallesPedidoRoutes = require('./detallesPedidoRoutes');
const pagosRoutes = require('./pagosRoutes');
const webpayRoutes = require('./webpayRoutes');
const divisasRoutes = require('./divisasRoutes');
const tiposCambioRoutes = require('./tiposCambioRoutes');

// Configurar rutas
router.use('/pedidos', pedidosRoutes);
router.use('/detalles-pedido', detallesPedidoRoutes);
router.use('/pagos', pagosRoutes);
router.use('/webpay', webpayRoutes);
router.use('/divisas', divisasRoutes);
router.use('/tipos-cambio', tiposCambioRoutes);

// Ruta principal para documentación
router.get('/', (req, res) => {
  res.json({
    name: 'API de Ventas y Pagos FERREMAX',
    version: '1.0.0',
    endpoints: [
      { path: '/pedidos', description: 'Gestión de pedidos' },
      { path: '/detalles-pedido', description: 'Gestión de detalles de pedidos' },
      { path: '/pagos', description: 'Gestión de pagos' },
      { path: '/webpay', description: 'Integración con WebPay' },
      { path: '/divisas', description: 'Gestión de divisas' },
      { path: '/tipos-cambio', description: 'Consulta y actualización de tipos de cambio' }
    ]
  });
});

module.exports = router;