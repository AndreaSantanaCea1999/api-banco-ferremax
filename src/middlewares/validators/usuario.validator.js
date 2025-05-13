// c:\Users\andre\Desktop\api-banco-ferremax\src\middlewares\validators\usuario.validator.js

const validarCrearUsuario = (req, res, next) => {
    console.log('[UsuarioValidator] Pasando por validarCrearUsuario (placeholder)');
    next(); 
};

const validarActualizarUsuario = (req, res, next) => {
    // Aquí irían las validaciones para actualizar un usuario.
    console.log('[UsuarioValidator] Pasando por validarActualizarUsuario (placeholder)');
    next();
};

module.exports = {
    validarCrearUsuario,
    validarActualizarUsuario
};