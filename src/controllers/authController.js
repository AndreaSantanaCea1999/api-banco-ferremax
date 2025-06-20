// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario'); // Importación directa

// POST /api/v1/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y password son requeridos'
      });
    }

    const usuario = await Usuario.findOne({ where: { email } });
    
    if (!usuario || !usuario.activo) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const passwordValido = await usuario.validarPassword(password);
    if (!passwordValido) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Actualizar último login
    usuario.fecha_ultimo_login = new Date();
    await usuario.save();

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: usuario.ID_Usuario, 
        email: usuario.email, 
        rol: usuario.rol 
      },
      process.env.JWT_SECRET || 'ferremas_secret_key',
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        usuario: {
          id: usuario.ID_Usuario,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          primer_login: usuario.primer_login
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error en login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en el login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// POST /api/v1/auth/register (solo para clientes)
async function registrarCliente(req, res) {
  try {
    const { nombre, email, password, telefono, direccion } = req.body;
    
    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, email y password son requeridos'
      });
    }

    // Verificar si el email ya existe
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    const nuevoUsuario = await Usuario.create({
      nombre,
      email,
      password,
      telefono,
      direccion,
      rol: 'cliente',
      primer_login: false
    });

    return res.status(201).json({
      success: true,
      message: 'Cliente registrado exitosamente',
      data: {
        id: nuevoUsuario.ID_Usuario,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
      }
    });
    
  } catch (error) {
    console.error('❌ Error registrando cliente:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar cliente',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = {
  login,
  registrarCliente
};