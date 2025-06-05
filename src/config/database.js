const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'ferremas_complete',
  process.env.DB_USER || 'administrador',
  process.env.DB_PASSWORD || 'yR!9uL2@pX',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
  }
};

module.exports = { sequelize, testConnection };