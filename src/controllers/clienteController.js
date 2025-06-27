// src/controllers/clienteController.js
// Funcionalidades específicas para clientes según documento FERREMAS

const { Pedidos, DetallesPedido, Pagos, Usuario } = require('../models');

// 🛍️ OBTENER PERFIL DEL CLIENTE
const obtenerPerfil = async (req, res) => {
  try {
    const cliente = await Usuario.findByPk(req.usuario.ID_Usuario, {
      attributes: ['ID_Usuario', 'nombre', 'email', 'telefono', 'direccion', 'fecha_ultimo_login']
    });

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      cliente
    });

  } catch (error) {
    console.error('Error obteniendo perfil cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil'
    });
  }
};

// 📝 ACTUALIZAR PERFIL DEL CLIENTE
const actualizarPerfil = async (req, res) => {
  try {
    const { nombre, telefono, direccion } = req.body;
    const clienteId = req.usuario.ID_Usuario;

    const cliente = await Usuario.findByPk(clienteId);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    await cliente.update({
      nombre: nombre || cliente.nombre,
      telefono: telefono || cliente.telefono,
      direccion: direccion || cliente.direccion
    });

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      cliente: {
        id: cliente.ID_Usuario,
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono,
        direccion: cliente.direccion
      }
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil'
    });
  }
};

// 📦 OBTENER MIS PEDIDOS
const misPedidos = async (req, res) => {
  try {
    const clienteId = req.usuario.ID_Usuario;
    const { estado, page = 1, limit = 10 } = req.query;

    const where = { ID_Cliente: clienteId };
    if (estado) {
      where.Estado = estado;
    }

    const offset = (page - 1) * limit;

    const pedidos = await Pedidos.findAndCountAll({
      where,
      include: [
        {
          model: DetallesPedido,
          attributes: ['ID_Producto', 'Cantidad', 'Precio_Unitario', 'Subtotal', 'Estado']
        },
        {
          model: Pagos,
          attributes: ['Metodo_Pago', 'Estado', 'Monto', 'Fecha_Pago']
        }
      ],
      order: [['Fecha_Pedido', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      pedidos: pedidos.rows,
      paginacion: {
        total: pedidos.count,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(pedidos.count / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo pedidos del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos'
    });
  }
};

// 🔍 OBTENER DETALLE DE UN PEDIDO ESPECÍFICO
const detallePedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const clienteId = req.usuario.ID_Usuario;

    const pedido = await Pedidos.findOne({
      where: { 
        ID_Pedido: pedidoId,
        ID_Cliente: clienteId // Solo puede ver sus propios pedidos
      },
      include: [
        {
          model: DetallesPedido,
          attributes: ['ID_Producto', 'Cantidad', 'Precio_Unitario', 'Descuento', 'Subtotal', 'Estado']
        },
        {
          model: Pagos,
          attributes: ['Metodo_Pago', 'Estado', 'Monto', 'Fecha_Pago', 'Numero_Transaccion']
        }
      ]
    });

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    res.json({
      success: true,
      pedido
    });

  } catch (error) {
    console.error('Error obteniendo detalle del pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalle del pedido'
    });
  }
};

// 💳 OBTENER MIS PAGOS
const misPagos = async (req, res) => {
  try {
    const clienteId = req.usuario.ID_Usuario;
    const { estado, metodo_pago } = req.query;

    // Buscar pagos de pedidos del cliente
    const pagos = await Pagos.findAll({
      include: [
        {
          model: Pedidos,
          where: { ID_Cliente: clienteId },
          attributes: ['Codigo_Pedido', 'Fecha_Pedido', 'Total']
        }
      ],
      where: {
        ...(estado && { Estado: estado }),
        ...(metodo_pago && { Metodo_Pago: metodo_pago })
      },
      order: [['Fecha_Pago', 'DESC']]
    });

    res.json({
      success: true,
      pagos
    });

  } catch (error) {
    console.error('Error obteniendo pagos del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pagos'
    });
  }
};

// ❌ CANCELAR PEDIDO (solo si está pendiente)
const cancelarPedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const clienteId = req.usuario.ID_Usuario;

    const pedido = await Pedidos.findOne({
      where: { 
        ID_Pedido: pedidoId,
        ID_Cliente: clienteId,
        Estado: 'Pendiente' // Solo se pueden cancelar pedidos pendientes
      }
    });

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado o no se puede cancelar'
      });
    }

    await pedido.update({ Estado: 'Cancelado' });

    res.json({
      success: true,
      message: 'Pedido cancelado exitosamente',
      pedido_id: pedidoId
    });

  } catch (error) {
    console.error('Error cancelando pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar pedido'
    });
  }
};

// 📊 RESUMEN DEL CLIENTE
const resumenCliente = async (req, res) => {
  try {
    const clienteId = req.usuario.ID_Usuario;

    // Contar pedidos por estado
    const estadisticas = await Pedidos.findAll({
      where: { ID_Cliente: clienteId },
      attributes: [
        'Estado',
        [require('sequelize').fn('COUNT', require('sequelize').col('Estado')), 'cantidad'],
        [require('sequelize').fn('SUM', require('sequelize').col('Total')), 'total_gastado']
      ],
      group: ['Estado'],
      raw: true
    });

    // Total de pedidos
    const totalPedidos = await Pedidos.count({
      where: { ID_Cliente: clienteId }
    });

    // Último pedido
    const ultimoPedido = await Pedidos.findOne({
      where: { ID_Cliente: clienteId },
      order: [['Fecha_Pedido', 'DESC']],
      attributes: ['ID_Pedido', 'Codigo_Pedido', 'Estado', 'Total', 'Fecha_Pedido']
    });

    res.json({
      success: true,
      resumen: {
        total_pedidos: totalPedidos,
        estadisticas_por_estado: estadisticas,
        ultimo_pedido: ultimoPedido
      }
    });

  } catch (error) {
    console.error('Error obteniendo resumen del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen'
    });
  }
};

module.exports = {
  obtenerPerfil,
  actualizarPerfil,
  misPedidos,
  detallePedido,
  misPagos,
  cancelarPedido,
  resumenCliente
};