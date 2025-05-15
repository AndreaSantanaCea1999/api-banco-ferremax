// Cargar variables de entorno de forma robusta desde la raíz del proyecto
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app'); // Importar la configuración de la app desde app.js

// Una ruta de bienvenida simple para probar que el servidor funciona
app.get('/', (req, res) => {
  res.send('¡Bienvenido a la API de FERREMAS - Banco!');
});

// Los manejadores de errores 404 y globales más detallados se encuentran en app.js
const PORT = process.env.PORT || 3000; // Usa el puerto de la variable de entorno o 3000 por defecto

app.listen(PORT, () => {
  console.log(`Servidor API escuchando en el puerto ${PORT}`);
  // Verificar si las variables de entorno para la API del banco están cargadas
  if (!process.env.BANCO_API_URL || !process.env.BANCO_API_KEY) {
    console.warn('ADVERTENCIA: BANCO_API_URL o BANCO_API_KEY no están configuradas. La funcionalidad de divisas podría fallar.');
  } else {
    console.log('Configuración de API del banco encontrada.');
  }
});
