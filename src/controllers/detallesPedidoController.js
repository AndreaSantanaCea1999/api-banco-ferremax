const { DetallesPedido, Productos } = require('../models');

// Obtener todos los detalles de un pedido
const getDetallesByPedidoId = async (req, res) => {
  try {
    const detalles = await DetallesPedido.findAll({
      where: { ID_Pedido: req.params.pedidoId },
      include: [Productos]
    });
    
    res.status(200).json(detalles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar estado de un detalle de pedido
const updateEstadoDetalle = async (req, res) => {
  try {
    const { estado } = req.body;
    
    if (!estado) {
      return res.status(400).json({ message: 'Se requiere el campo estado' });
    }
    
    const detalle = await DetallesPedido.findByPk(req.params.id);
    
    if (!detalle) {
      return res.status(404).json({ message: 'Detalle de pedido no encontrado' });
    }
    
    await detalle.update({ Estado: estado });
    
    res.status(200).json({ message: `Estado del detalle actualizado a ${estado}`, detalle });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getDetallesByPedidoId,
  updateEstadoDetalle
};