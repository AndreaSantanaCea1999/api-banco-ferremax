// c:\Users\andre\Proyecto Ferremax\api-ventas-pagos\api-banco-ferremax\src\app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Importa tus rutas
const healthRoutes = require('./routes/healthRoutes');
const divisasRoutes = require('./routes/divisasRoutes');

// const pagosRoutes = require('./routes/pagosRoutes'); // Descomenta cuando las necesites

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // 'dev' es más informativo para desarrollo

// Rutas de la API
app.use('/health', healthRoutes);
app.use('/api/divisas', divisasRoutes);

// app.use('/api/v1/pagos', pagosRoutes);

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.send('¡Bienvenido a la API de FERREMAX - Banco!');
});

// Manejador para rutas no encontradas (404)
// Importante: Debe ir después de todas tus rutas válidas.
app.use((req, res, next) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador de errores global
// Importante: Debe ser el último middleware.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal en el servidor' });
});

module.exports = app;
