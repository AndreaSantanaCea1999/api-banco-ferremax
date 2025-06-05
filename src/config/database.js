// src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,       // ej. "ferremas_complete"
  process.env.DB_USER,       // ej. "administrador"
  process.env.DB_PASSWORD,   // ej. "yR!9uL2@pX"
  {
    host: process.env.DB_HOST,    // ej. "localhost"
    port: process.env.DB_PORT,    // ej. 3306
    dialect: 'mysql',             // ← OBLIGATORIO: indica que usas MySQL
    logging: false
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
  }
};

module.exports = { sequelize, testConnection };
