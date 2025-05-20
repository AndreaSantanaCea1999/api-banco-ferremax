const axios = require('axios');

const API_INVENTARIO_URL = process.env.API_INVENTARIO_URL || 'http://localhost:3000/api';

// Verificar stock antes de crear un pedido
const verificarStockProducto = async (idProducto, cantidad, idSucursal) => {
  try {
    const response = await axios.get(`${API_INVENTARIO_URL}/inventario/producto/${idProducto}/sucursal/${idSucursal}`);
    
    if (response.data && response.data.Stock_Actual >= cantidad) {
      return { disponible: true, stock: response.data.Stock_Actual };
    }
    
    return { disponible: false, stock: response.data ? response.data.Stock_Actual : 0 };
  } catch (error) {
    console.error('Error al verificar stock:', error.message);
    // En caso de error (como API no disponible), devolver disponible=true para permitir continuar
    return { disponible: true, stock: cantidad, error: true };
  }
};

// Actualizar inventario al confirmar un pedido
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
    // En caso de error, devolver un objeto de respuesta simulado
    return { 
      success: false, 
      message: 'No se pudo actualizar el inventario',
      error: error.message
    };
  }
};

// Obtener detalles de un producto
const obtenerDetallesProducto = async (idProducto) => {
  try {
    const response = await axios.get(`${API_INVENTARIO_URL}/productos/${idProducto}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalles del producto:', error.message);
    // En caso de error, devolver un objeto de error
    return { 
      success: false, 
      message: 'No se pudo obtener información del producto',
      error: error.message
    };
  }
};

module.exports = {
  verificarStockProducto,
  actualizarInventario,
  obtenerDetallesProducto
};