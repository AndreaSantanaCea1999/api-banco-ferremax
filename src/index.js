// c:\Users\andre\Proyecto Ferremax\api-ventas-pagos\api-banco-ferremax\src\index.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const { sequelize } = require('./config/database');

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    console.log('🚀 Iniciando API Banco...');
    
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');

    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('🔄 Modelos sincronizados.');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor API Banco escuchando en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1); // Termina el proceso si no se puede iniciar
  }
};

startServer();
