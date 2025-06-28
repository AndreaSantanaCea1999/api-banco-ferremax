// fix-users.js - Script para crear usuarios con hash correcto
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function fixUsers() {
    try {
        console.log('🔐 Creando usuarios con contraseñas hasheadas correctamente...\n');

        // Conexión a la base de datos
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'administrador',
            password: 'yR!9uL2@pX',
            database: 'ferremas_complete'
        });

        console.log('✅ Conectado a la base de datos');

        // Hashear contraseñas
        const adminPassword = await bcrypt.hash('admin123', 12);
        const clientePassword = await bcrypt.hash('cliente123', 12);
        const vendedorPassword = await bcrypt.hash('vendedor123', 12);

        console.log('✅ Contraseñas hasheadas');

        // Borrar usuarios existentes y crear nuevos
        await connection.execute('DELETE FROM usuarios WHERE email IN (?, ?, ?)', [
            'admin@ferremas.cl',
            'cliente@test.cl', 
            'vendedor@ferremas.cl'
        ]);

        console.log('🗑️ Usuarios anteriores eliminados');

        // Insertar usuarios con contraseñas correctas
        const users = [
            ['admin@ferremas.cl', adminPassword, 'Administrador', 'FERREMAS', '+56912345678', 'admin'],
            ['cliente@test.cl', clientePassword, 'Cliente', 'Test', '+56987654321', 'cliente'],
            ['vendedor@ferremas.cl', vendedorPassword, 'Vendedor', 'FERREMAS', '+56955555555', 'vendedor']
        ];

        for (const user of users) {
            await connection.execute(
                'INSERT INTO usuarios (email, password, nombre, apellido, telefono, role, activo) VALUES (?, ?, ?, ?, ?, ?, TRUE)',
                user
            );
            console.log(`✅ Usuario creado: ${user[0]}`);
        }

        // Verificar usuarios creados
        const [rows] = await connection.execute('SELECT id, email, nombre, role FROM usuarios ORDER BY id');
        
        console.log('\n📋 Usuarios en la base de datos:');
        console.table(rows);

        // Verificar login de prueba
        console.log('\n🧪 Probando login...');
        const [adminUser] = await connection.execute('SELECT * FROM usuarios WHERE email = ?', ['admin@ferremas.cl']);
        
        if (adminUser.length > 0) {
            const isValid = await bcrypt.compare('admin123', adminUser[0].password);
            console.log(`✅ Test login admin: ${isValid ? 'EXITOSO' : 'FALLIDO'}`);
        }

        await connection.end();

        console.log('\n🎉 ¡Usuarios configurados correctamente!');
        console.log('\n👥 Credenciales para probar:');
        console.log('   🔑 admin@ferremas.cl / admin123');
        console.log('   👤 cliente@test.cl / cliente123'); 
        console.log('   🛒 vendedor@ferremas.cl / vendedor123');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

fixUsers();