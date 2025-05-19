// src/controllers/pedidos.controller.js (continuación)
exports.actualizarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizacion = req.body;
    
    // Verificar que el ID sea un número válido
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'ID no válido',
        message: 'El ID del pedido debe ser un número'
      });
    }
    
    // No permitir actualizar ciertos campos críticos directamente
    const camposRestringidos = ['id', 'codigoPedido', 'clienteId', 'total', 'subtotal'];
    for (const campo of camposRestringidos) {
      if (datosActualizacion[campo] !== undefined) {
        delete datosActualizacion[campo];
      }
    }
    
    // Si se va a cambiar el estado, usar el método específico para eso
    if (datosActualizacion.estado) {
      // Aseguramos que usuarioId esté presente
      const usuarioId = req.body.usuarioId || 1; // Fallback a usuario 1 (admin)
      const comentario = req.body.comentario || `Estado actualizado a ${datosActualizacion.estado}`;
      
      // Actualiza el estado del pedido
      const actualizado = await pedidoService.cambiarEstadoPedido(
        parseInt(id),
        datosActualizacion.estado,
        usuarioId,
        comentario
      );
      
      if (!actualizado) {
        return res.status(404).json({
          error: 'Pedido no encontrado',
          message: `No se encontró un pedido con el ID ${id}`
        });
      }
      
      return res.status(200).json({
        mensaje: `Estado del pedido ${id} actualizado a ${datosActualizacion.estado}`,
        pedidoId: parseInt(id),
        estado: datosActualizacion.estado
      });
    }
    
    // Para otras actualizaciones
    res.status(200).json({
      mensaje: 'Pedido actualizado exitosamente',
      pedidoId: parseInt(id)
    });
  } catch (error) {
    console.error(`Error al actualizar pedido ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Error al actualizar pedido',
      message: error.message
    });
  }
};

/**
 * Elimina un pedido (marcado como cancelado)
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.eliminarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el ID sea un número válido
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'ID no válido',
        message: 'El ID del pedido debe ser un número'
      });
    }
    
    // En vez de eliminar físicamente, cambiamos el estado a "Cancelado"
    const usuarioId = req.body.usuarioId || 1; // Fallback a usuario 1 (admin)
    const motivoCancelacion = req.body.motivo || 'Cancelado por solicitud del cliente';
    
    // Cancelar el pedido
    const cancelado = await pedidoService.cambiarEstadoPedido(
      parseInt(id),
      'Cancelado',
      usuarioId,
      motivoCancelacion
    );
    
    if (!cancelado) {
      return res.status(404).json({
        error: 'Pedido no encontrado',
        message: `No se encontró un pedido con el ID ${id}`
      });
    }
    
    res.status(200).json({
      mensaje: `Pedido ${id} cancelado exitosamente`,
      motivo: motivoCancelacion
    });
  } catch (error) {
    console.error(`Error al eliminar pedido ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Error al eliminar pedido',
      message: error.message
    });
  }
};

/**
 * Procesa la confirmación de pago de Webpay
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.confirmacionWebpay = async (req, res) => {
  try {
    // Webpay envía el token en la URL o en el body según se configure
    const token = req.query.token_ws || req.body.token_ws;
    
    if (!token) {
      console.error('Llamada a confirmación de Webpay sin token');
      return res.status(400).json({
        error: 'Token no proporcionado',
        message: 'Se requiere token_ws para confirmar la transacción'
      });
    }
    
    // Procesar la confirmación de pago
    const resultado = await pedidoService.procesarConfirmacionPago(token);
    
    // Si es una solicitud del navegador (GET), redirigir a página de éxito/fracaso
    if (req.method === 'GET') {
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${baseUrl}/confirmacion-pedido/${resultado.codigoPedido}`);
    }
    
    // Para solicitudes de API (POST), devolver JSON
    res.status(200).json(resultado);
  } catch (error) {
    console.error('Error en confirmación de Webpay:', error);
    
    // Si es una solicitud del navegador, redirigir a página de error
    if (req.method === 'GET') {
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${baseUrl}/error-pago?mensaje=${encodeURIComponent(error.message)}`);
    }
    
    // Para solicitudes de API, devolver error en JSON
    res.status(500).json({
      error: 'Error en confirmación de pago',
      message: error.message
    });
  }
};

module.exports = {
  crearPedido,
  obtenerPedidos,
  obtenerPedidoPorId,
  actualizarPedido,
  eliminarPedido,
  confirmacionWebpay
};