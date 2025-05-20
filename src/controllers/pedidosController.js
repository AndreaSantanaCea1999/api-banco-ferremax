// src/controllers/pedidosController.js

const { Pedidos, DetallesPedido } = require('../models');
const sequelize = require('../config/database');
const inventarioService = require('../services/inventarioService');

// Obtener todos los pedidos con sus detalles
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

// Obtener un pedido por ID con sus detalles
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

// Crear un nuevo pedido con validación de stock y detalles
const createPedido = async (req, res) => {
  try {
    await sequelize.query('SET FOREIGN_KEY_CHECKS=0;');

    const { detalles, ...pedidoData } = req.body;

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
          // Continuar si la API de inventario no está disponible
        }
      }
    }

    const fecha = new Date();
    const codigoPedido = `PD-${fecha.getFullYear()}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    const pedido = await Pedidos.create({
      ...pedidoData,
      Codigo_Pedido: codigoPedido
    });

    if (detalles && detalles.length > 0) {
      const [results] = await sequelize.query('SELECT MAX(ID_Detalle) as maxId FROM DETALLES_PEDIDO');
      let nextId = results[0].maxId ? parseInt(results[0].maxId) + 1 : 1;

      const detallesConId = detalles.map(detalle => ({
        ID_Detalle: nextId++,
        ID_Pedido: pedido.ID_Pedido,
        ID_Producto: detalle.ID_Producto,
        Cantidad: detalle.Cantidad,
        Precio_Unitario: detalle.Precio_Unitario,
        Descuento: detalle.Descuento || 0,
        Impuesto: detalle.Impuesto || 0,
        Subtotal: detalle.Subtotal,
        Estado: detalle.Estado || 'Pendiente'
      }));

      for (const detalle of detallesConId) {
        try {
          await DetallesPedido.create(detalle, { validate: false });
        } catch (error) {
          console.error(`Error al crear detalle: ${error.message}`);
        }
      }
    }

    await sequelize.query('SET FOREIGN_KEY_CHECKS=1;');
    res.status(201).json(pedido);
  } catch (error) {
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS=1;');
    } catch (innerError) {
      console.error('Error al reactivar verificación FK:', innerError);
    }
    res.status(400).json({ error: error.message });
  }
};

// Actualizar campos permitidos de un pedido
const updatePedido = async (req, res) => {
  try {
    const pedido = await Pedidos.findByPk(req.params.id);

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const camposActualizables = [
      'Estado',
      'Metodo_Entrega',
      'Direccion_Entrega',
      'Ciudad_Entrega',
      'Region_Entrega',
      'Comentarios',
      'Fecha_Estimada_Entrega',
      'Prioridad'
    ];

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

// Cambiar el estado del pedido y actualizar inventario si aplica
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

    if (estado === 'Aprobado' && pedido.Estado !== 'Aprobado') {
      if (pedido.DetallesPedido && pedido.DetallesPedido.length > 0) {
        for (const detalle of pedido.DetallesPedido) {
          try {
            await inventarioService.actualizarInventario(
              detalle.ID_Producto,
              detalle.Cantidad,
              pedido.ID_Sucursal,
              'Salida'
            );
          } catch (error) {
            console.error(`Error al actualizar inventario para producto ${detalle.ID_Producto}:`, error);
          }
        }
      }
    }

    if ((estado === 'Cancelado' || estado === 'Devuelto') && pedido.Estado === 'Aprobado') {
      if (pedido.DetallesPedido && pedido.DetallesPedido.length > 0) {
        for (const detalle of pedido.DetallesPedido) {
          try {
            await inventarioService.actualizarInventario(
              detalle.ID_Producto,
              detalle.Cantidad,
              pedido.ID_Sucursal,
              'Entrada'
            );
          } catch (error) {
            console.error(`Error al reponer inventario para producto ${detalle.ID_Producto}:`, error);
          }
        }
      }
    }

    await pedido.update({ Estado: estado });

    res.status(200).json({ message: `Estado del pedido actualizado a ${estado}`, pedido });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Exportar funciones del controlador
module.exports = {
  getAllPedidos,
  getPedidoById,
  createPedido,
  updatePedido,
  cambiarEstadoPedido
};
