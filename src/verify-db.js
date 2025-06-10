// verify-db.js - Coloca este archivo en la raíz de cada API
const mysql = require('mysql2/promise');
require('dotenv').config();

async function verificarConexion() {
  console.log('🔍 Verificando conexión a base de datos...\n');
  
  // Mostrar configuración (sin contraseña)
  console.log('📋 Configuración:');
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   Puerto: ${process.env.DB_PORT || 3306}`);
  console.log(`   Base de datos: ${process.env.DB_NAME || 'ferremas_complete'}`);
  console.log(`   Usuario: ${process.env.DB_USER || 'administrador'}`);
  console.log(`   API Puerto: ${process.env.PORT || 3000}\n`);
  
  try {
    // Crear conexión
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'administrador',
      password: process.env.DB_PASSWORD || 'yR!9uL2@pX',
      database: process.env.DB_NAME || 'ferremas_complete'
    });
    
    console.log('✅ Conexión exitosa!\n');
    
    // Verificar tablas
    console.log('📊 Verificando tablas...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`   Total de tablas: ${tables.length}`);
    
    // Verificar tablas críticas
    const tablasRequeridas = [
      'usuario', 'cliente', 'productos', 'inventario', 
      'pedidos', 'detalles_pedido', 'divisas', 'tipos_cambio',
      'pagos', 'webpay_transacciones'
    ];
    
    const tablasEncontradas = tables.map(t => Object.values(t)[0]);
    console.log('\n📋 Tablas críticas:');
    
    for (const tabla of tablasRequeridas) {
      const existe = tablasEncontradas.includes(tabla);
      console.log(`   ${existe ? '✅' : '❌'} ${tabla}`);
    }
    
    // Verificar datos básicos
    console.log('\n📈 Verificando datos:');
    
    const queries = [
      { tabla: 'sucursales', descripcion: 'Sucursales' },
      { tabla: 'usuario', descripcion: 'Usuarios' },
      { tabla: 'cliente', descripcion: 'Clientes' },
      { tabla: 'productos', descripcion: 'Productos' },
      { tabla: 'inventario', descripcion: 'Registros de inventario' },
      { tabla: 'divisas', descripcion: 'Divisas' }
    ];
    
    for (const q of queries) {
      try {
        const [result] = await connection.execute(`SELECT COUNT(*) as total FROM ${q.tabla}`);
        console.log(`   ${q.descripcion}: ${result[0].total}`);
      } catch (err) {
        console.log(`   ${q.descripcion}: ❌ Error - ${err.message}`);
      }
    }
    
    // Verificar productos con inventario
    console.log('\n🏪 Productos con inventario en sucursal 1:');
    const [productos] = await connection.execute(`
      SELECT p.ID_Producto, p.Codigo, p.Nombre, i.Stock_Actual
      FROM productos p
      LEFT JOIN inventario i ON p.ID_Producto = i.ID_Producto AND i.ID_Sucursal = 1
      WHERE p.Estado = 'Activo'
      LIMIT 5
    `);
    
    productos.forEach(p => {
      console.log(`   ID: ${p.ID_Producto} | ${p.Codigo} | ${p.Nombre} | Stock: ${p.Stock_Actual || 0}`);
    });
    
    await connection.end();
    console.log('\n✅ Verificación completada!');
    
  } catch (error) {
    console.error('\n❌ Error de conexión:', error.message);
    console.error('\nPosibles soluciones:');
    console.error('1. Verifica que MySQL esté corriendo');
    console.error('2. Verifica las credenciales en el archivo .env');
    console.error('3. Asegúrate que la base de datos "ferremas_complete" existe');
    console.error('4. Verifica que el usuario tiene permisos sobre la base de datos');
  }
}

verificarConexion();