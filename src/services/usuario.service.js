// full/path/to/your/project/services/usuario.service.js

// Simulación de base de datos en memoria
let usuariosDB = [
    { id: 1, nombre_completo: 'Admin Ferremas', email: 'admin@ferremas.cl', rol: 'administrador', activo: true, password_hash: 'simulado', fecha_creacion: new Date(), fecha_actualizacion: new Date() }
];
let nextId = 2;

const getAllUsuarios = async (queryParams) => {
    console.log('Servicio: Obtener todos los usuarios con params:', queryParams);
    // Aquí podrías filtrar `usuariosDB` basado en `queryParams` si es necesario
    return usuariosDB.filter(u => u.activo !== false); // No mostrar usuarios "eliminados lógicamente" por defecto
};

const createUsuario = async (datosUsuario) => {
    console.log('Servicio: Crear usuario:', datosUsuario);
    if (usuariosDB.some(u => u.email === datosUsuario.email)) {
        throw new Error('Email already exists');
    }
    if (datosUsuario.rut && usuariosDB.some(u => u.rut === datosUsuario.rut)) {
        throw new Error('RUT ya está registrado');
    }
    const nuevoUsuario = {
        id: nextId++,
        ...datosUsuario,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
    };
    usuariosDB.push(nuevoUsuario);
    return { ...nuevoUsuario }; // Devuelve una copia
};

const getUsuarioById = async (id) => {
    console.log('Servicio: Obtener usuario por ID:', id);
    const usuario = usuariosDB.find(u => u.id === id && u.activo !== false);
    return usuario ? { ...usuario } : null;
};

const updateUsuario = async (id, datosActualizar) => {
    console.log('Servicio: Actualizar usuario ID:', id, 'con datos:', datosActualizar);
    const usuarioIndex = usuariosDB.findIndex(u => u.id === id && u.activo !== false);
    if (usuarioIndex === -1) {
        return null;
    }
    // Verificar unicidad de email si se está cambiando
    if (datosActualizar.email && usuariosDB.some(u => u.email === datosActualizar.email && u.id !== id)) {
        throw new Error('Email already exists for another user');
    }
    // Verificar unicidad de RUT si se está cambiando
    if (datosActualizar.rut && usuariosDB.some(u => u.rut === datosActualizar.rut && u.id !== id)) {
        throw new Error('RUT ya está en uso por otro usuario');
    }

    usuariosDB[usuarioIndex] = {
        ...usuariosDB[usuarioIndex],
        ...datosActualizar,
        fecha_actualizacion: new Date()
    };
    return { ...usuariosDB[usuarioIndex] };
};

const deleteUsuario = async (id) => {
    console.log('Servicio: Eliminar (lógico) usuario ID:', id);
    const usuarioIndex = usuariosDB.findIndex(u => u.id === id);
    if (usuarioIndex === -1) {
        return false; // No encontrado
    }
    // Borrado lógico:
    // usuariosDB[usuarioIndex].activo = false;
    // usuariosDB[usuarioIndex].fecha_actualizacion = new Date();
    // return true;

    // Borrado físico (para la simulación puede ser más simple):
    usuariosDB = usuariosDB.filter(u => u.id !== id);
    return true;
};

module.exports = {
    getAllUsuarios,
    createUsuario,
    getUsuarioById,
    updateUsuario,
    deleteUsuario
};
