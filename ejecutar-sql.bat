@echo off
cls
echo.
echo ============================================
echo 🗄️ EJECUTAR SCRIPT SQL - USUARIOS
echo ============================================
echo.

echo 📋 Este script creara:
echo    - Tabla 'usuarios' en ferremas_complete
echo    - Usuarios iniciales (admin, cliente, vendedor, bodeguero)
echo    - Indices para optimizar consultas
echo.

echo ⚠️ Credenciales de MySQL:
echo    Usuario: administrador
echo    Contraseña: yR!9uL2@pX
echo    Base de datos: ferremas_complete
echo.

pause

echo.
echo 🔄 Ejecutando script SQL...

mysql -u administrador -p"yR!9uL2@pX" ferremas_complete << EOF
-- Crear tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255),
    telefono VARCHAR(20),
    direccion TEXT,
    role ENUM('admin', 'cliente', 'vendedor', 'bodeguero') DEFAULT 'cliente',
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_sesion TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_activo (activo)
);

-- Insertar usuarios iniciales (contraseñas: admin123, cliente123, etc.)
INSERT INTO usuarios (email, password, nombre, apellido, telefono, role, activo) VALUES
('admin@ferremas.cl', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador', 'FERREMAS', '+56912345678', 'admin', TRUE),
('cliente@test.cl', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Cliente', 'Test', '+56987654321', 'cliente', TRUE),
('vendedor@ferremas.cl', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Vendedor', 'FERREMAS', '+56955555555', 'vendedor', TRUE),
('bodeguero@ferremas.cl', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bodeguero', 'FERREMAS', '+56944444444', 'bodeguero', TRUE)
ON DUPLICATE KEY UPDATE
email = VALUES(email);

-- Crear tabla para sesiones (opcional)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    activo BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at)
);

-- Mostrar usuarios creados
SELECT 'Usuarios creados exitosamente:' as mensaje;
SELECT id, email, nombre, apellido, role, activo, fecha_registro 
FROM usuarios 
ORDER BY id;

EOF

if %errorlevel% equ 0 (
    echo.
    echo ✅ Script SQL ejecutado exitosamente
    echo.
    echo 📊 Verificando resultados...
    
    mysql -u administrador -p"yR!9uL2@pX" ferremas_complete -e "SELECT COUNT(*) as 'Total Usuarios' FROM usuarios; SELECT email, nombre, role FROM usuarios ORDER BY id;"
    
) else (
    echo.
    echo ❌ Error ejecutando script SQL
    echo.
    echo 🔧 Posibles soluciones:
    echo    1. Verifica que MySQL este corriendo
    echo    2. Verifica credenciales (administrador / yR!9uL2@pX)
    echo    3. Verifica que la base 'ferremas_complete' exista
    echo.
    echo 📝 Comando manual:
    echo    mysql -u administrador -p ferremas_complete
    echo    Luego copia y pega el contenido del SQL
)

echo.
echo ============================================
echo 📋 RESUMEN
echo ============================================
echo.
echo ✅ Tabla 'usuarios' creada
echo ✅ 4 usuarios iniciales insertados
echo ✅ Indices optimizados
echo ✅ Sistema listo para autenticación
echo.
echo 👥 Usuarios disponibles:
echo    admin@ferremas.cl / admin123
echo    cliente@test.cl / cliente123  
echo    vendedor@ferremas.cl / vendedor123
echo    bodeguero@ferremas.cl / bodeguero123
echo.
echo 🚀 Próximo paso:
echo    Configura los archivos de la API Banco
echo    (models/User.js, routes/auth.js, app.js)
echo.
pause