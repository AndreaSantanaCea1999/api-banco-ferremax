// src/app_with_banco.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { sequelize } = require('./config/database');

// Importar rutas de la API de inventario original
const mainRoutes = require('./routes/index');

// Importar rutas de la API bancaria
const bancoApiRoutes = require('./routes/bancoApiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Logging de solicitudes HTTP

// Montar rutas API inventario bajo /api
app.use('/api', mainRoutes);

// Montar rutas API bancaria bajo /api/banco
app.use('/api/banco', bancoApiRoutes);

// Ruta para verificar el estado de todas las API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    services: {
      inventario: {
        status: 'active',
        version: '1.0.0'
      },
      banco: {
        status: 'active',
        version: '1.0.0'
      }
    },
    message: 'Servicio de APIs FERREMAS funcionando correctamente',
    timestamp: new Date()
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({ 
    message: 'API FERREMAS funcionando correctamente',
    endpoints: {
      inventario: '/api',
      banco: '/api/banco',
      status: '/api/status'
    }
  });
});

// Iniciar servidor y conectar a la base de datos
app.listen(PORT, async () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
  }
});

module.exports = app;