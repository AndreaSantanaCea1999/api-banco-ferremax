// src/config/database.js (para ambas APIs)
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Verificar que las variables de entorno están cargadas
console.log('Conectando a base de datos:', process.env.DB_NAME);

const sequelize = new Sequelize(
  process.env.DB_NAME || 'ferremas_complete',  // Base de datos
  process.env.DB_USER || 'administrador',      // Usuario
  process.env.DB_PASSWORD || 'yR!9uL2@pX',     // Contraseña
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: console.log, // Habilitar logging para debug
    define: {
      timestamps: false, // Desabilitar timestamps automáticos
      freezeTableName: true // Usar nombres de tabla exactos
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa a la base de datos:', process.env.DB_NAME);
    
    // Verificar que podemos acceder a las tablas
    const [results] = await sequelize.query("SHOW TABLES");
    console.log(`📋 Tablas encontradas: ${results.length}`);
    
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error.message);
    console.error('Detalles:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER
    });
  }
};

module.exports = { sequelize, testConnection };