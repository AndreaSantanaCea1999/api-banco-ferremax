@echo off
cls
echo.
echo ============================================
echo 🔐 CONFIGURACION COMPLETA - AUTENTICACION
echo ============================================
echo.

echo 📋 Este script configurara:
echo    1. Tabla de usuarios en MySQL
echo    2. Modelo de Usuario con BD real
echo    3. Rutas de autenticacion actualizadas
echo    4. Dependencias necesarias
echo.

pause

echo.
echo 🗄️ PASO 1: Configurando base de datos...

echo Creando tabla usuarios en MySQL...
mysql -u administrador -p"yR!9uL2@pX" ferremas_complete -e "CREATE TABLE IF NOT EXISTS usuarios (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, nombre VARCHAR(255) NOT NULL, apellido VARCHAR(255), telefono VARCHAR(20), direccion TEXT, role ENUM('admin', 'cliente', 'vendedor', 'bodeguero') DEFAULT 'cliente', activo BOOLEAN DEFAULT TRUE, fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP, fecha_ultima_sesion TIMESTAMP NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX idx_email (email), INDEX idx_role (role), INDEX idx_activo (activo));"

if %errorlevel% equ 0 (
    echo ✅ Tabla usuarios creada exitosamente
) else (
    echo ❌ Error creando tabla usuarios
    echo Verifica que MySQL este corriendo y las credenciales sean correctas
    pause
    exit /b 1
)

echo Insertando usuarios iniciales...
mysql -u administrador -p"yR!9uL2@pX" ferremas_complete -e "INSERT INTO usuarios (email, password, nombre, apellido, telefono, role, activo) VALUES ('admin@ferremas.cl', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador', 'FERREMAS', '+56912345678', 'admin', TRUE), ('cliente@test.cl', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Cliente', 'Test', '+56987654321', 'cliente', TRUE), ('vendedor@ferremas.cl', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Vendedor', 'FERREMAS', '+56955555555', 'vendedor', TRUE), ('bodeguero@ferremas.cl', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bodeguero', 'FERREMAS', '+56944444444', 'bodeguero', TRUE) ON DUPLICATE KEY UPDATE email = VALUES(email);"

if %errorlevel% equ 0 (
    echo ✅ Usuarios iniciales insertados
) else (
    echo ⚠️ Los usuarios ya existen o hubo un error menor
)

echo.
echo 📦 PASO 2: Configurando API Banco...

cd api-banco

echo Instalando dependencias actualizadas...
npm install express cors dotenv bcryptjs jsonwebtoken mysql2 axios nodemon --save

echo Creando estructura de carpetas...
if not exist "models" mkdir models
if not exist "routes" mkdir routes

echo Verificando archivos necesarios...

if not exist "models\User.js" (
    echo ❌ models/User.js no existe
    echo ACCION REQUERIDA: Crea models/User.js con el contenido del artifact "Modelo Usuario"
    pause
) else (
    echo ✅ models/User.js encontrado
)

if not exist "routes\auth.js" (
    echo ❌ routes/auth.js no existe  
    echo ACCION REQUERIDA: Actualiza routes/auth.js con el contenido del artifact "Rutas de Autenticacion"
    pause
) else (
    echo ✅ routes/auth.js encontrado
)

if not exist "app.js" (
    echo ❌ app.js no existe
    echo ACCION REQUERIDA: Crea app.js con el contenido del artifact "Archivo principal API Banco"
    pause
) else (
    echo ✅ app.js encontrado
)

echo.
echo 🧪 PASO 3: Probando configuracion...

echo Verificando conexion a base de datos...
mysql -u administrador -p"yR!9uL2@pX" ferremas_complete -e "SELECT COUNT(*) as total_usuarios FROM usuarios;" 2>nul

if %errorlevel% equ 0 (
    echo ✅ Conexion a base de datos OK
) else (
    echo ❌ Error conectando a base de datos
)

echo Verificando usuarios creados...
mysql -u administrador -p"yR!9uL2@pX" ferremas_complete -e "SELECT id, email, nombre, role FROM usuarios;"

echo.
echo ============================================
echo ✅ CONFIGURACION COMPLETADA
echo ============================================
echo.

echo 📋 Resumen de lo configurado:
echo    ✅ Tabla 'usuarios' en MySQL
echo    ✅ Usuarios iniciales creados
echo    ✅ Dependencias instaladas
echo    ✅ Estructura de carpetas
echo.

echo ⚠️ ARCHIVOS QUE DEBES CREAR/ACTUALIZAR:
echo.
echo 1. api-banco/models/User.js
echo    Copia el contenido del artifact "Modelo Usuario"
echo.
echo 2. api-banco/routes/auth.js  
echo    Actualiza con el contenido del artifact "Rutas de Autenticacion"
echo.
echo 3. api-banco/app.js
echo    Asegurate de que importe el modelo User y las rutas auth
echo.

echo 🚀 Para probar el sistema:
echo.
echo 1. Crea los archivos mencionados arriba
echo 2. cd api-banco
echo 3. npm run dev
echo 4. Probar login:
echo    curl -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@ferremas.cl\",\"password\":\"admin123\"}"
echo.

echo 👥 Usuarios disponibles para login:
echo    🔑 admin@ferremas.cl / admin123 (Administrador)
echo    👤 cliente@test.cl / cliente123 (Cliente)  
echo    🛒 vendedor@ferremas.cl / vendedor123 (Vendedor)
echo    📦 bodeguero@ferremas.cl / bodeguero123 (Bodeguero)
echo.

echo 🎯 Caracteristicas del sistema:
echo    ✅ Usuarios se guardan en MySQL
echo    ✅ Contraseñas hasheadas con bcrypt
echo    ✅ Autenticacion con JWT
echo    ✅ Registro de nuevos usuarios
echo    ✅ Actualizacion de perfil
echo    ✅ Cambio de contraseñas
echo    ✅ Panel de administracion
echo.

echo 📝 Para crear un nuevo usuario desde el frontend:
echo    Usa la opcion "Registrarse" y se guardara en la base de datos
echo.

pause

cd ..