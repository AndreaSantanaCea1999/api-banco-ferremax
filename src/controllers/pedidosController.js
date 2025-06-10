// src/controllers/pedidosController.js
const { Pedidos, DetallesPedido, sequelize } = require('../models'); // Importar sequelize desde models/index.js o config/database.js
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
  const t = await sequelize.transaction();
  try {
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
              message: `Stock insuficiente para el producto ID ${detalle.ID_Producto}. Disponible: ${stockDisponible.stock}`,
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
    }, { transaction: t });
    
    // Si hay detalles, crearlos también
    if (detalles && detalles.length > 0) {
      // Crear los detalles uno por uno para mayor control
      for (const detalleData of detalles) {
        try {
          await DetallesPedido.create({
            ID_Pedido: pedido.ID_Pedido, // Asociar con el pedido recién creado
            ID_Producto: detalleData.ID_Producto,
            Cantidad: detalleData.Cantidad,
            Precio_Unitario: detalleData.Precio_Unitario,
            Descuento: detalleData.Descuento || 0,
            Impuesto: detalleData.Impuesto || 0,
            Subtotal: detalleData.Subtotal,
            Estado: detalleData.Estado || 'Pendiente'
          }, { transaction: t /* , validate: false */ }); // Considerar remover validate: false
        } catch (error) {
          console.error(`Error al crear detalle: ${error.message}`);
          // Re-lanzar el error para que la transacción haga rollback
          throw error;
        }
      }
    }
    
    await t.commit();
    
    // Obtener el pedido completo con sus detalles
    const pedidoCompleto = await Pedidos.findByPk(pedido.ID_Pedido, {
      include: [DetallesPedido]
    });
    res.status(201).json(pedidoCompleto);
  } catch (error) {
    await t.rollback();
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
    if (estado === 'Aprobado' && pedido.Estado !== 'Aprobado') { // TODO: Revisar el alias correcto para DetallesPedido
      // Actualizar stock y estado de cada detalle. Asumiendo que el alias es 'DetallesPedidos' o el definido en el include.
      if (pedido.DetallesPedidos && pedido.DetallesPedidos.length > 0) {
        for (const detalle of pedido.DetallesPedidos) {
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
      if (pedido.DetallesPedidos && pedido.DetallesPedidos.length > 0) { // TODO: Revisar el alias correcto
        for (const detalle of pedido.DetallesPedidos) {
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