// src/controllers/adminController.js
// Funcionalidades administrativas según documento FERREMAS

const { Pedidos, DetallesPedido, Pagos, Usuario, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

// 📊 DASHBOARD ADMINISTRATIVO
const dashboard = async (req, res) => {
  try {
    console.log('📊 [dashboard] Generando dashboard administrativo...');

    // Métricas generales
    const fechaHoy = new Date();
    const fechaInicioMes = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth(), 1);

    // Ventas del día
    const ventasHoy = await Pedidos.findAll({
      where: {
        Fecha_Pedido: {
          [require('sequelize').Op.gte]: new Date(fechaHoy.setHours(0, 0, 0, 0))
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('ID_Pedido')), 'cantidad'],
        [sequelize.fn('SUM', sequelize.col('Total')), 'total']
      ],
      raw: true
    });

    // Ventas del mes
    const ventasMes = await Pedidos.findAll({
      where: {
        Fecha_Pedido: {
          [require('sequelize').Op.gte]: fechaInicioMes
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('ID_Pedido')), 'cantidad'],
        [sequelize.fn('SUM', sequelize.col('Total')), 'total']
      ],
      raw: true
    });

    // Pedidos por estado
    const pedidosPorEstado = await Pedidos.findAll({
      attributes: [
        'Estado',
        [sequelize.fn('COUNT', sequelize.col('Estado')), 'cantidad']
      ],
      group: ['Estado'],
      raw: true
    });

    // Usuarios registrados
    const totalUsuarios = await Usuario.count();

    res.json({
      success: true,
      dashboard: {
        ventas_hoy: {
          cantidad: parseInt(ventasHoy[0]?.cantidad || 0),
          total: parseFloat(ventasHoy[0]?.total || 0)
        },
        ventas_mes: {
          cantidad: parseInt(ventasMes[0]?.cantidad || 0),
          total: parseFloat(ventasMes[0]?.total || 0)
        },
        pedidos_por_estado: pedidosPorEstado,
        total_usuarios: totalUsuarios,
        fecha_consulta: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error generando dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar dashboard'
    });
  }
};

// 📈 INFORME DE VENTAS MENSUAL
const informeVentasMensual = async (req, res) => {
  try {
    const { año, mes } = req.query;
    
    const fechaConsulta = new Date(año || new Date().getFullYear(), (mes - 1) || new Date().getMonth(), 1);
    const fechaSiguiente = new Date(fechaConsulta.getFullYear(), fechaConsulta.getMonth() + 1, 1);

    console.log(`📈 [informeVentasMensual] Generando informe ${fechaConsulta.getMonth() + 1}/${fechaConsulta.getFullYear()}`);

    const ventasMensuales = await Pedidos.findAll({
      where: {
        Fecha_Pedido: {
          [require('sequelize').Op.gte]: fechaConsulta,
          [require('sequelize').Op.lt]: fechaSiguiente
        },
        Estado: ['Aprobado', 'En_Preparacion', 'Listo_Para_Entrega', 'En_Ruta', 'Entregado']
      },
      include: [
        {
          model: DetallesPedido,
          attributes: ['Cantidad', 'Precio_Unitario', 'Subtotal']
        },
        {
          model: Pagos,
          attributes: ['Metodo_Pago', 'Estado', 'Monto']
        }
      ],
      order: [['Fecha_Pedido', 'DESC']]
    });

    // Cálculos del informe
    const totalVentas = ventasMensuales.reduce((acc, pedido) => acc + parseFloat(pedido.Total), 0);
    const cantidadPedidos = ventasMensuales.length;
    const promedioVenta = cantidadPedidos > 0 ? totalVentas / cantidadPedidos : 0;

    // Métodos de pago más utilizados
    const metodosPago = {};
    ventasMensuales.forEach(pedido => {
      pedido.Pagos.forEach(pago => {
        metodosPago[pago.Metodo_Pago] = (metodosPago[pago.Metodo_Pago] || 0) + 1;
      });
    });

    res.json({
      success: true,
      informe: {
        periodo: `${fechaConsulta.getMonth() + 1}/${fechaConsulta.getFullYear()}`,
        total_ventas: totalVentas,
        cantidad_pedidos: cantidadPedidos,
        promedio_venta: promedioVenta,
        metodos_pago_populares: metodosPago,
        detalle_ventas: ventasMensuales
      }
    });

  } catch (error) {
    console.error('❌ Error generando informe de ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar informe de ventas'
    });
  }
};

// 🏪 INFORME DE DESEMPEÑO DE TIENDA
const informeDesempenoTienda = async (req, res) => {
  try {
    const { sucursal_id, fecha_inicio, fecha_fin } = req.query;

    console.log(`🏪 [informeDesempenoTienda] Sucursal ${sucursal_id} desde ${fecha_inicio} hasta ${fecha_fin}`);

    const whereConditions = {};
    
    if (sucursal_id) {
      whereConditions.ID_Sucursal = sucursal_id;
    }
    
    if (fecha_inicio && fecha_fin) {
      whereConditions.Fecha_Pedido = {
        [require('sequelize').Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    }

    const desempenoTienda = await Pedidos.findAll({
      where: whereConditions,
      attributes: [
        'ID_Sucursal',
        [sequelize.fn('COUNT', sequelize.col('ID_Pedido')), 'total_pedidos'],
        [sequelize.fn('SUM', sequelize.col('Total')), 'total_ventas'],
        [sequelize.fn('AVG', sequelize.col('Total')), 'promedio_venta']
      ],
      group: ['ID_Sucursal'],
      raw: true
    });

    res.json({
      success: true,
      informe_desempeno: {
        periodo: { fecha_inicio, fecha_fin },
        sucursal_id: sucursal_id || 'Todas',
        metricas: desempenoTienda
      }
    });

  } catch (error) {
    console.error('❌ Error generando informe de desempeño:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar informe de desempeño'
    });
  }
};

// 👥 GESTIÓN DE USUARIOS
const listarUsuarios = async (req, res) => {
  try {
    const { rol_filtro, estado, page = 1, limit = 20 } = req.query;
    
    const whereConditions = {};
    if (rol_filtro) whereConditions.rol = rol_filtro;
    if (estado) whereConditions.activo = estado === 'activo';

    const offset = (page - 1) * limit;

    const usuarios = await Usuario.findAndCountAll({
      where: whereConditions,
      attributes: ['ID_Usuario', 'nombre', 'email', 'rol', 'activo', 'fecha_ultimo_login'],
      order: [['nombre', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      usuarios: usuarios.rows,
      paginacion: {
        total: usuarios.count,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(usuarios.count / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error listando usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar usuarios'
    });
  }
};

// ➕ CREAR USUARIO (Vendedores, Bodegueros, Contadores)
const crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol_usuario, rut } = req.body;

    // Validaciones
    if (!nombre || !email || !password || !rol_usuario) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, email, password y rol son requeridos'
      });
    }

    // Verificar que el email no exista
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un usuario con este email'
      });
    }

    // Validar roles permitidos para creación por admin
    const rolesPermitidos = ['vendedor', 'bodeguero', 'contador'];
    if (!rolesPermitidos.includes(rol_usuario)) {
      return res.status(400).json({
        success: false,
        message: 'Rol no válido. Roles permitidos: vendedor, bodeguero, contador'
      });
    }

    // Crear usuario
    const nuevoUsuario = await Usuario.create({
      nombre,
      email,
      password,
      rol: rol_usuario,
      rut,
      primer_login: true, // Debe cambiar contraseña en primer login
      activo: true
    });

    console.log(`👤 [crearUsuario] Usuario ${rol_usuario} creado: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      usuario: {
        id: nuevoUsuario.ID_Usuario,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
        primer_login: nuevoUsuario.primer_login
      }
    });

  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario'
    });
  }
};

// 🔄 ACTIVAR/DESACTIVAR USUARIO
const toggleEstadoUsuario = async (req, res) => {
  try {
    const { userId } = req.params;
    const { activo } = req.body;

    const usuario = await Usuario.findByPk(userId);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await usuario.update({ activo });

    res.json({
      success: true,
      message: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`,
      usuario: {
        id: usuario.ID_Usuario,
        nombre: usuario.nombre,
        activo: usuario.activo
      }
    });

  } catch (error) {
    console.error('❌ Error cambiando estado de usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del usuario'
    });
  }
};

// 📊 ESTADÍSTICAS GENERALES
const estadisticasGenerales = async (req, res) => {
  try {
    const { periodo = '30' } = req.query; // días
    
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - parseInt(periodo));

    console.log(`📊 [estadisticasGenerales] Últimos ${periodo} días`);

    // Consultas en paralelo para mejor rendimiento
    const [
      totalPedidos,
      totalVentas,
      usuariosActivos,
      productosVendidos
    ] = await Promise.all([
      // Total de pedidos
      Pedidos.count({
        where: {
          Fecha_Pedido: { [require('sequelize').Op.gte]: fechaLimite }
        }
      }),
      
      // Total de ventas
      Pedidos.sum('Total', {
        where: {
          Fecha_Pedido: { [require('sequelize').Op.gte]: fechaLimite },
          Estado: ['Aprobado', 'En_Preparacion', 'Listo_Para_Entrega', 'En_Ruta', 'Entregado']
        }
      }),
      
      // Usuarios activos
      Usuario.count({
        where: { activo: true }
      }),
      
      // Total de productos vendidos
      DetallesPedido.sum('Cantidad', {
        include: [{
          model: Pedidos,
          where: {
            Fecha_Pedido: { [require('sequelize').Op.gte]: fechaLimite }
          }
        }]
      })
    ]);

    res.json({
      success: true,
      estadisticas: {
        periodo_dias: parseInt(periodo),
        total_pedidos: totalPedidos || 0,
        total_ventas: parseFloat(totalVentas || 0),
        usuarios_activos: usuariosActivos || 0,
        productos_vendidos: parseInt(productosVendidos || 0),
        promedio_venta: totalPedidos > 0 ? parseFloat(totalVentas || 0) / totalPedidos : 0
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

module.exports = {
  dashboard,
  informeVentasMensual,
  informeDesempenoTienda,
  listarUsuarios,
  crearUsuario,
  toggleEstadoUsuario,
  estadisticasGenerales
};