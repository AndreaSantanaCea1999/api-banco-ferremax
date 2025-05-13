// c:\Users\andre\Desktop\api-banco-ferremax\src\config\config.js
require('dotenv').config(); // Carga las variables de entorno desde .env al inicio

const config = {
  port: process.env.PORT || 3001,
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
  },
  banco: {
    apiKey: process.env.BANCO_API_KEY,
    apiUrl: process.env.BANCO_API_URL,
  },
  webpay: {
    commerceCode: process.env.WEBPAY_COMMERCE_CODE,
    apiKey: process.env.WEBPAY_API_KEY,
  },
  inventarioApiUrl: process.env.API_INVENTARIO_URL,
  nodeEnv: process.env.NODE_ENV || 'development',
};

const getConfig = () => config;


module.exports = { getConfig, config }; // Exportar tanto la función como el objeto directamente si se prefiere