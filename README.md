# 🏦 API Banco FERREMAX

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)
![Express.js](https://img.shields.io/badge/Express.js-4.x-blue.svg)
![MySQL](https://img.shields.io/badge/MySQL-8.x-orange.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Version](https://img.shields.io/badge/Version-1.0.0-purple.svg)

**API de Ventas y Pagos para el sistema integrado FERREMAX**

[Características](#-características-principales) •
[Instalación](#-instalación-rápida) •
[Documentación](#-documentación-de-la-api) •
[Ejemplos](#-ejemplos-de-uso) •
[Contribuir](#-contribuir)

</div>

---

## 📖 Descripción

La **API Banco FERREMAX** es el motor transaccional del sistema integrado de FERREMAX, una distribuidora líder de productos de ferretería y construcción en Chile. Esta API maneja el ciclo completo de ventas, desde la creación de pedidos hasta el procesamiento de pagos con integración a WebPay (Transbank) y conversión automática de divisas.

## ✨ Características Principales

### 🛍️ **Gestión Completa de Ventas**
- Creación y seguimiento de pedidos en tiempo real
- Gestión de estados de pedidos (Pendiente → Aprobado → En Preparación → Entregado)
- Cálculo automático de impuestos, descuentos y costos de envío
- Soporte para múltiples métodos de entrega

### 💳 **Procesamiento de Pagos Seguro**
- **WebPay (Transbank)**: Integración completa con tarjetas de débito y crédito
- **Pagos manuales**: Soporte para efectivo y transferencias
- **Seguridad PCI**: Cumplimiento con estándares de seguridad financiera
- **Confirmación automática**: Validación y confirmación de transacciones

### 💱 **Conversión de Divisas en Tiempo Real**
- Integración con Banco Central de Chile
- Soporte para CLP, USD, EUR, ARS, BRL
- Cache inteligente para optimizar consultas
- Simulación para entornos de desarrollo

### 🔄 **Integración con Microservicios**
- **API de Inventario**: Verificación y actualización automática de stock
- **Sistema de Notificaciones**: Alertas en tiempo real
- **Sincronización bidireccional**: Consistencia de datos garantizada

### 🛡️ **Seguridad y Autenticación**
- **JWT**: Tokens seguros con expiración configurable
- **Bcrypt**: Hasheo seguro de contraseñas (factor 12)
- **Roles y permisos**: Sistema granular de autorización
- **Rate limiting**: Protección contra abuso

## 🛠️ Tecnologías Utilizadas

| Categoría | Tecnología | Versión | Propósito |
|-----------|------------|---------|-----------|
| **Runtime** | Node.js | 18.x | Entorno de ejecución |
| **Framework** | Express.js | 4.x | API REST |
| **Base de Datos** | MySQL | 8.x | Almacenamiento principal |
| **ORM** | Sequelize | 6.x | Mapeo objeto-relacional |
| **Autenticación** | JWT + Bcrypt | Latest | Seguridad |
| **Pagos** | Transbank SDK | 6.x | Procesamiento WebPay |
| **HTTP Client** | Axios | 1.x | Comunicación con APIs |
| **Logging** | Morgan | 1.x | Registro de solicitudes |
| **Dev Tools** | Nodemon | 3.x | Desarrollo en vivo |

## 🚀 Instalación Rápida

### ✅ Prerrequisitos

```bash
# Verificar versiones mínimas
node --version    # v18.0.0+
npm --version     # v8.0.0+
mysql --version   # v8.0.0+
```

### 📥 Clonación e Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/api-banco-ferremax.git
cd api-banco-ferremax

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus configuraciones

# 4. Configurar base de datos
# Ejecutar script SQL para crear tablas y datos iniciales
mysql -u administrador -p ferremas_complete < scripts/setup-database.sql

# 5. Verificar configuración
npm run verify

# 6. Iniciar en modo desarrollo
npm run dev
```

### 🗄️ Configuración de Base de Datos

```sql
-- Crear base de datos
CREATE DATABASE ferremas_complete CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Configurar usuario (opcional)
CREATE USER 'administrador'@'localhost' IDENTIFIED BY 'tu_password_segura';
GRANT ALL PRIVILEGES ON ferremas_complete.* TO 'administrador'@'localhost';
FLUSH PRIVILEGES;
```

## 📁 Estructura del Proyecto

```
api-banco-ferremax/
├── 📁 src/
│   ├── 📁 config/              # Configuraciones
│   │   ├── database.js         # Conexión MySQL/Sequelize
│   │   └── index.js           # Variables de entorno
│   ├── 📁 controllers/         # Lógica de negocio
│   │   ├── authController.js   # Autenticación JWT
│   │   ├── pedidosController.js # Gestión de pedidos
│   │   ├── pagosController.js  # Procesamiento de pagos
│   │   ├── webpayController.js # Integración WebPay
│   │   ├── ventasController.js # Flujo completo de ventas
│   │   ├── divisasController.js # Conversión de divisas
│   │   ├── clienteController.js # Panel de cliente
│   │   └── adminController.js  # Panel administrativo
│   ├── 📁 models/              # Modelos de datos
│   │   ├── index.js           # Configuración Sequelize
│   │   ├── Usuario.js         # Modelo de usuarios
│   │   ├── pedidos.js         # Modelo de pedidos
│   │   ├── pagos.js           # Modelo de pagos
│   │   ├── webpayTransacciones.js # Transacciones WebPay
│   │   └── divisas.js         # Modelo de divisas
│   ├── 📁 routes/              # Definición de rutas
│   │   ├── authRoutes.js      # Rutas de autenticación
│   │   ├── pedidosRoutes.js   # Rutas de pedidos
│   │   ├── pagosRoutes.js     # Rutas de pagos
│   │   ├── webpayRoutes.js    # Rutas WebPay
│   │   ├── ventasRoutes.js    # Rutas de ventas
│   │   ├── divisasRoutes.js   # Rutas de divisas
│   │   ├── clienteRoutes.js   # Rutas de cliente
│   │   └── adminRoutes.js     # Rutas administrativas
│   ├── 📁 services/            # Servicios externos
│   │   ├── webpayService.js   # Comunicación WebPay
│   │   ├── inventarioService.js # API de Inventario
│   │   └── bancoCentralService.js # Banco Central
│   ├── 📁 middlewares/         # Middlewares personalizados
│   │   └── auth.js            # Verificación JWT
│   ├── 📁 utils/               # Utilidades
│   ├── app.js                  # Configuración Express
│   └── index.js               # Punto de entrada
├── 📁 tests/                   # Pruebas
├── 📁 scripts/                 # Scripts utilitarios
├── 📁 docs/                    # Documentación
├── .env.example               # Variables de entorno ejemplo
├── package.json               # Dependencias y scripts
└── README.md                  # Este archivo
```

## 🔑 Variables de Entorno

### 📋 Configuración Mínima (.env)

```env
# Servidor
NODE_ENV=development
PORT=3001

# Base de Datos
DB_HOST=localhost
DB_USER=administrador
DB_PASSWORD=tu_password_segura
DB_NAME=ferremas_complete
DB_PORT=3306

# Seguridad
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
JWT_EXPIRES_IN=7d

# APIs Externas
API_INVENTARIO_URL=http://localhost:3000/api
WEBPAY_API_URL=http://localhost:3003/api/transbank
BANCO_API_URL=https://mindicador.cl/api

# WebPay (Transbank)
WEBPAY_COMMERCE_CODE=597055555532
WEBPAY_API_KEY=579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C
WEBPAY_ENVIRONMENT=integration
```

### 🔧 Variables Avanzadas

```env
# CORS y Frontend
CORS_ORIGIN=http://localhost:3004,http://localhost:3000
FRONTEND_URL=http://localhost:3004

# Timeouts
HTTP_TIMEOUT=30000
API_TIMEOUT=15000

# Cache
CURRENCY_CACHE_TTL=3600
PRODUCT_CACHE_TTL=300

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Logs
LOG_LEVEL=info
LOG_TO_FILE=true
LOG_DIRECTORY=./logs

# Desarrollo
DEBUG_API_CALLS=true
SIMULATE_BANCO_CENTRAL=true
```

## 📖 Documentación de la API

### 🔐 Autenticación

Todas las rutas protegidas requieren un token JWT en el header:

```http
Authorization: Bearer <jwt_token>
```

### 🚪 Endpoints Principales

#### **Autenticación** (`/api/v1/auth`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/login` | Iniciar sesión | ❌ |
| `POST` | `/register` | Registrar cliente | ❌ |
| `GET` | `/profile` | Obtener perfil | ✅ |
| `PUT` | `/profile` | Actualizar perfil | ✅ |
| `POST` | `/change-password` | Cambiar contraseña | ✅ |

#### **Ventas Completas** (`/api/v1/ventas`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/crear` | Crear venta completa | ✅ |
| `GET` | `/:pedido_id/estado` | Estado de venta | ✅ |
| `POST` | `/:pedido_id/confirmar` | Confirmar venta | ✅ |

#### **Pedidos** (`/api/v1/pedidos`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | Listar pedidos | ✅ |
| `GET` | `/:id` | Obtener pedido | ✅ |
| `POST` | `/` | Crear pedido | ✅ |
| `PATCH` | `/:id/estado` | Cambiar estado | ✅ |

#### **Pagos** (`/api/v1/pagos`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | Listar pagos | ✅ |
| `GET` | `/pedido/:pedidoId` | Pagos por pedido | ✅ |
| `POST` | `/` | Registrar pago manual | ✅ |

#### **WebPay** (`/api/v1/webpay`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/iniciar` | Iniciar transacción | ✅ |
| `POST` | `/confirmar` | Confirmar transacción | 🔒 |
| `POST` | `/estado-transaccion` | Verificar estado | ✅ |

#### **Divisas** (`/api/v1/divisas`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/tipos-cambio` | Tipos de cambio actuales | ❌ |
| `POST` | `/convertir` | Convertir entre divisas | ❌ |

#### **Cliente** (`/api/v1/cliente`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/pedidos` | Mis pedidos | ✅ |
| `GET` | `/pagos` | Mis pagos | ✅ |
| `GET` | `/resumen` | Resumen de actividad | ✅ |
| `DELETE` | `/pedidos/:id` | Cancelar pedido | ✅ |

#### **Administración** (`/api/v1/admin`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/dashboard` | Panel principal | 🔑 |
| `GET` | `/usuarios` | Listar usuarios | 🔑 |
| `POST` | `/usuarios` | Crear usuario | 🔑 |
| `GET` | `/estadisticas` | Estadísticas generales | 🔑 |

**Leyenda**: ❌ = Público | ✅ = Requiere auth | 🔒 = Webhook | 🔑 = Solo admin

## 💡 Ejemplos de Uso

### 🔐 Autenticación

```bash
# Iniciar sesión
curl -X POST "http://localhost:3001/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ferremas.cl",
    "password": "admin123"
  }'

# Respuesta
{
  "success": true,
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@ferremas.cl",
    "nombre": "Administrador",
    "role": "admin"
  }
}
```

### 🛒 Crear Venta Completa

```bash
# Crear venta con verificación de stock y pago
curl -X POST "http://localhost:3001/api/v1/ventas/crear" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "cliente_id": 1,
    "sucursal_id": 1,
    "productos": [
      {
        "id_producto": 101,
        "cantidad": 2,
        "precio_unitario": 15000
      },
      {
        "id_producto": 205,
        "cantidad": 1,
        "precio_unitario": 45000
      }
    ],
    "metodo_entrega": "Despacho_Domicilio",
    "direccion_entrega": "Av. Providencia 1234, Santiago",
    "metodo_pago": "Crédito",
    "divisa_cliente": "USD",
    "comentarios": "Entrega urgente"
  }'
```

### 💳 Iniciar Pago WebPay

```bash
# Iniciar transacción WebPay
curl -X POST "http://localhost:3001/api/v1/webpay/iniciar" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "idPedido": 123,
    "monto": 75000,
    "returnUrl": "https://tu-frontend.com/payment/return",
    "finalUrl": "https://tu-frontend.com/payment/final"
  }'

# Respuesta
{
  "token": "TOKEN_WEBPAY_GENERADO",
  "url": "https://webpay3g.transbank.cl/webpayserver/initTransaction?token_ws=TOKEN_WEBPAY_GENERADO",
  "idPago": 456
}
```

### 💱 Conversión de Divisas

```bash
# Convertir monto entre divisas
curl -X POST "http://localhost:3001/api/v1/divisas/convertir" \
  -H "Content-Type: application/json" \
  -d '{
    "monto": 50000,
    "divisa_origen": "CLP",
    "divisa_destino": "USD"
  }'

# Respuesta
{
  "success": true,
  "data": {
    "monto_original": 50000,
    "monto_convertido": 55.26,
    "divisa_origen": "CLP",
    "divisa_destino": "USD",
    "tasa_cambio": 904.65,
    "fecha_conversion": "2024-01-15T10:30:00Z"
  }
}
```

## 🔗 Integración con Microservicios

### 📦 API de Inventario (Puerto 3000)

```javascript
// Verificación automática de stock
const stockCheck = await inventarioService.verificarStockProducto(
  idProducto, 
  cantidad, 
  idSucursal
);

// Actualización automática de inventario
await inventarioService.actualizarInventario(
  idProducto,
  cantidad,
  idSucursal,
  'Salida'
);
```

### 💳 WebPay/Transbank (Puerto 3003)

```javascript
// Flujo completo de pago
const webpayResult = await webpayService.iniciarTransaccion(
  pedidoId,
  monto,
  returnUrl,
  finalUrl
);

// Confirmación automática
const confirmation = await webpayService.confirmarTransaccion(token);
```

### 🏛️ Banco Central de Chile

```javascript
// Obtención automática de tipos de cambio
const tiposCambio = await bancoCentralService.obtenerTodosTiposCambio();

// Conversión con cache inteligente
const conversion = await bancoCentralService.convertirDivisa(
  monto, 
  'CLP', 
  'USD'
);
```

## 👥 Usuarios del Sistema

| Usuario | Email | Password | Rol | Permisos |
|---------|-------|----------|-----|----------|
| **Administrador** | `admin@ferremas.cl` | `admin123` | `admin` | Acceso completo |
| **Cliente** | `cliente@test.cl` | `cliente123` | `cliente` | Compras y consultas |
| **Vendedor** | `vendedor@ferremas.cl` | `vendedor123` | `vendedor` | Gestión de ventas |
| **Bodeguero** | `bodeguero@ferremas.cl` | `bodeguero123` | `bodeguero` | Gestión de inventario |

## 🧪 Testing y Desarrollo

### 🚀 Scripts Disponibles

```bash
# Desarrollo con auto-reload
npm run dev

# Producción
npm start

# Verificar configuración
npm run verify

# Probar conexiones
npm run test:connections

# Limpiar logs
npm run clean:logs
```

### 🧪 Testing Manual

```bash
# Health check
curl http://localhost:3001/health

# Verificar autenticación
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ferremas.cl","password":"admin123"}'

# Probar conversión de divisas
curl http://localhost:3001/api/v1/divisas/tipos-cambio
```

### 🐛 Debugging

```bash
# Habilitar logs detallados
DEBUG_API_CALLS=true npm run dev

# Simular servicios externos
SIMULATE_BANCO_CENTRAL=true npm run dev

# Logs de WebPay
DEBUG_WEBPAY=true npm run dev
```

## 🔒 Seguridad y Buenas Prácticas

### 🛡️ Medidas de Seguridad Implementadas

- **JWT con expiración**: Tokens seguros con tiempo de vida limitado
- **Bcrypt factor 12**: Hasheo robusto de contraseñas
- **Rate limiting**: 100 requests por 15 minutos por IP
- **CORS configurado**: Solo orígenes autorizados
- **Validación de entrada**: Sanitización de todos los datos
- **HTTPS obligatorio**: En producción (configuración nginx)
- **Logs de auditoría**: Registro completo de transacciones

### 📋 Checklist de Producción

- [ ] Variables de entorno configuradas
- [ ] Base de datos con backup automático
- [ ] HTTPS configurado (nginx/caddy)
- [ ] Rate limiting activado
- [ ] Logs centralizados
- [ ] Monitoreo de errores (Sentry)
- [ ] Health checks configurados
- [ ] WebPay en modo producción

## 📊 Monitoreo y Logs

### 📈 Métricas Clave

- **Tiempo de respuesta promedio**: < 200ms
- **Disponibilidad**: > 99.9%
- **Transacciones por minuto**: Monitoreo en tiempo real
- **Errores de WebPay**: Alertas automáticas
- **Uso de APIs externas**: Límites y quotas

### 📝 Logs Estructurados

```bash
# Ver logs en tiempo real
tail -f logs/api-banco.log

# Filtrar errores
grep "ERROR" logs/api-banco.log

# Analizar transacciones WebPay
grep "WEBPAY" logs/api-banco.log | tail -20
```

## 🚀 Despliegue

### 🐳 Docker (Recomendado)

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  api-banco:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    depends_on:
      - mysql
      
  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root_password
      - MYSQL_DATABASE=ferremas_complete
```

### ☁️ Servidor Tradicional

```bash
# PM2 para gestión de procesos
npm install -g pm2

# Iniciar con PM2
pm2 start src/index.js --name "api-banco-ferremax"

# Configurar autostart
pm2 startup
pm2 save
```

## 🤝 Contribuir

### 📋 Guía de Contribución

1. **Fork** el repositorio
2. **Crea** una rama para tu feature: `git checkout -b feature/amazing-feature`
3. **Commit** tus cambios: `git commit -m 'Add amazing feature'`
4. **Push** a la rama: `git push origin feature/amazing-feature`
5. **Abre** un Pull Request

### 📏 Estándares de Código

- **ESLint**: Configuración estándar
- **Prettier**: Formateo automático
- **Commits semánticos**: `feat:`, `fix:`, `docs:`
- **Tests**: Cobertura mínima del 80%
- **Documentación**: JSDoc para funciones públicas

### 🧪 Tests Antes de PR

```bash
npm run test           # Tests unitarios
npm run test:integration  # Tests de integración
npm run lint           # Verificar estilo
npm run security       # Audit de seguridad
```

## 📝 Changelog

### [1.0.0] - 2024-01-15
- ✅ **Añadido**: Sistema completo de autenticación JWT
- ✅ **Añadido**: Integración con WebPay/Transbank
- ✅ **Añadido**: Conversión automática de divisas
- ✅ **Añadido**: API de ventas completas
- ✅ **Añadido**: Panel administrativo
- ✅ **Añadido**: Sincronización con API de Inventario

### [0.9.0] - 2024-01-10
- ✅ **Añadido**: Modelos Sequelize completos
- ✅ **Añadido**: Controladores básicos
- ✅ **Añadido**: Middleware de autenticación

## 📞 Soporte y Contacto

### 🆘 Obtener Ayuda

- **Documentación**: [Wiki del proyecto](https://github.com/tu-usuario/api-banco-ferremax/wiki)
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/api-banco-ferremax/issues)
- **Discusiones**: [GitHub Discussions](https://github.com/tu-usuario/api-banco-ferremax/discussions)

### 📧 Contacto Directo

- **Email del equipo**: desarrollo@ferremas.cl
- **Slack**: #api-banco-ferremax
- **Emergency**: +56-9-XXXX-XXXX (Solo producción)

### 🐛 Reportar Bugs

Usa la [plantilla de bug report](https://github.com/tu-usuario/api-banco-ferremax/issues/new?template=bug_report.md) e incluye:

- Versión de Node.js
- Versión de la API
- Pasos para reproducir
- Logs relevantes
- Variables de entorno (sin secretos)

## 📄 Licencia

Este proyecto está licenciado bajo la **Licencia MIT**. Ver [LICENSE](LICENSE) para más detalles.

```
MIT License

Copyright (c) 2024 FERREMAX

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

<div align="center">

**Hecho con ❤️ por el Equipo de Desarrollo FERREMAX**

⭐ **¿Te gusta el proyecto? ¡Dale una estrella!** ⭐

</div>
