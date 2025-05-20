const { Pagos, WebpayTransacciones } = require('../models');

// Obtener todos los pagos
const getAllPagos = async (req, res) => {
  try {
    const pagos = await Pagos.findAll({
      include: [WebpayTransacciones]
    });
    res.status(200).json(pagos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener pagos por ID de pedido
const getPagosByPedidoId = async (req, res) => {
  try {
    const pagos = await Pagos.findAll({
      where: { ID_Pedido: req.params.pedidoId },
      include: [WebpayTransacciones]
    });
    
    res.status(200).json(pagos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Registrar un nuevo pago
const createPago = async (req, res) => {
  try {
    const pago = await Pagos.create(req.body);
    
    res.status(201).json(pago);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Actualizar estado de pago
const updateEstadoPago = async (req, res) => {
  try {
    const { estado } = req.body;
    
    if (!estado) {
      return res.status(400).json({ message: 'Se requiere el campo estado' });
    }
    
    const pago = await Pagos.findByPk(req.params.id);
    
    if (!pago) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }
    
    await pago.update({ Estado: estado });
    
    res.status(200).json({ message: `Estado del pago actualizado a ${estado}`, pago });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getAllPagos,
  getPagosByPedidoId,
  createPago,
  updateEstadoPago
};