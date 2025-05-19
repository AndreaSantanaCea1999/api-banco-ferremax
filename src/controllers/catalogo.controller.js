
// src/controllers/catalogo.controller.js
const inventarioService = require('../services/inventario.service');

/**
 * Obtiene productos del catálogo (desde la API de Inventario)
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerProductos = async (req, res) => {
  try {
    // Pasar todos los query params a la API de Inventario
    const queryParams = req.query;
    
    // Obtener productos desde el servicio de inventario
    const productos = await inventarioService.listarProductosDeInventario(queryParams);
    
    // Verificar si se obtuvieron productos
    if (!productos || productos.length === 0) {
      return res.status(200).json({
        total: 0,
        data: []
      });
    }
    
    // Formatear la respuesta
    res.status(200).json({
      total: productos.data ? productos.data.length : productos.length,
      data: productos.data || productos
    });
  } catch (error) {
    console.error('Error al obtener productos del catálogo:', error);
    
    let statusCode = 500;
    let errorMessage = 'Error al obtener productos del catálogo';
    
    // Si es un error de conexión con la API de Inventario
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      statusCode = 503;
      errorMessage = 'La API de Inventario no está disponible en este momento';
    }
    
    // Si el error viene de la API de Inventario con un status específico
    if (error.response && error.response.status) {
      statusCode = error.response.status;
      errorMessage = error.response.data?.error || errorMessage;
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      message: error.message
    });
  }
};

/**
 * Obtiene un producto específico por su ID
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Llamar al servicio de inventario
    const producto = await inventarioService.obtenerProductoDeInventario(id);
    
    // Verificar si se encontró el producto
    if (!producto) {
      return res.status(404).json({
        error: 'Producto no encontrado',
        message: `No se encontró un producto con el ID ${id}`
      });
    }
    
    // Devolver el producto
    res.status(200).json(producto);
  } catch (error) {
    console.error(`Error al obtener producto ${req.params.id}:`, error);
    
    let statusCode = 500;
    let errorMessage = `Error al obtener producto con ID ${req.params.id}`;
    
    // Si es un error de conexión con la API de Inventario
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      statusCode = 503;
      errorMessage = 'La API de Inventario no está disponible en este momento';
    }
    
    // Si el error viene de la API de Inventario con un status específico
    if (error.response && error.response.status) {
      statusCode = error.response.status;
      errorMessage = error.response.data?.error || errorMessage;
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      message: error.message
    });
  }
};

/**
 * Obtiene productos por categoría
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerProductosPorCategoria = async (req, res) => {
  try {
    const { categoriaId } = req.params;
    
    // Construir los parámetros de consulta
    const queryParams = {
      ...req.query,
      ID_Categoria: categoriaId
    };
    
    // Llamar al servicio de inventario
    const productos = await inventarioService.listarProductosDeInventario(queryParams);
    
    // Formatear la respuesta
    res.status(200).json({
      total: productos.data ? productos.data.length : productos.length,
      categoriaId,
      data: productos.data || productos
    });
  } catch (error) {
    console.error(`Error al obtener productos por categoría ${req.params.categoriaId}:`, error);
    
    let statusCode = 500;
    let errorMessage = `Error al obtener productos de la categoría ${req.params.categoriaId}`;
    
    // Manejar errores específicos
    if (error.response && error.response.status) {
      statusCode = error.response.status;
      errorMessage = error.response.data?.error || errorMessage;
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      message: error.message
    });
  }
};

/**
 * Obtiene productos por marca
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerProductosPorMarca = async (req, res) => {
  try {
    const { marcaId } = req.params;
    
    // Construir los parámetros de consulta
    const queryParams = {
      ...req.query,
      ID_Marca: marcaId
    };
    
    // Llamar al servicio de inventario
    const productos = await inventarioService.listarProductosDeInventario(queryParams);
    
    // Formatear la respuesta
    res.status(200).json({
      total: productos.data ? productos.data.length : productos.length,
      marcaId,
      data: productos.data || productos
    });
  } catch (error) {
    console.error(`Error al obtener productos por marca ${req.params.marcaId}:`, error);
    
    let statusCode = 500;
    let errorMessage = `Error al obtener productos de la marca ${req.params.marcaId}`;
    
    // Manejar errores específicos
    if (error.response && error.response.status) {
      statusCode = error.response.status;
      errorMessage = error.response.data?.error || errorMessage;
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      message: error.message
    });
  }
};

/**
 * Busca productos según términos de búsqueda
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.buscarProductos = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({
        error: 'Parámetro de búsqueda inválido',
        message: 'Se requiere un término de búsqueda (q)'
      });
    }
    
    // Construir los parámetros de consulta
    const queryParams = {
      ...req.query,
      search: q
    };
    
    // Llamar al servicio de inventario
    const productos = await inventarioService.listarProductosDeInventario(queryParams);
    
    // Formatear la respuesta
    res.status(200).json({
      total: productos.data ? productos.data.length : productos.length,
      termino: q,
      data: productos.data || productos
    });
  } catch (error) {
    console.error(`Error en búsqueda de productos con término "${req.query.q}":`, error);
    
    let statusCode = 500;
    let errorMessage = 'Error al buscar productos';
    
    // Manejar errores específicos
    if (error.response && error.response.status) {
      statusCode = error.response.status;
      errorMessage = error.response.data?.error || errorMessage;
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      message: error.message
    });
  }
};

module.exports = {
  obtenerProductos,
  obtenerProductoPorId,
  obtenerProductosPorCategoria,
  obtenerProductosPorMarca,
  buscarProductos
};
Claude
