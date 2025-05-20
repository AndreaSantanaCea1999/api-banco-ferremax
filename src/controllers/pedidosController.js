const { Pedidos, DetallesPedido } = require('../models');

// Obtener todos los pedidos
const getAllPedidos = async (req, res) => {
  try {
    const pedidos = await Pedidos.findAll({
      include: [DetallesPedido]
    });
    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener un pedido por ID
const getPedidoById = async (req, res) => {
  try {
    const pedido = await Pedidos.findByPk(req.params.id, {
      include: [DetallesPedido]
    });
    
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    
    res.status(200).json(pedido);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear un nuevo pedido
const createPedido = async (req, res) => {
  try {
    const { detalles, ...pedidoData } = req.body;
    
    // Generar código de pedido único
    const fecha = new Date();
    const codigoPedido = `PD-${fecha.getFullYear()}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    // Crear pedido con transacción
    const result = await sequelize.transaction(async (t) => {
      // Crear pedido principal
      const pedido = await Pedidos.create({
        ...pedidoData,
        Codigo_Pedido: codigoPedido
      }, { transaction: t });
      
      // Crear detalles del pedido si se proporcionaron
      if (detalles && detalles.length > 0) {
        const detallesConId = detalles.map(detalle => ({
          ...detalle,
          ID_Pedido: pedido.ID_Pedido
        }));
        
        await DetallesPedido.bulkCreate(detallesConId, { transaction: t });
      }
      
      return pedido;
    });
    
    // Obtener el pedido completo con sus detalles
    const pedidoCompleto = await Pedidos.findByPk(result.ID_Pedido, {
      include: [DetallesPedido]
    });
    
    res.status(201).json(pedidoCompleto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Actualizar un pedido existente
const updatePedido = async (req, res) => {
  try {
    const pedido = await Pedidos.findByPk(req.params.id);
    
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    
    // Actualizar solo los campos permitidos
    const camposActualizables = ['Estado', 'Metodo_Entrega', 'Direccion_Entrega', 'Ciudad_Entrega', 'Region_Entrega', 'Comentarios', 'Fecha_Estimada_Entrega', 'Prioridad'];
    
    const actualizaciones = {};
    camposActualizables.forEach(campo => {
      if (req.body[campo] !== undefined) {
        actualizaciones[campo] = req.body[campo];
      }
    });
    
    await pedido.update(actualizaciones);
    
    const pedidoActualizado = await Pedidos.findByPk(req.params.id, {
      include: [DetallesPedido]
    });
    
    res.status(200).json(pedidoActualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Cambiar estado de un pedido
const cambiarEstadoPedido = async (req, res) => {
  try {
    const { estado } = req.body;
    
    if (!estado) {
      return res.status(400).json({ message: 'Se requiere el campo estado' });
    }
    
    const pedido = await Pedidos.findByPk(req.params.id);
    
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    
    await pedido.update({ Estado: estado });
    
    res.status(200).json({ message: `Estado del pedido actualizado a ${estado}`, pedido });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getAllPedidos,
  getPedidoById,
  createPedido,
  updatePedido,
  cambiarEstadoPedido
};