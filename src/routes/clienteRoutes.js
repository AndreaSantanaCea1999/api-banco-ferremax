// src/routes/clienteRoutes.js
const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const { verificarRol } = require('../middlewares/auth');

// Documentación de la API de Cliente
router.get('/', (req, res) => {
  res.json({
    message: 'API de Cliente FERREMAS',
    version: '1.0.0',
    description: 'Funcionalidades específicas para clientes',
    endpoints: {
      perfil: 'GET /perfil - Obtener mi perfil',
      actualizar_perfil: 'PUT /perfil - Actualizar mi perfil',
      mis_pedidos: 'GET /pedidos - Mis pedidos',
      detalle_pedido: 'GET /pedidos/:id - Detalle de un pedido',
      mis_pagos: 'GET /pagos - Mis pagos',
      cancelar_pedido: 'DELETE /pedidos/:id - Cancelar pedido',
      resumen: 'GET /resumen - Resumen de mi actividad'
    },
    nota: 'Todas las rutas requieren autenticación y rol de cliente'
  });
});

// ===========================================
// RUTAS DE CLIENTE (requieren rol cliente)
// ===========================================

// 🛍️ PERFIL DEL CLIENTE
router.get('/perfil', 
  verificarRol(['cliente']),
  clienteController.obtenerPerfil
);

router.put('/perfil',
  verificarRol(['cliente']),
  clienteController.actualizarPerfil
);

// 📦 PEDIDOS DEL CLIENTE
router.get('/pedidos',
  verificarRol(['cliente']),
  clienteController.misPedidos
);

router.get('/pedidos/:pedidoId',
  verificarRol(['cliente']),
  clienteController.detallePedido
);

router.delete('/pedidos/:pedidoId',
  verificarRol(['cliente']),
  clienteController.cancelarPedido
);

// 💳 PAGOS DEL CLIENTE
router.get('/pagos',
  verificarRol(['cliente']),
  clienteController.misPagos
);

// 📊 RESUMEN Y ESTADÍSTICAS
router.get('/resumen',
  verificarRol(['cliente']),
  clienteController.resumenCliente
);

module.exports = router;