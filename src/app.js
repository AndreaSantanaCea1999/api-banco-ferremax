// ... otras importaciones y configuraciones ...
const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); // Opcional: para logging de peticiones HTTP
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') }); // Asegura que .env se cargue desde la raíz

const app = express();

// Middlewares importantes
app.use(cors()); // Habilitar CORS para todas las rutas
app.use(express.json()); // Para parsear application/json
app.use(express.urlencoded({ extended: true })); // Para parsear application/x-www-form-urlencoded
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev')); // Logging de peticiones
}

// Importa tus archivos de rutas
const divisasRoutes = require('./routes/divisas.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const catalogoRoutes = require('./routes/catalogo.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const sucursalesRoutes = require('./routes/sucursales.routes');
const inventarioRoutes = require('./routes/inventario.routes');

// Define la URL base para cada conjunto de rutas
app.use('/api/divisas', divisasRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/catalogo', catalogoRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/sucursales', sucursalesRoutes);
app.use('/api/inventario', inventarioRoutes);

// Middleware para manejar rutas no encontradas (404)
app.use((req, res, next) => {
    const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
    error.status = 404;
    next(error); // Pasa el error al manejador de errores global
});

// Middleware para manejar errores globales
app.use((err, req, res, next) => {
    console.error("Error global:", err.stack || err.message || err);
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }
    res.status(err.status || 500).json({
        error: err.message || 'Error interno del servidor.',
        detalle: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
});


module.exports = app;