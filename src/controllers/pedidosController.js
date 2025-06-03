// src/controllers/pedidosController.js
const { Pedidos, DetallesPedido } = require('../models');
const sequelize = require('../config/database');
const inventarioService = require('../services/inventarioService');

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
    // Deshabilitar verificación de clave foránea temporalmente
    await sequelize.query('SET FOREIGN_KEY_CHECKS=0;');
    
    const { detalles, ...pedidoData } = req.body;
    
    // Verificar stock para todos los productos del pedido
    if (detalles && detalles.length > 0) {
      for (const detalle of detalles) {
        try {
          const stockDisponible = await inventarioService.verificarStockProducto(
            detalle.ID_Producto,
            detalle.Cantidad,
            pedidoData.ID_Sucursal
          );
          
          if (!stockDisponible.disponible) {
            return res.status(400).json({
              error: `Stock insuficiente para el producto ID ${detalle.ID_Producto}. Disponible: ${stockDisponible.stock}`
            });
          }
        } catch (error) {
          console.error('Error al verificar stock:', error);
          // Si la API de inventario no está disponible, continuamos con la creación del pedido
        }
      }
    }
    
    // Generar código de pedido único
    const fecha = new Date();
    const codigoPedido = `PD-${fecha.getFullYear()}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    // Crear pedido
    const pedido = await Pedidos.create({
      ...pedidoData,
      Codigo_Pedido: codigoPedido
    });
    
    // Si hay detalles, crearlos también
    if (detalles && detalles.length > 0) {
      // Consultar el ID máximo actual
      const [results] = await sequelize.query('SELECT MAX(ID_Detalle) as maxId FROM DETALLES_PEDIDO');
      let nextId = results[0].maxId ? parseInt(results[0].maxId) + 1 : 1;
      
      // Asignar IDs explícitos a cada detalle
      const detallesConId = detalles.map(detalle => {
        return {
          ID_Detalle: nextId++,
          ID_Pedido: pedido.ID_Pedido,
          ID_Producto: detalle.ID_Producto,
          Cantidad: detalle.Cantidad,
          Precio_Unitario: detalle.Precio_Unitario,
          Descuento: detalle.Descuento || 0,
          Impuesto: detalle.Impuesto || 0,
          Subtotal: detalle.Subtotal,
          Estado: detalle.Estado || 'Pendiente'
        };
      });
      
      // Crear los detalles uno por uno para mayor control
      for (const detalle of detallesConId) {
        try {
          await DetallesPedido.create(detalle, { validate: false });
        } catch (error) {
          console.error(`Error al crear detalle: ${error.message}`);
        }
      }
    }
    
    // Rehabilitar verificaciones
    await sequelize.query('SET FOREIGN_KEY_CHECKS=1;');
    
    // Obtener el pedido completo con sus detalles
    const pedidoCompleto = await Pedidos.findByPk(pedido.ID_Pedido, {
      include: [DetallesPedido]
    });
    
    res.status(201).json(pedidoCompleto);
  } catch (error) {
    // En caso de error, asegurar que se reactiva la verificación
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS=1;');
    } catch (innerError) {
      console.error('Error al reactivar verificación FK:', innerError);
    }
    
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
    
    const pedido = await Pedidos.findByPk(req.params.id, {
      include: [DetallesPedido]
    });
    
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Si el pedido pasa a "Aprobado", actualizar inventario y DETALLES
    if (estado === 'Aprobado' && pedido.Estado !== 'Aprobado') {
      // Actualizar stock y estado de cada detalle
      if (pedido.DETALLES_PEDIDOs && pedido.DETALLES_PEDIDOs.length > 0) {
        for (const detalle of pedido.DETALLES_PEDIDOs) {
          try {
            // 1. Actualizar inventario
            await inventarioService.actualizarInventario(
              detalle.ID_Producto,
              detalle.Cantidad,
              pedido.ID_Sucursal,
              'Salida'
            );
            
            // 2. Actualizar estado del detalle a "Preparado"
            await DetallesPedido.update(
              { Estado: 'Preparado' },
              { where: { ID_Detalle: detalle.ID_Detalle } }
            );
          } catch (error) {
            console.error(`Error al procesar detalle ${detalle.ID_Detalle}:`, error);
            // Continuamos con el siguiente detalle si hay error en uno
          }
        }
      }
    }
    
    // Si el pedido pasa a "Cancelado" o "Devuelto" y estaba "Aprobado", reponer stock
    if ((estado === 'Cancelado' || estado === 'Devuelto') && pedido.Estado === 'Aprobado') {
      if (pedido.DETALLES_PEDIDOs && pedido.DETALLES_PEDIDOs.length > 0) {
        for (const detalle of pedido.DETALLES_PEDIDOs) {
          try {
            // 1. Actualizar inventario (reponer stock)
            await inventarioService.actualizarInventario(
              detalle.ID_Producto,
              detalle.Cantidad,
              pedido.ID_Sucursal,
              'Entrada'
            );
            
            // 2. Actualizar estado del detalle
            await DetallesPedido.update(
              { Estado: estado === 'Cancelado' ? 'Cancelado' : 'Devuelto' },
              { where: { ID_Detalle: detalle.ID_Detalle } }
            );
          } catch (error) {
            console.error(`Error al procesar detalle ${detalle.ID_Detalle}:`, error);
          }
        }
      }
    }
    
    // Actualizar estado del pedido principal
    await pedido.update({ Estado: estado });
    
    // Obtener pedido actualizado con detalles actualizados
    const pedidoActualizado = await Pedidos.findByPk(req.params.id, {
      include: [DetallesPedido]
    });
    
    res.status(200).json({ 
      message: `Estado del pedido actualizado a ${estado}`, 
      pedido: pedidoActualizado 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Obtener pedidos por cliente
const getPedidosByCliente = async (req, res) => {
  try {
    const pedidos = await Pedidos.findAll({
      where: { ID_Cliente: req.params.clienteId },
      include: [DetallesPedido]
    });
    
    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener pedidos por sucursal
const getPedidosBySucursal = async (req, res) => {
  try {
    const pedidos = await Pedidos.findAll({
      where: { ID_Sucursal: req.params.sucursalId },
      include: [DetallesPedido]
    });
    
    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener pedidos por estado
const getPedidosByEstado = async (req, res) => {
  try {
    const pedidos = await Pedidos.findAll({
      where: { Estado: req.params.estado },
      include: [DetallesPedido]
    });
    
    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllPedidos,
  getPedidoById,
  createPedido,
  updatePedido,
  cambiarEstadoPedido,
  getPedidosByCliente,
  getPedidosBySucursal,
  getPedidosByEstado
};