// src/routes/ventasRoutes.js
const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventasController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

// Documentación de la API de Ventas
router.get('/', (req, res) => {
  res.json({
    message: 'API de Ventas FERREMAS',
    version: '1.0.0',
    description: 'Gestión completa del proceso de ventas',
    flujo_venta: {
      '1': 'POST /crear - Crear venta completa',
      '2': 'GET /:pedido_id/estado - Consultar estado',
      '3': 'POST /:pedido_id/confirmar - Confirmar venta (después del pago)',
      '4': 'GET /:pedido_id/factura - Generar factura'
    },
    integraciones: {
      inventario: 'Verificación y actualización de stock automática',
      webpay: 'Procesamiento de pagos con tarjetas',
      banco_central: 'Conversión de divisas en tiempo real'
    },
    ejemplo_venta: {
      url: 'POST /crear',
      body: {
        cliente_id: 1,
        sucursal_id: 1,
        productos: [
          {
            id_producto: 101,
            cantidad: 2,
            precio_unitario: 15000
          }
        ],
        metodo_entrega: 'Despacho_Domicilio',
        direccion_entrega: 'Av. Providencia 1234, Santiago',
        metodo_pago: 'Crédito',
        divisa_cliente: 'USD',
        comentarios: 'Entrega urgente'
      }
    }
  });
});

// ===========================================
// RUTAS PROTEGIDAS - REQUIEREN AUTENTICACIÓN
// ===========================================

// 🛒 CREAR VENTA COMPLETA
router.post('/crear', 
  verificarToken,
  verificarRol(['cliente', 'vendedor', 'administrador']),
  ventasController.crearVentaCompleta
);

// 📊 OBTENER ESTADO DE VENTA
router.get('/:pedido_id/estado',
  verificarToken,
  ventasController.obtenerEstadoVenta
);

// ✅ CONFIRMAR VENTA (después del pago exitoso)
router.post('/:pedido_id/confirmar',
  verificarToken,
  verificarRol(['vendedor', 'administrador', 'contador']),
  ventasController.confirmarVenta
);

// 📄 GENERAR FACTURA
router.get('/:pedido_id/factura',
  verificarToken,
  async (req, res) => {
    // TODO: Implementar generación de factura PDF
    res.status(501).json({
      success: false,
      message: 'Generación de factura en desarrollo',
      pedido_id: req.params.pedido_id
    });
  }
);

// ===========================================
// RUTAS ADMINISTRATIVAS
// ===========================================

// 📈 REPORTES DE VENTAS (Solo administradores)
router.get('/reportes/diario',
  verificarToken,
  verificarRol(['administrador', 'contador']),
  async (req, res) => {
    try {
      const { fecha = new Date().toISOString().split('T')[0] } = req.query;
      
      // TODO: Implementar reporte diario
      res.json({
        success: true,
        message: 'Reporte diario en desarrollo',
        fecha,
        datos: {
          total_ventas: 0,
          cantidad_pedidos: 0,
          metodos_pago: {},
          productos_mas_vendidos: []
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al generar reporte'
      });
    }
  }
);

// 🔄 CAMBIAR ESTADO DE PEDIDO (Solo vendedores y administradores)
router.patch('/:pedido_id/estado',
  verificarToken,
  verificarRol(['vendedor', 'administrador', 'bodeguero']),
  async (req, res) => {
    try {
      const { estado } = req.body;
      const { pedido_id } = req.params;
      
      const estadosValidos = [
        'Pendiente', 'Aprobado', 'En_Preparacion', 
        'Listo_Para_Entrega', 'En_Ruta', 'Entregado', 
        'Cancelado', 'Devuelto'
      ];
      
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({
          success: false,
          message: 'Estado no válido',
          estados_validos: estadosValidos
        });
      }
      
      // TODO: Implementar cambio de estado con validaciones
      res.json({
        success: true,
        message: `Estado cambiado a ${estado}`,
        pedido_id,
        nuevo_estado: estado
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado del pedido'
      });
    }
  }
);

// 🔍 BUSCAR VENTAS
router.get('/buscar',
  verificarToken,
  verificarRol(['vendedor', 'administrador', 'contador']),
  async (req, res) => {
    try {
      const { 
        fecha_inicio,
        fecha_fin,
        cliente_id,
        estado,
        metodo_pago,
        sucursal_id,
        page = 1,
        limit = 10
      } = req.query;
      
      // TODO: Implementar búsqueda con filtros
      res.json({
        success: true,
        message: 'Búsqueda de ventas en desarrollo',
        filtros: req.query,
        resultados: [],
        paginacion: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          total_pages: 0
        }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error en búsqueda de ventas'
      });
    }
  }
);

module.exports = router;