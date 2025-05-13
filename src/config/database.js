// c:\Users\andre\api-banco-ferremax\src\config\database.js

const mysql = require('mysql2/promise'); // Usamos la versión con promesas

// Configuración de la conexión a la base de datos
// Usamos las variables de entorno definidas en .env
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ferremax',
  port: parseInt(process.env.DB_PORT) || 3306, // Asegurarse de que el puerto sea un número
  waitForConnections: true,
  connectionLimit: 10, // Número máximo de conexiones en el pool
  queueLimit: 0
};

// Crear el pool de conexiones
const pool = mysql.createPool(dbConfig);

// Verificar la conexión (opcional, pero útil al iniciar)
pool.getConnection()
  .then(connection => {
    console.log('Conexión a MySQL (Pedidos DB) establecida correctamente (Pool).');
    connection.release(); // Liberar la conexión inmediatamente
  })
  .catch(err => console.error('Error al conectar a MySQL:', err.message));

module.exports = pool; // Exportar el pool para usarlo en los modelos
