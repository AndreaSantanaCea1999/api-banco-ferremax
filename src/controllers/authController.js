const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y password son requeridos'
      });
    }

    // Usar el método correcto del modelo User
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
        id: result.user.ID_Usuario || result.user.id, 
        email: result.user.email, 
        rol: result.user.Rol || result.user.role
      },
      process.env.JWT_SECRET || 'ferremas_secret_key',
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login exitoso',
      token,
      usuario: {
      
    ID_Usuario: result.user.id,  // Mapear id a ID_Usuario para el frontend
    Nombre: result.user.nombre,
    email: result.user.email,
    Rol: result.user.Rol || result.user.role, // Usar el campo Rol varchar
    Telefono: result.user.telefono
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

module.exports = {
  login,
  registrarCliente
};