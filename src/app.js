const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const routes = require('./routes');
const db = require('./models').sequelize;

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Carga variables de entorno
dotenv.config();

// Inicializa Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',  // Puedes usar '2.0' o '3.0.0', aquí te pongo OpenAPI 3
    info: {
      title: 'API de Ventas y Pagos FERREMAX',
      description: 'API para gestionar pedidos, pagos y conversión de divisas',
      version: '1.0.0',
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api`,
        description: 'Servidor local'
      }
    ]
  },
  apis: ['./src/routes/*.js'],  // Aquí defines dónde pones los comentarios para la doc
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Rutas API
app.use('/api', routes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: process.env.NODE_ENV === 'production'
      ? 'Ha ocurrido un error en el servidor'
      : err.message
  });
});

// Iniciar servidor después de conectar DB
db.authenticate()
  .then(() => {
    console.log('Conexión a la base de datos establecida correctamente.');

    app.listen(PORT, () => {
      console.log(`API de Ventas y Pagos FERREMAX corriendo en el puerto ${PORT}`);
      console.log(`Documentación Swagger disponible en http://localhost:${PORT}/api-docs`);
    });
  })
  .catch(err => {
    console.error('Error al conectar a la base de datos:', err);
  });

module.exports = app;
