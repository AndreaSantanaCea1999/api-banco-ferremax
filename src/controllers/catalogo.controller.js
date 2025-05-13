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
        // Devolver el estado y mensaje de error de la API de inventario si está disponible
        let statusCode = 500;
        let errorMessage = "Error al obtener productos del catálogo.";
        if (axios.isAxiosError(error) && error.response) {
            statusCode = error.response.status;
            errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
        }
        res.status(statusCode).json({
            error: "Error al obtener productos del catálogo.",
            detalle: error.response?.data || error.message
        });
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
        if (axios.isAxiosError(error) && error.response) {
            statusCode = error.response.status;
        }
        res.status(statusCode).json({
            error: "Error al obtener el producto del catálogo.",
            detalle: error.response?.data || error.message
        });
    }
};