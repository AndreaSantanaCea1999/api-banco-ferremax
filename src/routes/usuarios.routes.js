// full/path/to/your/project/routes/usuarios.routes.js
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller'); // Verifica la ruta a tu controlador
const { validarCrearUsuario, validarActualizarUsuario } = require('../middlewares/validators/usuario.validator'); // Verifica la ruta a tus validadores

// GET /api/usuarios - Obtener todos los usuarios
router.get('/', usuarioController.obtenerUsuarios);

// POST /api/usuarios - Crear un nuevo usuario
router.post('/', validarCrearUsuario, usuarioController.crearUsuario);

// GET /api/usuarios/:id - Obtener un usuario por ID
router.get('/:id', usuarioController.obtenerUsuarioPorId);

// PATCH /api/usuarios/:id - Actualizar un usuario por ID
router.patch('/:id', validarActualizarUsuario, usuarioController.actualizarUsuario);

// DELETE /api/usuarios/:id - Eliminar un usuario por ID (lógica o física)
router.delete('/:id', usuarioController.eliminarUsuario);

module.exports = router;
