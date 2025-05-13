const express = require('express');
const cors = require('cors');
require('dotenv').config();

const divisasRoutes = require('./routes/divisas.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const catalogoRoutes = require('./routes/catalogo.routes.js'); // Importar las rutas del catálogo

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/divisas', divisasRoutes);
    app.use('/api/pedidos', pedidosRoutes);
    app.use('/api/catalogo', catalogoRoutes); // Montar las rutas del catálogo
    
    // Manejo de rutas no encontradas (404) - Moverlo aquí desde index.js
    app.use((req, res, next) => {
      res.status(404).json({ error: 'Ruta no encontrada' });
    });
    
    // Manejador de errores global (opcional pero recomendado) - Moverlo aquí desde index.js
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ error: 'Algo salió mal en el servidor' });
    });
    
    module.exports = app; // Exportar la app para que index.js la use

    // El app.listen() se haría en index.js o en el script de inicio.
