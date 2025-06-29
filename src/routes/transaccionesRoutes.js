const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// Configuración de BD
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'administrador', 
  password: process.env.DB_PASSWORD || 'yR!9uL2@pX',
  database: process.env.DB_NAME || 'ferremas_complete'
};

// GET /api/v1/transacciones - Listar todas las transacciones
router.get('/', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(`
      SELECT 
        id,
        ordenCompra,
        monto,
        token,
        estado,
        detalles,
        createdAt,
        updatedAt
      FROM transbank_transacciones 
      ORDER BY createdAt DESC 
      LIMIT 50
    `);
    
    await connection.end();
    
    res.json({
      success: true,
      data: rows,
      total: rows.length
    });
    
  } catch (error) {
    console.error('Error obteniendo transacciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo transacciones',
      error: error.message
    });
  }
});

module.exports = router;