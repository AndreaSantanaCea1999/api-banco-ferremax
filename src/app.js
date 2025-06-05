// src/app.js (API Inventario)
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Importa tu configuración de Sequelize
const { sequelize, testConnection } = require('./config/database');

// Importa tus modelos y rutas
const {
  Inventario,
  Productos,
  MovimientosInventario,
  Usuario,
  Pedidos,
  DetallesPedido
} = require('./models');
const mainRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.use('/api', mainRoutes);

// Ejemplo de ruta adicional para borrar inventario por producto
app.delete('/api/inventario/producto/:productoId', async (req, res) => { /* … */ });

app.get('/', (req, res) => {
  res.json({
    message: 'API de Inventario y Ventas FERREMAS funcionando correctamente',
    version: '1.0.0',
    documentation: '/api',
    status: 'active'
  });
});

app.use((error, req, res, next) => { /* manejador global de errores */ });
app.use('*', (req, res) => { /* 404 handler */ });

// Arranca el servidor y comprueba la conexión a la BD
app.listen(PORT, async () => {
  console.log(`🚀 API Inventario escuchando en http://localhost:${PORT}`);
  
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');
    // Si quieres sincronizar modelos solo en desarrollo:
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('🔄 Modelos sincronizados.');
    }
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
  }
});

module.exports = app;
