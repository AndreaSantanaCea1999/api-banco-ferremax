// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verificarRol } = require('../middlewares/auth');

// Documentación de la API Administrativa
router.get('/', (req, res) => {
  res.json({
    message: 'API Administrativa FERREMAS',
    version: '1.0.0',
    description: 'Panel administrativo y reportes según documento FERREMAS',
    funcionalidades: {
      dashboard: 'GET /dashboard - Panel principal con métricas',
      informes: {
        ventas_mensual: 'GET /informes/ventas-mensual?año=2024&mes=6',
        desempeno_tienda: 'GET /informes/desempeno-tienda?sucursal_id=1'
      },
      usuarios: {
        listar: 'GET /usuarios?rol=vendedor',
        crear: 'POST /usuarios - Crear vendedor/bodeguero/contador',
        activar_desactivar: 'PATCH /usuarios/:id/estado'
      },
      estadisticas: 'GET /estadisticas?periodo=30'
    },
    roles_permitidos: ['administrador'],
    nota: 'Todas las rutas requieren autenticación y rol de administrador'
  });
});

// ===========================================
// RUTAS ADMINISTRATIVAS (Solo administradores)
// ===========================================

// 📊 DASHBOARD PRINCIPAL
router.get('/dashboard',
  verificarRol(['administrador']),
  adminController.dashboard
);

// 📈 INFORMES Y REPORTES
router.get('/informes/ventas-mensual',
  verificarRol(['administrador']),
  adminController.informeVentasMensual
);

router.get('/informes/desempeno-tienda',
  verificarRol(['administrador']),
  adminController.informeDesempenoTienda
);

// 👥 GESTIÓN DE USUARIOS
router.get('/usuarios',
  verificarRol(['administrador']),
  adminController.listarUsuarios
);

router.post('/usuarios',
  verificarRol(['administrador']),
  adminController.crearUsuario
);

router.patch('/usuarios/:userId/estado',
  verificarRol(['administrador']),
  adminController.toggleEstadoUsuario
);

// 📊 ESTADÍSTICAS GENERALES
router.get('/estadisticas',
  verificarRol(['administrador']),
  adminController.estadisticasGenerales
);

// ===========================================
// RUTAS ADICIONALES PARA DESARROLLO DE ESTRATEGIAS
// ===========================================

// 🎯 ESTRATEGIAS DE VENTAS (placeholder)
router.get('/estrategias',
  verificarRol(['administrador']),
  (req, res) => {
    res.json({
      success: true,
      message: 'Módulo de estrategias de ventas en desarrollo',
      funcionalidades_planeadas: [
        'Análisis de productos más vendidos',
        'Identificación de clientes frecuentes',
        'Recomendaciones de promociones',
        'Análisis de tendencias por temporada'
      ]
    });
  }
);

// 🔍 AUDITORÍA DE SISTEMA (placeholder)
router.get('/auditoria',
  verificarRol(['administrador']),
  (req, res) => {
    res.json({
      success: true,
      message: 'Módulo de auditoría en desarrollo',
      funcionalidades_planeadas: [
        'Log de acciones de usuarios',
        'Historial de cambios en pedidos',
        'Registro de transacciones',
        'Alertas de seguridad'
      ]
    });
  }
);

module.exports = router;