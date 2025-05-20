FERREMAX - API de Ventas y Pagos
Esta API forma parte del sistema integrado de FERREMAX, una distribuidora de productos de ferretería y construcción con múltiples sucursales en Chile y proyección internacional. La API de Ventas y Pagos gestiona pedidos, procesamiento de pagos con WebPay y conversión de divisas, integrándose con la API de Inventario.
Contenido

Características Principales
Tecnologías Utilizadas
Estructura del Proyecto
Servicios Integrados
Instalación y Configuración
Variables de Entorno
Documentación de Endpoints
Ejemplos de Uso
Integración con API de Inventario
Seguridad
Pruebas

Características Principales

Gestión de Pedidos: Creación, consulta y actualización de pedidos y sus detalles
Procesamiento de Pagos: Integración completa con WebPay para pagos con tarjetas
Conversión de Divisas: Conversión en tiempo real de precios a múltiples monedas
Actualización de Inventario: Comunicación con API de Inventario para actualizar stock
Simulación de Banco Central: Gestión de tipos de cambio entre diferentes divisas

Tecnologías Utilizadas

Node.js: Entorno de ejecución
Express.js: Framework para la API REST
Sequelize ORM: Mapeo objeto-relacional para MySQL
MySQL: Base de datos relacional
Axios: Cliente HTTP para comunicación con APIs externas
dotenv: Gestión de variables de entorno

Estructura del Proyecto
src/
├── config/
│   └── database.js         # Configuración de la conexión a la base de datos
├── controllers/            # Lógica de negocio para cada ruta
│   ├── detallesPedidoController.js
│   ├── divisasController.js
│   ├── pagosController.js
│   ├── pedidosController.js
│   ├── tiposCambioController.js
│   └── webpayController.js
├── models/                 # Definiciones de los modelos de Sequelize
│   ├── detallesPedido.js
│   ├── divisas.js
│   ├── index.js            # Inicializa modelos y define relaciones
│   ├── pagos.js
│   ├── pedidos.js
│   ├── tiposCambio.js
│   └── webpayTransacciones.js
├── routes/                 # Definiciones de las rutas de la API
│   ├── detallesPedidoRoutes.js
│   ├── divisasRoutes.js
│   ├── index.js            # Enrutador principal
│   ├── pagosRoutes.js
│   ├── pedidosRoutes.js
│   ├── tiposCambioRoutes.js
│   └── webpayRoutes.js
├── services/               # Servicios para comunicación con otras APIs
│   ├── bancoCentralService.js  # Simulación de Banco Central
│   ├── inventarioService.js    # Comunicación con API de Inventario
│   └── webpayService.js        # Integración con WebPay
└── app.js                  # Archivo principal de la aplicación Express
Servicios Integrados
WebPay
La API se integra con WebPay para procesar pagos con tarjetas de débito y crédito. Implementa el ciclo completo:

Inicio de transacción
Procesamiento del pago
Confirmación y verificación

Banco Central (Simulado)
Implementa una simulación del servicio del Banco Central de Chile para:

Obtener tipos de cambio en tiempo real
Convertir montos entre diferentes divisas
Actualizar automáticamente tasas de cambio

API de Inventario
Se comunica con la API de Inventario para:

Verificar disponibilidad de stock antes de crear pedidos
Actualizar niveles de inventario al aprobar o cancelar pedidos

Instalación y Configuración
Requisitos Previos

Node.js v14 o superior
MySQL 5.7 o superior
npm o yarn

Pasos de Instalación
bash# Clonar repositorio
git clone https://github.com/usuario/api-banco-ferremax.git
cd api-banco-ferremax

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con las credenciales necesarias

# Iniciar la API en modo desarrollo
npm run dev

# O iniciar en modo producción
npm start
Variables de Entorno
Crea un archivo .env en la raíz del proyecto con las siguientes variables:
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=ferremax

# API de Inventario
API_INVENTARIO_URL=http://localhost:3000/api

# WebPay (Desarrollo/Testing)
WEBPAY_API_KEY=api_key_simulada
WEBPAY_API_SECRET=api_secret_simulada
WEBPAY_API_URL=https://webpay3g.transbank.cl

# Puerto
PORT=3001

# Entorno
NODE_ENV=development
Documentación de Endpoints
Pedidos
MétodoRutaDescripciónGET/api/pedidosObtener todos los pedidosGET/api/pedidos/:idObtener un pedido por IDPOST/api/pedidosCrear un nuevo pedidoPUT/api/pedidos/:idActualizar un pedidoPATCH/api/pedidos/:id/estadoActualizar estado de un pedido
Detalles de Pedido
MétodoRutaDescripciónGET/api/detalles-pedido/pedido/:pedidoIdObtener detalles de un pedidoPATCH/api/detalles-pedido/:id/estadoActualizar estado de un detalle
Pagos
MétodoRutaDescripciónGET/api/pagosObtener todos los pagosGET/api/pagos/pedido/:pedidoIdObtener pagos de un pedidoPOST/api/pagosRegistrar un nuevo pagoPATCH/api/pagos/:id/estadoActualizar estado de un pago
WebPay
MétodoRutaDescripciónPOST/api/webpay/iniciarIniciar transacción WebPayPOST/api/webpay/confirmarConfirmar transacción WebPayPOST/api/webpay/estado-transaccionVerificar estado de transacción
Divisas
MétodoRutaDescripciónGET/api/divisasObtener todas las divisasGET/api/divisas/:idObtener una divisa por IDPOST/api/divisasCrear una nueva divisaPUT/api/divisas/:idActualizar una divisaPATCH/api/divisas/:id/defaultEstablecer divisa predeterminada
Tipos de Cambio
MétodoRutaDescripciónGET/api/tipos-cambioObtener todos los tipos de cambioGET/api/tipos-cambio/consultaConsultar tipo de cambio específicoPOST/api/tipos-cambio/convertirConvertir monto entre divisasPOST/api/tipos-cambio/actualizarActualizar tasas de cambio
Ejemplos de Uso
Crear un Pedido
Solicitud:
bashcurl -X POST "http://localhost:3001/api/pedidos" \
  -H "Content-Type: application/json" \
  -d '{
    "ID_Cliente": 1,
    "ID_Vendedor": 1,
    "ID_Sucursal": 1,
    "Canal": "Online",
    "Estado": "Pendiente",
    "Metodo_Entrega": "Despacho_Domicilio",
    "Direccion_Entrega": "Av. Providencia 1234",
    "Ciudad_Entrega": "Santiago",
    "Region_Entrega": "Metropolitana",
    "Comentarios": "Pedido de prueba",
    "Subtotal": 193970,
    "Descuento": 5000,
    "Impuestos": 36854,
    "Costo_Envio": 5000,
    "Total": 230824,
    "ID_Divisa": 1,
    "detalles": [
      {
        "ID_Producto": 1,
        "Cantidad": 1,
        "Precio_Unitario": 69990,
        "Descuento": 0,
        "Impuesto": 13298,
        "Subtotal": 69990,
        "Estado": "Pendiente"
      },
      {
        "ID_Producto": 2,
        "Cantidad": 1,
        "Precio_Unitario": 110990,
        "Descuento": 5000,
        "Impuesto": 20088,
        "Subtotal": 105990,
        "Estado": "Pendiente"
      }
    ]
  }'
Respuesta:
json{
  "ID_Pedido": 22,
  "Codigo_Pedido": "PD-20250520-4804",
  "ID_Cliente": 1,
  "ID_Vendedor": 1,
  "ID_Sucursal": 1,
  "Fecha_Pedido": "2025-05-20T05:38:47.246Z",
  "Canal": "Online",
  "Estado": "Pendiente",
  "Metodo_Entrega": "Despacho_Domicilio",
  "Direccion_Entrega": "Av. Providencia 1234",
  "Ciudad_Entrega": "Santiago",
  "Region_Entrega": "Metropolitana",
  "Pais_Entrega": "Chile",
  "Comentarios": "Pedido de prueba para integración",
  "Subtotal": 193970,
  "Descuento": 5000,
  "Impuestos": 36854,
  "Costo_Envio": 5000,
  "Total": 230824,
  "ID_Divisa": 1,
  "Prioridad": "Normal"
}
Iniciar Transacción WebPay
Solicitud:
bashcurl -X POST "http://localhost:3001/api/webpay/iniciar" \
  -H "Content-Type: application/json" \
  -d '{
    "idPedido": 22,
    "monto": 230824,
    "returnUrl": "http://localhost:3001/api/webpay/resultado",
    "finalUrl": "http://localhost:3001"
  }'
Respuesta:
json{
  "token": "SIMU-1747719876686-406342",
  "url": "https://webpay3g.transbank.cl/webpayserver/initTransaction?token_ws=SIMU-1747719876686-406342",
  "idPago": 10
}
Convertir Montos entre Divisas
Solicitud:
bashcurl -X POST "http://localhost:3001/api/tipos-cambio/convertir" \
  -H "Content-Type: application/json" \
  -d '{
    "monto": 100000,
    "origen": "CLP",
    "destino": "USD"
  }'
Respuesta:
json{
  "montoOriginal": 100000,
  "divisaOrigen": "CLP",
  "montoConvertido": 110,
  "divisaDestino": "USD",
  "tasaCambio": 0.0011,
  "fecha": "2025-05-20T05:45:12.678Z"
}
Integración con API de Inventario
La API de Ventas y Pagos se comunica con la API de Inventario para varias funcionalidades clave:
Verificación de Stock
Al crear un pedido, la API verifica automáticamente la disponibilidad de stock para cada producto:
javascript// En services/inventarioService.js
const verificarStockProducto = async (idProducto, cantidad, idSucursal) => {
  try {
    const response = await axios.get(`${API_INVENTARIO_URL}/inventario/producto/${idProducto}/sucursal/${idSucursal}`);
    
    if (response.data && response.data.Stock_Actual >= cantidad) {
      return { disponible: true, stock: response.data.Stock_Actual };
    }
    
    return { disponible: false, stock: response.data ? response.data.Stock_Actual : 0 };
  } catch (error) {
    console.error('Error al verificar stock:', error.message);
    throw new Error('No se pudo verificar el stock del producto');
  }
};
Actualización de Inventario
Al cambiar el estado de un pedido a "Aprobado", la API actualiza automáticamente el inventario:
javascript// Actualizar inventario al confirmar un pedido
const actualizarInventario = async (idProducto, cantidad, idSucursal, tipoMovimiento = 'Salida') => {
  try {
    const response = await axios.post(`${API_INVENTARIO_URL}/movimientos-inventario`, {
      ID_Producto: idProducto,
      ID_Sucursal: idSucursal,
      Tipo_Movimiento: tipoMovimiento,
      Cantidad: cantidad,
      Comentario: `Movimiento generado por API Ventas - Pedido confirmado`
    });
    
    return response.data;
  } catch (error) {
    console.error('Error al actualizar inventario:', error.message);
    throw new Error('No se pudo actualizar el inventario');
  }
};
Seguridad
La API implementa las siguientes medidas de seguridad:

Validación de datos de entrada: Verificación rigurosa de todos los datos
Manejo estructurado de errores: Mensajes de error informativos pero seguros
CORS configurable: Control de dominios que pueden acceder a la API
Variables de entorno: Configuración segura para credenciales sensibles

Recomendaciones para Producción

Implementar autenticación JWT para todas las rutas
Utilizar HTTPS para toda la comunicación
Configurar rate limiting para prevenir abusos
Implementar logging detallado para auditoría

Pruebas
La API incluye pruebas unitarias y de integración:
bash# Ejecutar pruebas
npm test

# Ejecutar pruebas con cobertura
npm run test:coverage
Además, se proporciona una colección de Postman para probar todos los endpoints:
Descargar Colección Postman

Contacto y Soporte
Para preguntas o soporte, contacte al equipo de desarrollo:

Email: soporte@ferremas.cl
Issues: Usar el sistema de issues de GitHub
Documentación adicional: Consultar la wiki del proyecto

Licencia
Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.