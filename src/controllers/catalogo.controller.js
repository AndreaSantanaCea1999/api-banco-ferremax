const inventarioService = require('../services/inventario.service');
const axios = require('axios'); // Importar axios para verificar si el error es de red

exports.obtenerProductos = async (req, res) => {
    try {
        // req.query contendrá todos los parámetros de consulta pasados en la URL
        // ej: si la URL es /productos?marca=Bosch&sort=precio_asc, req.query será { marca: 'Bosch', sort: 'precio_asc' }
        const productos = await inventarioService.listarProductosDeInventario(req.query);
        res.json(productos);
    } catch (error) {
        console.error("Error en catalogoController.obtenerProductos:", error);  // Loggear el error completo
        let statusCode = 500;
        let errorResponse = {
            error: "Error al obtener productos del catálogo.", // Mensaje por defecto
            detalle: error.message // Detalle por defecto
        };

        if (axios.isAxiosError(error) && error.response) {
            statusCode = error.response.status;
            // Usar el mensaje de error de la API externa si está disponible, o uno más genérico si no.
            errorResponse.error = error.response.data?.error || error.response.data?.message || `Error ${statusCode} al contactar el servicio de inventario.`;
            // El objeto 'data' de la respuesta de error puede contener más detalles.
            errorResponse.detalle = error.response.data || error.message;
        }
        res.status(statusCode).json(errorResponse);
    }
};

exports.obtenerProductoPorId = async (req, res) => {
    const productoId = req.params.id; // Definir productoId aquí para usarlo en el log de error
    try {
        const producto = await inventarioService.obtenerProductoDeInventario(productoId);
        if (!producto) {
            return res.status(404).json({ error: "Producto no encontrado en el catálogo." });
        }
        res.json(producto);
    } catch (error) {
        console.error(`Error en catalogoController.obtenerProductoPorId (${productoId}):`, error); // Loggear el error completo
        let statusCode = 500;
        let errorResponse = {
            error: "Error al obtener el producto del catálogo.", // Mensaje por defecto
            detalle: error.message // Detalle por defecto
        };

        if (axios.isAxiosError(error) && error.response) {
            statusCode = error.response.status;
            errorResponse.error = error.response.data?.error || error.response.data?.message || `Error ${statusCode} al contactar el servicio de inventario para el producto ${productoId}.`;
            errorResponse.detalle = error.response.data || error.message;
        }
        res.status(statusCode).json(errorResponse);
    }
};