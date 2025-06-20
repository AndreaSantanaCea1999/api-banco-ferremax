// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

// Documentación de la API de autenticación
router.get('/', (req, res) => {
  res.json({
    message: 'API de Autenticación - FERREMAS',
    version: '1.0.0',
    status: 'Activo',
    endpoints: {
      login: 'POST /login - Iniciar sesión',
      register: 'POST /register - Registrar cliente',
      perfil: 'GET /perfil - Obtener perfil del usuario actual'
    },
    roles_disponibles: ['cliente', 'administrador', 'vendedor', 'bodeguero', 'contador'],
    ejemplo_login: {
      url: 'POST /login',
      body: {
        email: 'usuario@ejemplo.com',
        password: 'contraseña123'
      }
    }
  });
});

// Rutas públicas
router.post('/login', authController.login);
router.post('/register', authController.registrarCliente);

// Ruta protegida para obtener perfil del usuario actual
router.get('/perfil', verificarToken, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.usuario.ID_Usuario,
      nombre: req.usuario.nombre,
      email: req.usuario.email,
      rol: req.usuario.rol,
      primer_login: req.usuario.primer_login,
      fecha_ultimo_login: req.usuario.fecha_ultimo_login
    }
  });
});

module.exports = router;