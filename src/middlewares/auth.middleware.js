// src/app.js (actualizado)
const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); // Para logging de peticiones HTTP

// Cargar variables de entorno
require('dotenv').config();

const app = express();

// Middlewares importantes
app.use(cors()); // Habilitar CORS para todas las rutas
app.use(express.json()); // Para parsear application/json
app.use(express.urlencoded({ extended: true })); // Para parsear application/x-www-form-urlencoded
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev')); // Logging de peticiones en desarrollo
}

// Importar rutas
const divisasRoutes = require('./routes/divisasRoutes');
const pedidosRoutes = require('./routes/pedidos.routes');
const catalogoRoutes = require('./routes/catalogo.routes');
const clientesRoutes = require('./routes/clientes.routes');
const sucursalesRoutes = require('./routes/sucursales.routes');
const inventarioRoutes = require('./routes/inventario.routes');
const authRoutes = require('./routes/authRoutes');
const bancoRoutes = require('./routes/bancoRoutes');
const cuentaBancariaRoutes = require('./routes/cuentaBancariaRoutes');
const transaccionBancariaRoutes = require('./routes/transaccionBancariaRoutes');
const tarjetaRoutes = require('./routes/tarjetaRoutes');
const pagoBancarioRoutes = require('./routes/pagoBancarioRoutes');
const transbankRoutes = require('./routes/transbankRoutes');

// Definir la URL base para cada conjunto de rutas
app.use('/api/auth', authRoutes);
app.use('/api/divisas', divisasRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/catalogo', catalogoRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/sucursales', sucursalesRoutes);
app.use('/api/inventario', inventarioRoutes);

// Rutas bancarias
app.use('/api/banco/bancos', bancoRoutes);
app.use('/api/banco/cuentas', cuentaBancariaRoutes);
app.use('/api/banco/transacciones', transaccionBancariaRoutes);
app.use('/api/banco/tarjetas', tarjetaRoutes);
app.use('/api/banco/pagos', pagoBancarioRoutes);
app.use('/api/banco/webpay', transbankRoutes);

// Ruta de bienvenida
app.get('/api', (req, res) => {
    res.json({
        mensaje: 'API de Banco FERREMAS funcionando correctamente',
        version: '1.0.0',
        endpoints: [
            { ruta: '/api/auth', descripcion: 'Autenticación y gestión de usuarios' },
            { ruta: '/api/divisas', descripcion: 'Gestión de divisas y conversiones' },
            { ruta: '/api/pedidos', descripcion: 'Gestión de pedidos y pagos' },
            { ruta: '/api/catalogo', descripcion: 'Consulta de productos' },
            { ruta: '/api/clientes', descripcion: 'Gestión de clientes' },
            { ruta: '/api/sucursales', descripcion: 'Gestión de sucursales' },
            { ruta: '/api/inventario', descripcion: 'Consulta y gestión básica de inventario' },
            { ruta: '/api/banco', descripcion: 'API Bancaria (cuentas, transacciones, etc.)' }
        ]
    });
});

// Middleware para manejar rutas no encontradas (404)
app.use((req, res, next) => {
    const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
    error.status = 404;
    next(error);
});

// Middleware para manejar errores globales
app.use((err, req, res, next) => {
    console.error("Error global:", err.stack || err.message || err);
    
    // En desarrollo, incluir el stack de error
    const errorDetails = process.env.NODE_ENV !== 'production' ? err.stack : undefined;
    
    res.status(err.status || 500).json({
        error: err.message || 'Error interno del servidor',
        detalles: errorDetails
    });
});

module.exports = app;

