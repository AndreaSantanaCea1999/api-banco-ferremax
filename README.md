<p align="center">
  <!-- Opcional: Logo del Proyecto -->
  <!-- <img src="ruta/a/tu/logo.png" alt="FERREMAX Logo" width="200"/> -->
  <h1 align="center">FERREMAX - API de Ventas y Pagos</h1>
</p>

<p align="center">
  <!-- Badges: Estado del build, cobertura, licencia, etc. -->
  <img src="https://img.shields.io/badge/Node.js-18.x-green.svg" alt="Node.js version">
  <img src="https://img.shields.io/badge/Express.js-4.x-blue.svg" alt="Express.js version">
  <img src="https://img.shields.io/badge/MySQL-8.x-orange.svg" alt="MySQL version">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License MIT">
  <!-- Añade más badges según sea necesario -->
  <!-- Ejemplo: [!Build Status](https://travis-ci.org/usuario/api-banco-ferremax) -->
</p>

Esta API es el motor transaccional del sistema integrado de **FERREMAX**, una destacada distribuidora de productos de ferretería y construcción con una sólida presencia en Chile y planes de expansión internacional. La API de Ventas y Pagos se encarga de la gestión integral de pedidos, el procesamiento seguro de pagos a través de **WebPay (Transbank)**, la conversión dinámica de divisas y la sincronización con la **API de Inventario**.

---

## 📜 Tabla de Contenidos

1.  ✨ Características Principales
2.  🛠️ Tecnologías Utilizadas
3.  📁 Estructura del Proyecto
4.  🔗 Servicios Integrados
5.  🚀 Instalación y Configuración
6.  🔑 Variables de Entorno
7.  📖 Documentación de Endpoints
8.  💡 Ejemplos de Uso
9.  📦 Integración con API de Inventario
10. 🛡️ Seguridad
11. 🧪 Pruebas
12. ☁️ Despliegue (Consideraciones)
13. 🤝 Contribuciones
14. 📞 Contacto y Soporte
15. 📄 Licencia

---

## ✨ Características Principales

*   **🛍️ Gestión Avanzada de Pedidos:** Creación, consulta detallada, actualización de estados y gestión completa del ciclo de vida de los pedidos.
*   **💳 Procesamiento de Pagos Seguro con WebPay:** Integración robusta con la plataforma WebPay de Transbank para pagos con tarjetas de débito y crédito, cumpliendo con los estándares de seguridad.
*   **💱 Conversión Dinámica de Divisas:** Funcionalidad para la conversión en tiempo real de precios y montos a múltiples monedas, facilitando operaciones internacionales.
*   **🔄 Sincronización de Inventario en Tiempo Real:** Comunicación bidireccional con la API de Inventario para verificar disponibilidad y actualizar el stock de productos automáticamente.
*   **🏦 Simulación de Tasas de Cambio (Banco Central):** Módulo para gestionar y simular la obtención de tipos de cambio, permitiendo flexibilidad en entornos de prueba y desarrollo.

---

## 🛠️ Tecnologías Utilizadas

| Tecnología        | Descripción                                       |
|-------------------|---------------------------------------------------|
| **Node.js**       | Entorno de ejecución JavaScript del lado del servidor. |
| **Express.js**    | Framework web para la creación de APIs REST.        |
| **Sequelize ORM** | Mapeo objeto-relacional para MySQL.               |
| **MySQL**         | Sistema de gestión de bases deatos relacional.    |
| **Axios**         | Cliente HTTP para comunicación con APIs externas.  |
| **dotenv**        | Gestión de variables de entorno.                  |
| **jsonwebtoken**  | Generación y verificación de JSON Web Tokens (JWT). |
| **bcryptjs**      | Hashing seguro de contraseñas.                    |
| **Transbank SDK** | SDK oficial para la integración con WebPay.       |
| **Morgan**        | Middleware para logging de solicitudes HTTP.      |
| **Nodemon**       | Monitoriza cambios y reinicia el servidor en desarrollo. |

---

## 📁 Estructura del Proyecto

```
api-banco-ferremax/
├── src/
│   ├── config/               # Configuraciones (BD, variables de entorno)
│   │   ├── database.js       # Configuración de Sequelize y conexión a BD
│   │   └── index.js          # Carga de variables de entorno (dotenv)
│   ├── controllers/          # Lógica de negocio para cada ruta (request/response)
│   ├── middlewares/          # Middlewares personalizados (ej. autenticación, validación)
│   ├── models/               # Definiciones de los modelos de Sequelize y sus relaciones
│   ├── routes/               # Definiciones de las rutas de la API y enrutador principal
│   ├── services/             # Lógica de negocio desacoplada, comunicación con APIs externas
│   ├── utils/                # Funciones de utilidad reutilizables
│   ├── app.js                # Configuración principal de la aplicación Express
│   └── index.js              # Punto de entrada del servidor (inicia la app)
├── tests/                    # Pruebas (unitarias, integración, E2E)
│   ├── unit/
│   └── integration/
├── .env.example              # Archivo de ejemplo para variables de entorno
├── .gitignore                # Archivos y carpetas ignorados por Git
├── package.json              # Metadatos del proyecto y dependencias
├── package-lock.json         # Versiones exactas de las dependencias
├── README.md                 # Este archivo
└── (Otros archivos de configuración: .eslintrc.json, .prettierrc.json, etc.)
```

---

## 🔗 Servicios Integrados

### 💳 WebPay (Transbank)
Integración completa con la pasarela de pagos WebPay para procesar transacciones con tarjetas de débito y crédito de forma segura.
*   **Flujo de Pago:** Inicio de transacción, redirección a WebPay, procesamiento del pago por el cliente, y confirmación/verificación en la API.
*   **Seguridad:** Utiliza el SDK oficial de Transbank, asegurando el cumplimiento de los protocolos de seguridad.

### 🏦 Banco Central (Simulado)
Módulo que simula la interacción con los servicios del Banco Central de Chile para:
*   Obtención de tipos de cambio actualizados (simulados).
*   Conversión de montos entre CLP y otras divisas relevantes.
*   Flexibilidad para actualizar tasas manualmente para pruebas.

### 📦 API de Inventario
Comunicación esencial con el sistema de gestión de inventario para:
*   **Consulta de Stock:** Verificar la disponibilidad de productos en tiempo real antes de confirmar pedidos.
*   **Actualización de Stock:** Descontar unidades vendidas y reintegrar stock en caso de cancelaciones o devoluciones.

---

## 🚀 Instalación y Configuración

### ✅ Requisitos Previos

*   **Node.js:** v18.x o superior (verificar `engines` en `package.json` si está definido).
*   **NPM:** v8.x o superior (o Yarn).
*   **MySQL:** v8.x o superior (o un servidor MySQL compatible).
*   **Git:** Para clonar el repositorio.

### ⚙️ Pasos de Instalación

1.  **Clonar el Repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/api-banco-ferremax.git
    cd api-banco-ferremax
    ```

2.  **Instalar Dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno:**
    Copia el archivo de ejemplo y edítalo con tus credenciales y configuraciones específicas.
    ```bash
    cp .env.example .env
    nano .env  # o tu editor preferido
    ```
    Consulta la sección Variables de Entorno para más detalles.

4.  **Configurar la Base de Datos:**
    *   Asegúrate de que tu servidor MySQL esté en ejecución.
    *   Crea la base de datos especificada en tu archivo `.env` (ej. `ferremax_ventas_db`).
    *   Ejecuta las migraciones de Sequelize para crear la estructura de tablas:
        ```bash
        # Asumiendo que tienes scripts de migración configurados en package.json
        # npm run db:migrate
        # Si no hay migraciones, Sequelize podría sincronizar modelos en desarrollo (ver config)
        ```
    *   (Opcional) Ejecuta los seeders para poblar la base de datos con datos iniciales:
        ```bash
        # npm run db:seed
        ```

5.  **Iniciar la API:**
    *   **Modo Desarrollo** (con reinicio automático gracias a Nodemon):
        ```bash
        npm run dev
        ```
    *   **Modo Producción:**
        ```bash
        npm start
        ```
    La API debería estar disponible en `http://localhost:PORT` (donde `PORT` es el valor de tu `.env`).

---

## 🔑 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables. **Nunca subas tu archivo `.env` a un repositorio Git.**

```dotenv
# ===============================
# CONFIGURACIÓN DEL SERVIDOR
# ===============================
NODE_ENV=development # Opciones: development, production, test
PORT=3001            # Puerto en el que correrá la API

# ===============================
# BASE DE DATOS (MySQL)
# ===============================
DB_HOST=localhost
DB_USER=tu_usuario_db
DB_PASSWORD=tu_contraseña_segura_db
DB_NAME=ferremax_ventas_db
DB_PORT=3306         # Puerto de MySQL (usualmente 3306)
DB_DIALECT=mysql     # Dialecto para Sequelize

# ===============================
# API DE INVENTARIO
# ===============================
API_INVENTARIO_URL=http://localhost:3000/api # URL base de la API de Inventario
API_INVENTARIO_KEY=tu_api_key_secreta_para_inventario # Si requiere autenticación

# ===============================
# WEBPAY (TRANSBANK)
# Usar credenciales de INTEGRACIÓN para desarrollo/pruebas
# ===============================
WEBPAY_COMMERCE_CODE=tu_codigo_de_comercio_integracion # Proporcionado por Transbank
WEBPAY_API_KEY=tu_api_key_integracion_webpay         # Proporcionado por Transbank
# El SDK de Transbank usualmente maneja las URLs de los endpoints (Integración/Producción)
# basándose en el entorno configurado en el propio SDK o mediante una variable.
# WEBPAY_ENVIRONMENT=integration # O 'production'

# ===============================
# SEGURIDAD (JWT)
# ===============================
JWT_SECRET=tu_frase_secreta_muy_larga_y_aleatoria_para_jwt
JWT_EXPIRES_IN=1h # Tiempo de expiración de los tokens (ej. 1h, 7d)

# ===============================
# OTROS (Opcional)
# ===============================
# API_BANCO_CENTRAL_URL=https://api.bancocentral.cl/formato_json # Ejemplo
```

---

## 📖 Documentación de Endpoints

La documentación detallada de cada endpoint, incluyendo parámetros de solicitud, esquemas de respuesta y códigos de estado, está disponible a través de:

*   **Colección de Postman:** [Enlace a tu Colección de Postman o instrucciones para importarla]
*   **(Opcional) Especificación OpenAPI (Swagger):** Si está implementado, puedes acceder a la UI de Swagger en `/api-docs`.

**Prefijo base de la API:** `/api/v1` (o el que hayas configurado)

A continuación, un resumen de los principales grupos de endpoints:

<details>
  <summary><strong>📦 Pedidos (`/pedidos`)</strong></summary>

  | Método | Ruta          | Descripción                                      | Autenticación |
  |--------|---------------|--------------------------------------------------|---------------|
  | `GET`  | `/`           | Obtener todos los pedidos (con filtros y paginación) | Requerida     |
  | `GET`  | `/:id`        | Obtener un pedido específico por su ID           | Requerida     |
  | `POST` | `/`           | Crear un nuevo pedido                            | Requerida     |
  | `PUT`  | `/:id`        | Actualizar un pedido existente (completo)        | Requerida     |
  | `PATCH`| `/:id/estado` | Actualizar el estado de un pedido                | Requerida     |
</details>

<details>
  <summary><strong>📄 Detalles de Pedido (`/detalles-pedido`)</strong></summary>

  | Método | Ruta                  | Descripción                                      | Autenticación |
  |--------|-----------------------|--------------------------------------------------|---------------|
  | `GET`  | `/pedido/:pedidoId`   | Obtener todos los detalles de un pedido específico | Requerida     |
  | `PATCH`| `/:id/estado`         | Actualizar estado de un ítem de detalle específico | Requerida     |
</details>

<details>
  <summary><strong>💸 Pagos (`/pagos`)</strong></summary>

  | Método | Ruta                  | Descripción                                      | Autenticación |
  |--------|-----------------------|--------------------------------------------------|---------------|
  | `GET`  | `/`                   | Obtener todos los pagos (con filtros)            | Requerida     |
  | `GET`  | `/pedido/:pedidoId`   | Obtener todos los pagos de un pedido específico  | Requerida     |
  | `POST` | `/`                   | Registrar un nuevo pago (manual, ej. transferencia) | Requerida     |
  | `PATCH`| `/:id/estado`         | Actualizar el estado de un pago específico       | Requerida     |
</details>

<details>
  <summary><strong>💳 WebPay (`/webpay`)</strong></summary>

  | Método | Ruta                          | Descripción                                      | Autenticación |
  |--------|-------------------------------|--------------------------------------------------|---------------|
  | `POST` | `/iniciar-transaccion`        | Iniciar una nueva transacción en WebPay          | Requerida     |
  | `GET`  | `/retorno-transaccion`        | Endpoint de retorno de WebPay (éxito/fracaso)    | Pública       |
  | `POST` | `/confirmar-transaccion`      | Confirmar una transacción de WebPay (backend)    | Pública (validada por token) |
  | `GET`  | `/estado-transaccion/:token`  | Verificar el estado de una transacción WebPay    | Requerida     |
</details>

<details>
  <summary><strong>💱 Divisas y Tipos de Cambio (`/divisas`, `/tipos-cambio`)</strong></summary>

  **Divisas (`/divisas`)**
  | Método | Ruta          | Descripción                                      | Autenticación |
  |--------|---------------|--------------------------------------------------|---------------|
  | `GET`  | `/`           | Obtener todas las divisas disponibles            | Pública       |
  | `POST` | `/`           | Crear una nueva divisa (Administrativo)          | Admin         |
  | `PUT`  | `/:id`        | Actualizar una divisa (Administrativo)           | Admin         |

  **Tipos de Cambio (`/tipos-cambio`)**
  | Método | Ruta          | Descripción                                      | Autenticación |
  |--------|---------------|--------------------------------------------------|---------------|
  | `GET`  | `/`           | Obtener todos los tipos de cambio actuales       | Pública       |
  | `POST` | `/convertir`  | Convertir un monto entre dos divisas             | Pública       |
  | `POST` | `/actualizar` | Actualizar tasas de cambio (simulación, Admin)   | Admin         |
</details>

---

## 💡 Ejemplos de Uso

A continuación, se muestran ejemplos de cómo interactuar con algunos endpoints clave usando `curl`.

### Crear un Pedido

**Solicitud:**
```bash
curl -X POST "http://localhost:3001/api/v1/pedidos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -d '{
    "ID_Cliente": 1,
    "ID_Sucursal": 1,
    "detalles": [
      { "ID_Producto": 101, "Cantidad": 2, "Precio_Unitario": 15000 },
      { "ID_Producto": 205, "Cantidad": 1, "Precio_Unitario": 45000 }
    ],
    "Direccion_Entrega": "Av. Siempre Viva 742",
    "Comentarios": "Entregar por la tarde."
  }'
```

**Respuesta Esperada (Ejemplo):**
```json
{
  "mensaje": "Pedido creado exitosamente",
  "pedido": {
    "ID_Pedido": 123,
    "Codigo_Pedido": "PD-20240115-0123",
    "Total": 75000,
    "Estado": "Pendiente",
    "..."
  }
}
```

### Iniciar Transacción WebPay

**Solicitud:**
```bash
curl -X POST "http://localhost:3001/api/v1/webpay/iniciar-transaccion" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -d '{
    "idPedido": 123,
    "monto": 75000,
    "returnUrl": "https://tufrontend.com/webpay/retorno",
    "sessionId": "sesion_unica_del_usuario"
  }'
```

**Respuesta Esperada (Ejemplo):**
```json
{
  "token": "TOKEN_WEBPAY_GENERADO",
  "url_redirect": "https://url.webpay.cl/initTransaction?token_ws=TOKEN_WEBPAY_GENERADO"
}
```

---

## 📦 Integración con API de Inventario

La API de Ventas y Pagos interactúa estrechamente con la API de Inventario para asegurar la consistencia de los datos.

### Verificación de Stock
Antes de procesar un pedido, se consulta la API de Inventario para confirmar la disponibilidad de cada producto.
```javascript
// Ejemplo conceptual en services/inventarioService.js
async function verificarDisponibilidad(idProducto, cantidadRequerida) {
  const response = await axios.get(`${process.env.API_INVENTARIO_URL}/stock/${idProducto}`);
  return response.data.disponible >= cantidadRequerida;
}
```

### Actualización de Inventario
Una vez que un pedido es confirmado y pagado, se notifica a la API de Inventario para descontar el stock.
```javascript
// Ejemplo conceptual en services/inventarioService.js
async function descontarStock(idProducto, cantidad) {
  await axios.patch(`${process.env.API_INVENTARIO_URL}/stock/${idProducto}/descontar`, { cantidad });
}
```

---

## 🛡️ Seguridad

La seguridad es una prioridad en esta API. Se han implementado las siguientes medidas:

*   **Autenticación JWT:** Protección de endpoints mediante JSON Web Tokens.
*   **Validación de Datos:** Uso de librerías (ej. Joi, express-validator) para validar todas las entradas.
*   **Hashing de Contraseñas:** Almacenamiento seguro de credenciales usando bcrypt.
*   **Protección contra XSS y CSRF:** Implementación de medidas preventivas.
*   **HTTPS:** Uso obligatorio en entornos de producción.
*   **Variables de Entorno:** Gestión segura de claves y configuraciones sensibles.
*   **CORS:** Configuración adecuada para permitir solicitudes solo desde dominios autorizados.
*   **Rate Limiting:** Prevención de abusos mediante la limitación de tasas de solicitud.
*   **Logging de Seguridad:** Registro de eventos relevantes para auditoría.

### 🚨 Reportar Vulnerabilidades
Si descubres alguna vulnerabilidad de seguridad, por favor repórtala de forma responsable a `seguridad@ferremas.cl`.

---

## 🧪 Pruebas

El proyecto cuenta con un conjunto de pruebas para garantizar la calidad y estabilidad del código.

*   **Ejecutar todas las pruebas:**
    ```bash
    npm test
    ```
*   **Ejecutar pruebas y generar informe de cobertura:**
    ```bash
    npm run test:coverage
    # (Asegúrate de que este script esté definido en package.json y configurado con tu herramienta de cobertura, ej. Jest con --coverage)
    ```
*   **Pruebas E2E (End-to-End):**
    ```bash
    # npm run test:e2e (Si están configuradas)
    ```

Se recomienda mantener una alta cobertura de pruebas y añadir nuevas pruebas para cada funcionalidad o corrección de errores.

---

## ☁️ Despliegue (Consideraciones)

Para desplegar esta API en un entorno de producción, considera lo siguiente:

*   **Entorno:** Asegúrate de que `NODE_ENV` esté configurado como `production`.
*   **Process Manager:** Utiliza un gestor de procesos como PM2 para mantener la aplicación en ejecución, gestionar logs y reinicios.
*   **Base de Datos:** Configura una base de datos MySQL de producción robusta y segura.
*   **HTTPS:** Configura un servidor proxy inverso (ej. Nginx, Caddy) para manejar SSL/TLS.
*   **Variables de Entorno:** Utiliza un sistema seguro para gestionar las variables de entorno en producción (ej. Vault, AWS Secrets Manager, variables de entorno del proveedor de hosting).
*   **Logging:** Centraliza los logs en un sistema de gestión de logs (ej. ELK Stack, Splunk, Papertrail).
*   **Monitoreo:** Implementa herramientas de monitoreo de rendimiento y errores (ej. Sentry, New Relic, Prometheus/Grafana).
*   **Contenerización (Opcional):** Considera usar Docker y Docker Compose para facilitar el despliegue y la escalabilidad.

---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si deseas mejorar esta API, por favor sigue estos pasos:

1.  **Haz un Fork** del repositorio.
2.  **Crea una nueva rama** para tu funcionalidad o corrección: `git checkout -b feature/nombre-de-tu-feature` o `fix/descripcion-del-bug`.
3.  **Realiza tus cambios** y asegúrate de seguir las guías de estilo del proyecto.
4.  **Añade pruebas** para tus cambios.
5.  **Haz commit** de tus cambios: `git commit -m "feat: Añade nueva funcionalidad X"`. (Sigue las Convenciones de Commits Semánticos).
6.  **Empuja tus cambios** a tu fork: `git push origin feature/nombre-de-tu-feature`.
7.  **Abre un Pull Request** hacia la rama `main` (o `develop`) del repositorio original.

Por favor, asegúrate de que tu PR describa claramente los cambios realizados y por qué son necesarios.

---

## 📞 Contacto y Soporte

Si tienes preguntas, encuentras un error o necesitas soporte relacionado con esta API, puedes:

*   📧 **Enviar un correo a:** `soporte-api@ferremas.cl`
*   🐛 **Crear un Issue en GitHub:** [Enlace al sistema de Issues de tu repositorio]
*   📚 **Consultar la Wiki del Proyecto:** [Enlace a la Wiki de tu repositorio] (si existe)

---

## 📄 Licencia

Este proyecto está licenciado bajo los términos de la **Licencia MIT**.
Consulta el archivo `LICENSE` para más detalles.

---

<p align="center">
  Hecho con ❤️ por el Equipo de Desarrollo de FERREMAX
</p>
