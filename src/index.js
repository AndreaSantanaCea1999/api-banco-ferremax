// Cargar variables de entorno (asegúrate de tener un archivo .env en la raíz del proyecto)
require('dotenv').config();
    const app = require('./app'); // Importar la configuración de la app desde app.js

// Una ruta de bienvenida simple para probar que el servidor funciona
app.get('/', (req, res) => {
  res.send('¡Bienvenido a la API de FERREMAS - Banco!');
});

// Manejo de rutas no encontradas (404)
app.use((req, res, next) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador de errores global (opcional pero recomendado)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal en el servidor' });
});

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
