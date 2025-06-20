// src/app.js (API Inventario)
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Importa tu configuración de Sequelize
const { sequelize, testConnection } = require('./config/database');

// Importa tus modelos
const {
  Inventario,
  Productos,
  MovimientosInventario,
  Usuario,
  Pedidos,
  DetallesPedido
} = require('./models');

// Importa rutas
const mainRoutes = require('./routes');
const divisasRoutes = require('./routes/divisasRoutes');  // 👉 Ruta de divisas
const authRoutes = require('./routes/authRoutes');        // 👉 Ruta de autenticación

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// 👉 Rutas principales
app.use('/api', mainRoutes);

// 👉 Ruta de divisas
app.use('/api/v1/divisas', divisasRoutes);

// 👉 Ruta de autenticación
app.use('/api/v1/auth', authRoutes);

// Ejemplo de ruta adicional para borrar inventario por producto
app.delete('/api/inventario/producto/:productoId', async (req, res) => {
  // Aquí irá tu lógica para borrar inventario por producto
});

app.get('/', (req, res) => {
  res.json({
    message: 'API de Inventario y Ventas FERREMAS funcionando correctamente',
    version: '1.0.0',
    documentation: '/api',
    status: 'active'
  });
});

// Manejador de errores global
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Manejador para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Arranca el servidor y verifica conexión a la BD
app.listen(PORT, async () => {
  console.log(`🚀 API Inventario escuchando en http://localhost:${PORT}`);

  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');

    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('🔄 Modelos sincronizados.');
    }
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
  }
});

module.exports = app;
