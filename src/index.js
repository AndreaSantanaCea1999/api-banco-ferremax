// src/index.js - Punto de entrada principal mejorado
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const { sequelize } = require('./config/database');

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Función para inicializar la base de datos y verificar conexiones
 */
async function initializeDatabase() {
  try {
    console.log('🔍 Verificando conexión a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión a MySQL establecida correctamente');

    // Verificar tablas críticas
    const [tablas] = await sequelize.query("SHOW TABLES");
    const tablasRequeridas = [
      'pedidos', 'detalles_pedido', 'pagos', 'webpay_transacciones',
      'divisas', 'tipos_cambio', 'usuarios'
    ];
    
    const tablasExistentes = tablas.map(t => Object.values(t)[0]);
    const tablasFaltantes = tablasRequeridas.filter(t => !tablasExistentes.includes(t));
    
    if (tablasFaltantes.length > 0) {
      console.warn('⚠️ Tablas faltantes en BD:', tablasFaltantes);
    } else {
      console.log('✅ Todas las tablas críticas están presentes');
    }

    // Solo sincronizar en desarrollo si es necesario
    if (NODE_ENV === 'development') {
      // await sequelize.sync({ alter: false });
      console.log('🔄 Modelos verificados (sin sincronización automática)');
    }

    return true;
  } catch (error) {
    console.error('❌ Error en la base de datos:', error);
    throw error;
  }
}

/**
 * Función para verificar integraciones externas
 */
async function verificarIntegraciones() {
  console.log('🔗 Verificando integraciones externas...');
  
  const integraciones = {
    inventario: process.env.API_INVENTARIO_URL,
    banco_central: process.env.BANCO_API_URL,
    webpay: process.env.WEBPAY_API_URL
  };

  for (const [nombre, url] of Object.entries(integraciones)) {
    if (url) {
      console.log(`✅ ${nombre}: ${url}`);
    } else {
      console.warn(`⚠️ ${nombre}: No configurado`);
    }
  }
}

/**
 * Función principal para iniciar el servidor
 */
async function startServer() {
  try {
    console.log('🚀 Iniciando API Banco FERREMAS...');
    console.log(`📍 Entorno: ${NODE_ENV}`);
    console.log(`📍 Puerto: ${PORT}`);
    
    // Inicializar base de datos
    await initializeDatabase();
    
    // Verificar integraciones
    await verificarIntegraciones();
    
    // Iniciar servidor HTTP
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('🎉 ========================================');
      console.log('🏦   API BANCO FERREMAS INICIADA        ');
      console.log('🎉 ========================================');
      console.log('');
      console.log(`🌐 Servidor: http://localhost:${PORT}`);
      console.log(`📚 Documentación: http://localhost:${PORT}/api/v1`);
      console.log(`💓 Health Check: http://localhost:${PORT}/health`);
      console.log('');
      console.log('📋 Endpoints principales:');
      console.log(`   🔐 Auth: http://localhost:${PORT}/api/v1/auth`);
      console.log(`   🛒 Ventas: http://localhost:${PORT}/api/v1/ventas`);
      console.log(`   📦 Pedidos: http://localhost:${PORT}/api/v1/pedidos`);
      console.log(`   💳 Pagos: http://localhost:${PORT}/api/v1/pagos`);
      console.log(`   💰 WebPay: http://localhost:${PORT}/api/v1/webpay`);
      console.log(`   💱 Divisas: http://localhost:${PORT}/api/v1/divisas`);
      console.log('');
      console.log('🔗 Integraciones:');
      console.log(`   📦 Inventario: ${process.env.API_INVENTARIO_URL || 'No configurado'}`);
      console.log(`   🏛️ Banco Central: ${process.env.BANCO_API_URL || 'No configurado'}`);
      console.log(`   💳 WebPay: ${process.env.WEBPAY_API_URL || 'No configurado'}`);
      console.log('');
      console.log('✅ Sistema listo para recibir peticiones');
    });

    // Manejo graceful de cierre del servidor
    process.on('SIGTERM', () => {
      console.log('🛑 Señal SIGTERM recibida, cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        sequelize.close();
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 Señal SIGINT recibida, cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        sequelize.close();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Error crítico al iniciar el servidor:', error);
    console.error('');
    console.error('💡 Posibles soluciones:');
    console.error('   1. Verificar que MySQL esté ejecutándose');
    console.error('   2. Revisar credenciales en archivo .env');
    console.error('   3. Verificar que la base de datos existe');
    console.error('   4. Comprobar conectividad de red');
    console.error('');
    process.exit(1);
  }
}

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rechazada no manejada:', reason);
  console.error('En:', promise);
  process.exit(1);
});

// Iniciar la aplicación
startServer();

// Exportar para testing
module.exports = { startServer, initializeDatabase };