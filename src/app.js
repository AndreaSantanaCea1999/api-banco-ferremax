// src/app.js - Versión mejorada con todas las funcionalidades requeridas
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// ===========================================
// MIDDLEWARES
// ===========================================
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://ferremas.cl', 'https://www.ferremas.cl'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// ===========================================
// IMPORTAR RUTAS
// ===========================================
const authRoutes = require('./routes/authRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');
const detallesPedidoRoutes = require('./routes/detallesPedidoRoutes');
const pagosRoutes = require('./routes/pagosRoutes');
const webpayRoutes = require('./routes/webpayRoutes');
const divisasRoutes = require('./routes/divisasRoutes');
const tiposCambioRoutes = require('./routes/tiposCambioRoutes');
const healthRoutes = require('./routes/healthRoutes');

// Middleware de autenticación
const { verificarToken, verificarRol } = require('./middlewares/auth');

// ===========================================
// RUTAS PÚBLICAS
// ===========================================
app.use('/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/divisas', divisasRoutes);

// ===========================================
// RUTAS PROTEGIDAS
// ===========================================
app.use('/api/v1/pedidos', verificarToken, pedidosRoutes);
app.use('/api/v1/detalles-pedido', verificarToken, detallesPedidoRoutes);
app.use('/api/v1/pagos', verificarToken, pagosRoutes);
app.use('/api/v1/webpay', webpayRoutes); // WebPay maneja su propia autenticación
app.use('/api/v1/tipos-cambio', tiposCambioRoutes);

// ===========================================
// RUTA PRINCIPAL DE LA API
// ===========================================
app.get('/', (req, res) => {
  res.json({
    name: 'API de Ventas y Pagos FERREMAX',
    version: '1.0.0',
    status: 'Activo',
    description: 'API para gestión de pedidos, pagos y conversión de divisas',
    endpoints: {
      auth: '/api/v1/auth - Autenticación y registro',
      pedidos: '/api/v1/pedidos - Gestión de pedidos',
      pagos: '/api/v1/pagos - Gestión de pagos',
      webpay: '/api/v1/webpay - Integración WebPay',
      divisas: '/api/v1/divisas - Información de divisas',
      tipos_cambio: '/api/v1/tipos-cambio - Conversión de monedas'
    },
    integraciones: {
      inventario: process.env.API_INVENTARIO_URL,
      banco_central: 'Banco Central de Chile',
      webpay: 'Transbank WebPay'
    },
    documentacion: '/api/v1/docs'
  });
});

// ===========================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ===========================================
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error('Error global:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    }),
    timestamp: new Date().toISOString()
  });
});

module.exports = app;