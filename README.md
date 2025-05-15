# API Banco Ferremax

API RESTful para la gestión de clientes, cuentas bancarias y transacciones para "Banco Ferremax". Este proyecto está desarrollado con Spring Boot y utiliza una base de datos en memoria H2 para facilitar la demostración y el desarrollo.

## Tecnologías Utilizadas

*   **Lenguaje:** Java 17
*   **Framework:** Spring Boot 3.2.5
    *   Spring Web (para crear APIs REST)
    *   Spring Data JPA (para la persistencia de datos)
    *   Spring Boot Actuator (para monitorización básica)
*   **Base de Datos:** H2 Database (en memoria)
*   **Gestión de Dependencias:** Maven
*   **Utilidades:** Lombok (para reducir código boilerplate)

## Prerrequisitos

*   JDK 17 o superior instalado.
*   Apache Maven 3.6 o superior instalado.
*   Un cliente API como Postman, Insomnia, o `curl` para probar los endpoints.

## Configuración y Ejecución

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/AndreaSantanaCea1999/api-banco-ferremax.git
    cd api-banco-ferremax
    ```

2.  **Compilar y empaquetar el proyecto:**
    Desde la raíz del proyecto, ejecuta el siguiente comando Maven:
    ```bash
    mvn clean package
    ```
    Esto generará un archivo `.jar` en el directorio `target/`.

3.  **Ejecutar la aplicación:**
    ```bash
    java -jar target/API-BancoFerremax-0.0.1-SNAPSHOT.jar
    ```
    La aplicación se iniciará y estará disponible por defecto en `http://localhost:8080`.

## Acceso a la Base de Datos H2

Este proyecto utiliza una base de datos H2 en memoria. Puedes acceder a la consola H2 para inspeccionar la base de datos directamente desde tu navegador:

*   **URL de la consola H2:** `http://localhost:8080/h2-console`
*   **JDBC URL:** `jdbc:h2:mem:ferremaxdb`
*   **User Name:** `sa`
*   **Password:** `password` (o déjalo en blanco si así está configurado en `application.properties`)

Asegúrate de que la aplicación esté en ejecución para acceder a la consola.

## Endpoints de la API

La URL base para todos los endpoints es `http://localhost:8080/api`.

### Clientes (`/api/clientes`)

*   **`GET /`**: Obtiene una lista de todos los clientes.
*   **`GET /{id}`**: Obtiene un cliente específico por su `id`.
*   **`POST /`**: Crea un nuevo cliente.
    *   **Request Body (ejemplo):**
        ```json
        {
          "nombre": "Ana",
          "apellido": "García",
          "rut": "12345678-9",
          "direccion": "Avenida Siempre Viva 742",
          "telefono": "987654321",
          "email": "ana.garcia@example.com"
        }
        ```
*   **`PUT /{id}`**: Actualiza un cliente existente por su `id`.
    *   **Request Body (ejemplo):** (similar al `POST`)
*   **`DELETE /{id}`**: Elimina un cliente por su `id`.

### Cuentas Bancarias (`/api/cuentas`)

*   **`GET /`**: Obtiene una lista de todas las cuentas bancarias.
*   **`GET /{id}`**: Obtiene una cuenta bancaria específica por su `id`.
*   **`POST /`**: Crea una nueva cuenta bancaria.
    *   **Request Body (ejemplo):**
        ```json
        {
          "numeroCuenta": "001122334455",
          "tipoCuenta": "AHORRO",
          "saldo": 1500.75,
          "clienteId": 1
        }
        ```
        *Nota: `clienteId` debe corresponder a un cliente existente.*
*   **`PUT /{id}`**: Actualiza una cuenta bancaria existente por su `id`.
    *   **Request Body (ejemplo):** (similar al `POST`)
*   **`DELETE /{id}`**: Elimina una cuenta bancaria por su `id`.
*   **`GET /cliente/{clienteId}`**: Obtiene todas las cuentas bancarias asociadas a un `clienteId` específico.

### Transacciones (`/api/transacciones`)

*   **`GET /`**: Obtiene una lista de todas las transacciones.
*   **`GET /{id}`**: Obtiene una transacción específica por su `id`.
*   **`POST /`**: Realiza una nueva transacción (depósito, retiro o transferencia).
    *   **Request Body (ejemplo para DEPÓSITO):**
        ```json
        {
          "tipoTransaccion": "DEPOSITO",
          "monto": 200.00,
          "cuentaOrigenId": 1
        }
        ```
    *   **Request Body (ejemplo para RETIRO):**
        ```json
        {
          "tipoTransaccion": "RETIRO",
          "monto": 50.00,
          "cuentaOrigenId": 1
        }
        ```
    *   **Request Body (ejemplo para TRANSFERENCIA):**
        ```json
        {
          "tipoTransaccion": "TRANSFERENCIA",
          "monto": 100.00,
          "cuentaOrigenId": 1,
          "cuentaDestinoId": 2
        }
        ```
        *Notas:*
        *   `cuentaOrigenId` es obligatoria para todos los tipos de transacción.
        *   `cuentaDestinoId` es obligatoria solo para `TRANSFERENCIA`.
        *   Los IDs de cuenta deben corresponder a cuentas existentes.
        *   El sistema valida que haya saldo suficiente para retiros y transferencias.
*   **`GET /cuenta/{cuentaId}`**: Obtiene todas las transacciones asociadas a un `cuentaId` específico (ya sea como origen o destino).

## Estructura del Proyecto

El proyecto sigue una estructura típica de una aplicación Spring Boot:

```
api-banco-ferremax/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/bancoferremax/
│   │   │       ├── APIBancoFerremaxApplication.java  (Clase principal de Spring Boot)
│   │   │       ├── api/
│   │   │       │   ├── controller/  (Controladores REST)
│   │   │       │   ├── dto/         (Data Transfer Objects)
│   │   │       │   ├── exception/   (Manejo de excepciones personalizadas)
│   │   │       │   ├── model/       (Entidades JPA)
│   │   │       │   ├── repository/  (Repositorios Spring Data JPA)
│   │   │       │   └── service/     (Lógica de negocio)
│   │   └── resources/
│   │       ├── application.properties (Configuración de la aplicación)
│   └── test/
│       └── java/
│           └── com/bancoferremax/ (Pruebas unitarias e de integración)
├── pom.xml (Configuración del proyecto Maven)
└── README.md (Este archivo)
```

*   **`controller`**: Maneja las solicitudes HTTP entrantes y delega a los servicios.
*   **`dto`**: Objetos de Transferencia de Datos, usados para enviar y recibir datos a través de la API.
*   **`exception`**: Clases para el manejo de excepciones personalizadas y un `GlobalExceptionHandler`.
*   **`model`**: Entidades JPA que representan las tablas de la base de datos (`Cliente`, `CuentaBancaria`, `Transaccion`).
*   **`repository`**: Interfaces que extienden de `JpaRepository` para la interacción con la base de datos.
*   **`service`**: Contiene la lógica de negocio de la aplicación.

## Ejecución de Pruebas

Para ejecutar las pruebas unitarias e de integración incluidas en el proyecto, utiliza el siguiente comando Maven:

```bash
mvn test
```

## Contribuciones

Las contribuciones son bienvenidas. Si deseas contribuir:

1.  Haz un Fork del proyecto.
2.  Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3.  Realiza tus cambios y haz commit (`git commit -am 'Agrega nueva funcionalidad'`).
4.  Haz push a la rama (`git push origin feature/nueva-funcionalidad`).
5.  Abre un Pull Request.

Por favor, asegúrate de que tus cambios pasen las pruebas existentes y, si es aplicable, añade nuevas pruebas.

