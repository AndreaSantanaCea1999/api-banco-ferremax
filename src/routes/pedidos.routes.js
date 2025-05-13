// c:\Users\andre\api-banco-ferremax\src\routes\pedidos.routes.js

const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidos.controller');
// Placeholder para middleware potencial que podrías añadir más adelante:
// const { isAuthenticated, authorizeRoles } = require('../middleware/auth.middleware'); // Ejemplo de middleware de autenticación/autorización
// const { validatePedidoCreation, validatePedidoUpdate } = require('../middleware/validation.middleware'); // Ejemplo de middleware de validación

// --- Operaciones CRUD para Pedidos ---
// Las rutas que modifican datos (POST, PATCH, DELETE) o acceden a listados completos (GET '/')
// usualmente se protegen con middleware de autenticación y autorización.
// Las rutas que crean o actualizan datos (POST, PATCH) también se benefician de middleware de validación de entrada.

// Crear un nuevo pedido
// Ejemplo con middleware potencial: router.post('/', isAuthenticated, validatePedidoCreation, pedidosController.crearPedido);
router.post('/', pedidosController.crearPedido);

// Obtener todos los pedidos
// Considera añadir autenticación y roles, ej: router.get('/', isAuthenticated, authorizeRoles(['admin', 'vendedor']), pedidosController.obtenerPedidos);
router.get('/', pedidosController.obtenerPedidos);

// Obtener un pedido específico por ID
// Considera añadir autenticación, ej: router.get('/:id', isAuthenticated, pedidosController.obtenerPedidoPorId);
router.get('/:id', pedidosController.obtenerPedidoPorId);

// Actualizar un pedido específico por ID
// Ejemplo con middleware potencial: router.patch('/:id', isAuthenticated, validatePedidoUpdate, pedidosController.actualizarPedido);
router.patch('/:id', pedidosController.actualizarPedido);

// Eliminar un pedido específico por ID (o cambiar estado a cancelado)
// Considera añadir autenticación y roles, ej: router.delete('/:id', isAuthenticated, authorizeRoles(['admin']), pedidosController.eliminarPedido);
router.delete('/:id', pedidosController.eliminarPedido);

// --- Ruta para el callback de Webpay ---
// Esta ruta es típicamente pública, ya que es invocada por un servicio externo (Webpay).
// La seguridad se maneja dentro del controlador 'confirmacionWebpay' al validar el token y los datos recibidos de Webpay.
router.post('/webpay/confirmacion', pedidosController.confirmacionWebpay); // Webpay usualmente usa POST para el resultado
router.get('/webpay/confirmacion', pedidosController.confirmacionWebpay); // Tenerlo por si acaso para el flujo de cancelación

module.exports = router;
