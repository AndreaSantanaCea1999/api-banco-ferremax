# API Banco Ferremax (Node.js & Express)

API RESTful para la gestión de operaciones bancarias y de divisas para "Banco Ferremax". Este proyecto está desarrollado con Node.js, Express y se conecta a una base de datos MySQL.

## Tecnologías Utilizadas

*   **Entorno de ejecución:** Node.js (especificar versión, ej: v18.x o LTS)
*   **Framework:** Express.js
*   **Base de Datos:** MySQL
*   **Gestor de Paquetes:** npm (o yarn, si lo usas)
*   **(Opcional)** Otros paquetes importantes (ej: `mysql2`, `sequelize`, `dotenv`, `jsonwebtoken`, `cors`, etc. - *Ajusta según tu `package.json`*)

## Prerrequisitos

*   Node.js (versión recomendada: LTS) instalado.
*   npm (viene con Node.js) o yarn instalado.
*   Servidor MySQL instalado y en ejecución.
*   Un cliente API como Postman, Insomnia, o `curl` para probar los endpoints.

## Configuración del Entorno

1.  **Crear la base de datos:**
    Asegúrate de tener una base de datos MySQL creada para el proyecto (por ejemplo, `ferremax_db`).
    *Nota: La consola indica "Conexión a MySQL (Pedidos DB) establecida correctamente (Pool)", así que podrías estar usando una base de datos llamada `Pedidos` o similar. Ajusta según sea necesario.*

2.  **Variables de Entorno:**
    Este proyecto utiliza variables de entorno para la configuración, especialmente para la conexión a la base de datos.
    Crea un archivo `.env` en la raíz del proyecto a partir del archivo `.env.example` (si no existe, crea uno).

    **`.env.example` (Ejemplo):**
    ```
    PORT=3001

    DB_HOST=localhost
    DB_USER=tu_usuario_mysql
    DB_PASSWORD=tu_contraseña_mysql
    DB_NAME=ferremax_db
    DB_PORT=3306

    # Otras variables que puedas necesitar (ej: JWT_SECRET)
    ```

    **Crea tu archivo `.env` y llénalo con tus credenciales y configuraciones locales.**

## Instalación y Ejecución

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/AndreaSantanaCea1999/api-banco-ferremax.git
    cd api-banco-ferremax
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```
    (O si usas yarn: `yarn install`)

3.  **Iniciar la aplicación:**
    ```bash
    npm start
    ```
    El servidor se iniciará y estará escuchando en `http://localhost:3001` (o el puerto que hayas configurado en tu archivo `.env`).
    Deberías ver mensajes en la consola como:
    ```
    Cargando rutas de divisas...
    Servidor API escuchando en el puerto 3001
    Configuración de API del banco encontrada.
    Conexión a MySQL (Pedidos DB) establecida correctamente (Pool).
    ```

## Endpoints de la API

La URL base para todos los endpoints es `http://localhost:3001/api` (o la ruta base que hayas configurado).

A continuación, se listan algunos endpoints posibles. **Deberás documentar los endpoints específicos de tu aplicación basándote en tu código (`src/routes/` o similar).**

### Rutas de Divisas (`/api/divisas` - *ejemplo*)

*   **`GET /`**: Obtiene información sobre divisas.
    *   *(Detalla qué información devuelve y si acepta parámetros query)*
*   **`POST /convertir`**: Realiza una conversión de divisas.
    *   **Request Body (ejemplo):**
        ```json
        {
          "monedaOrigen": "USD",
          "monedaDestino": "CLP",
          "monto": 100
        }
        ```

### Clientes (`/api/clientes` - *ejemplo, si aplica*)

*   **`GET /`**: Obtiene una lista de todos los clientes.
*   **`POST /`**: Crea un nuevo cliente.
    *   **Request Body (ejemplo):**
        ```json
        {
          "nombre": "Juan",
          "apellido": "Perez",
          "rut": "11222333-4"
        }
        ```

### Cuentas (`/api/cuentas` - *ejemplo, si aplica*)

*   **`GET /cliente/{clienteId}`**: Obtiene las cuentas de un cliente.
*   **`POST /`**: Crea una nueva cuenta.

### Transacciones (`/api/transacciones` - *ejemplo, si aplica*)

*   **`POST /`**: Realiza una nueva transacción.

*Por favor, revisa tu directorio de rutas (usualmente `src/routes/`) para listar y detallar todos los endpoints correctamente, incluyendo métodos HTTP, parámetros de ruta, query params y cuerpos de solicitud/respuesta esperados.*

## Estructura del Proyecto (Ejemplo)

```
api-banco-ferremax/
├── src/
│   ├── controllers/  (Lógica de manejo de solicitudes)
│   ├── routes/       (Definición de rutas de la API)
│   ├── models/       (Modelos de datos, interacción con DB)
│   ├── services/     (Lógica de negocio, opcional)
│   ├── config/       (Configuración de DB, etc.)
│   ├── middlewares/  (Middlewares personalizados)
│   └── index.js      (Punto de entrada de la aplicación)
├── .env              (Variables de entorno - NO SUBIR A GIT)
├── .env.example      (Ejemplo de variables de entorno)
├── package.json
├── package-lock.json
└── README.md         (Este archivo)
```
*Ajusta esta estructura para que coincida con la de tu proyecto.*

## Ejecución de Pruebas

Si tienes pruebas configuradas (ej. con Jest, Mocha):
```bash
npm test
```
*(Si no tienes pruebas, puedes omitir esta sección o indicar "Pruebas aún no implementadas")*

## Contribuciones

Las contribuciones son bienvenidas. Si deseas contribuir:
1. Haz un Fork del proyecto.
2. Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza tus cambios y haz commit (`git commit -am 'Agrega nueva funcionalidad'`).
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request.

