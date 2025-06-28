// routes/auth.js - Rutas de autenticación con Base de Datos MySQL
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/Usuario');
const router = express.Router();

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token de acceso requerido' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Token inválido o expirado' 
      });
    }
    req.user = user;
    next();
  });
};

// Middleware para verificar si es admin
const requireAdmin = async (req, res, next) => {
  try {
    const isAdmin = await User.isAdmin(req.user.id);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador.'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verificando permisos'
    });
  }
};

// POST /auth/login - Iniciar sesión
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar datos de entrada
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Verificar credenciales con la base de datos
    const result = await User.verifyCredentials(email, password);
    
    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.message
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: result.user.id, 
        email: result.user.email, 
        role: result.user.role 
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        nombre: result.user.nombre,
        apellido: result.user.apellido,
        telefono: result.user.telefono,
        role: result.user.role
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /auth/register - Registrar nuevo usuario
router.post('/register', async (req, res) => {
  try {
    const { email, password, nombre, apellido, telefono, role = 'cliente' } = req.body;

    // Validar datos
    if (!email || !password || !nombre) {
      return res.status(400).json({
        success: false,
        message: 'Email, contraseña y nombre son requeridos'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Crear usuario en la base de datos
    const result = await User.create({
      email,
      password,
      nombre,
      apellido,
      telefono,
      role
    });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: result.user
    });

  } catch (error) {
    console.error('Error en registro:', error);
    
    // Manejar errores específicos
    if (error.message === 'El email ya está registrado') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /auth/profile - Obtener perfil del usuario autenticado
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Remover campos sensibles
    const { password, ...userProfile } = user;

    res.json({
      success: true,
      user: userProfile
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /auth/profile - Actualizar perfil del usuario
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { nombre, apellido, telefono, direccion } = req.body;
    
    const updatedUser = await User.updateProfile(req.user.id, {
      nombre,
      apellido,
      telefono,
      direccion
    });

    // Remover campos sensibles
    const { password, ...userProfile } = updatedUser;

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: userProfile
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /auth/change-password - Cambiar contraseña
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva contraseña son requeridas'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    const result = await User.changePassword(req.user.id, currentPassword, newPassword);
    
    res.json(result);
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// POST /auth/logout - Cerrar sesión
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
});

// GET /auth/verify - Verificar token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const { password, ...userProfile } = user;

    res.json({
      success: true,
      message: 'Token válido',
      user: userProfile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verificando token'
    });
  }
});

// GET /auth/users - Listar todos los usuarios (solo admin)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role, activo, limit } = req.query;
    
    const filters = {};
    if (role) filters.role = role;
    if (activo !== undefined) filters.activo = activo === 'true';
    if (limit) filters.limit = limit;

    const users = await User.getAll(filters);
    
    res.json({
      success: true,
      users,
      total: users.length
    });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /auth/users/:id - Desactivar usuario (solo admin)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // No permitir que el admin se desactive a sí mismo
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes desactivar tu propia cuenta'
      });
    }

    const result = await User.deactivate(userId);
    res.json(result);
  } catch (error) {
    console.error('Error desactivando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;