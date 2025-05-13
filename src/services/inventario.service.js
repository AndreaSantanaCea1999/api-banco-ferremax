// c:\Users\andre\api-banco-ferremax\src\services\inventario.service.js

const axios = require('axios');

const API_INVENTARIO_URL = process.env.API_INVENTARIO_URL;

if (!API_INVENTARIO_URL) {
    console.warn("ADVERTENCIA: API_INVENTARIO_URL no está configurada en .env. La comunicación con la API de Inventario fallará.");
}

/**
 * Lista productos desde la API de Inventario.
 * @param {object} queryParams - Parámetros de consulta para filtrar, paginar, etc. (ej: { categoria: 'taladros', page: 1 })
 */
async function listarProductosDeInventario(queryParams = {}) {
    if (!API_INVENTARIO_URL) throw new Error("API_INVENTARIO_URL no configurada.");
    try {
        // Asume que tu API de inventario tiene un endpoint GET /productos que acepta query params
        const response = await axios.get(`${API_INVENTARIO_URL}/productos`, { params: queryParams });
        return response.data;
    } catch (error) {
        console.error(`Error listando productos de API Inventario:`, error.response?.data || error.message);
        throw error; // Re-lanzar para que el controlador lo maneje
    }
}

/**
 * Obtiene los detalles de un producto específico desde la API de Inventario.
 * @param {string} productoId - El ID o código del producto.
 */
async function obtenerProductoDeInventario(productoId) {
    if (!API_INVENTARIO_URL) throw new Error("API_INVENTARIO_URL no configurada.");
    try {
        // Asume que tu API de inventario tiene un endpoint GET /productos/:id
        const response = await axios.get(`${API_INVENTARIO_URL}/productos/${productoId}`);
        return response.data;
    } catch (error) {
        console.error(`Error obteniendo producto ${productoId} de API Inventario:`, error.response?.data || error.message);
        if (error.response?.status === 404) return null; // Si no se encuentra, devuelve null
        throw error; // Re-lanzar para otros errores
    }
}

/**
 * Verifica el stock de un producto en una sucursal específica en la API de Inventario.
 * Espera una respuesta como { "stock_actual": N }.
 * @param {string} productoId - El ID o código del producto.
 * @param {number} sucursalId - El ID de la sucursal.
 * @returns {Promise<number>} - El stock disponible.
 */
async function verificarStockEnInventario(productoId, sucursalId) {
    if (!API_INVENTARIO_URL) throw new Error("API_INVENTARIO_URL no configurada.");
    try {
        // Asume que tu API de inventario tiene un endpoint GET /inventario/stock?productoId=X&sucursalId=Y
        const response = await axios.get(`${API_INVENTARIO_URL}/inventario/stock`, {
            params: { productoId, sucursalId }
        });
        // Asume que la respuesta es { "stock_actual": N }
        return response.data.stock_actual || 0; // Devuelve 0 si el campo no existe o es nulo
    } catch (error) {
        console.error(`Error verificando stock para producto ${productoId} en sucursal ${sucursalId}:`, error.response?.data || error.message);
        throw error; // Re-lanzar para que el controlador lo maneje
    }
}

/**
 * Notifica a la API de Inventario para registrar un movimiento (descontar stock).
 * @param {string} productoId - El ID o código del producto.
 * @param {number} sucursalId - El ID de la sucursal.
 * @param {number} cantidad - La cantidad a descontar (debe ser positiva aquí, el servicio la convierte a negativa).
 * @param {number} pedidoId - El ID del pedido de origen.
 */
async function actualizarStockEnInventario(productoId, sucursalId, cantidad, pedidoId) {
    if (!API_INVENTARIO_URL) throw new Error("API_INVENTARIO_URL no configurada.");
    if (cantidad <= 0) {
        console.warn(`[InventarioService] Intentando descontar cantidad no positiva (${cantidad}) para producto ${productoId}.`);
        return; // No hacer nada si la cantidad no es positiva para una salida
    }
    try {
        // Asume que tu API de inventario tiene un endpoint POST /inventario/movimientos
        // y espera un payload con Cantidad negativa para salidas.
        const payload = {
            ID_Producto: productoId,
            ID_Sucursal: sucursalId,
            Cantidad: -cantidad, // Importante: la cantidad debe ser negativa para descontar
            Tipo_Movimiento: 'Salida_Venta_Online', // O el tipo que uses en tu API de Inventario
            ID_Pedido_Origen: pedidoId,
            Comentario: `Venta online pedido API Pedidos #${pedidoId}`
        };
        const response = await axios.post(`${API_INVENTARIO_URL}/inventario/movimientos`, payload);
        console.log(`Movimiento de inventario registrado exitosamente para pedido ${pedidoId}, producto ${productoId}:`, response.data);
        return response.data; // Opcional: devolver la respuesta de la API de Inventario
    } catch (error) {
        console.error(`Error al registrar movimiento de inventario para pedido ${pedidoId}, producto ${productoId}:`, error.response?.data || error.message);
        // Es crucial manejar este error. El pedido ya está pagado, pero el stock no se descontó.
        // Deberías tener un sistema de alerta o reintento aquí.
        throw error; // Re-lanzar para que el controlador lo loggee, pero el flujo de confirmación de pago debe continuar.
    }
}


module.exports = {
    listarProductosDeInventario,
    obtenerProductoDeInventario,
    verificarStockEnInventario,
    actualizarStockEnInventario,
};
