// full/path/to/your/project/controllers/usuario.controller.js
const usuarioService = require('../services/usuario.service'); // Verifica la ruta
const bcrypt = require('bcryptjs');

const obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await usuarioService.getAllUsuarios(req.query);
        res.status(200).json(usuarios);
    } catch (error) {
        console.error('Error en obtenerUsuarios controller:', error);
        res.status(500).json({ error: 'Error al obtener usuarios', detalle: error.message });
    }
};

const crearUsuario = async (req, res) => {
    try {
        const datosUsuario = req.body;
        if (datosUsuario.password) {
            const salt = await bcrypt.genSalt(10);
            datosUsuario.password_hash = await bcrypt.hash(datosUsuario.password, salt);
            delete datosUsuario.password;
        }

        const nuevoUsuario = await usuarioService.createUsuario(datosUsuario);
        const { password_hash, ...usuarioCreado } = nuevoUsuario; // Evita devolver el hash
        res.status(201).json(usuarioCreado);
    } catch (error) {
        console.error('Error en crearUsuario controller:', error);
        if (error.message.includes('unique constraint') || error.message.toLowerCase().includes('email already exists') || error.message.toLowerCase().includes('rut ya está registrado')) {
            return res.status(409).json({ error: 'Error al crear usuario', detalle: 'El email o RUT ya está registrado.' });
        }
        res.status(500).json({ error: 'Error al crear usuario', detalle: error.message });
    }
};

const obtenerUsuarioPorId = async (req, res) => {
    try {
        const { id } = req.params;
        if (isNaN(parseInt(id))) {
            return res.status(400).json({ error: 'El ID del usuario debe ser un número.' });
        }
        const usuario = await usuarioService.getUsuarioById(parseInt(id));
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const { password_hash, ...usuarioEncontrado } = usuario;
        res.status(200).json(usuarioEncontrado);
    } catch (error) {
        console.error('Error en obtenerUsuarioPorId controller:', error);
        res.status(500).json({ error: 'Error al obtener usuario', detalle: error.message });
    }
};

const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        if (isNaN(parseInt(id))) {
            return res.status(400).json({ error: 'El ID del usuario debe ser un número.' });
        }
        const datosActualizar = req.body;

        const usuarioActualizado = await usuarioService.updateUsuario(parseInt(id), datosActualizar);
        if (!usuarioActualizado) {
            return res.status(404).json({ error: 'Usuario no encontrado para actualizar' });
        }
        const { password_hash, ...usuarioModificado } = usuarioActualizado;
        res.status(200).json(usuarioModificado);
    } catch (error) {
        console.error('Error en actualizarUsuario controller:', error);
         if (error.message.includes('unique constraint') || error.message.toLowerCase().includes('email already exists') || error.message.toLowerCase().includes('rut ya está en uso')) {
            return res.status(409).json({ error: 'Error al actualizar usuario', detalle: 'El email o RUT ya está en uso por otro usuario.' });
        }
        res.status(500).json({ error: 'Error al actualizar usuario', detalle: error.message });
    }
};

const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        if (isNaN(parseInt(id))) {
            return res.status(400).json({ error: 'El ID del usuario debe ser un número.' });
        }
        const resultado = await usuarioService.deleteUsuario(parseInt(id));
        if (!resultado) {
            return res.status(404).json({ error: 'Usuario no encontrado para eliminar' });
        }
        res.status(200).json({ mensaje: `Usuario con ID ${id} eliminado correctamente` });
    } catch (error) {
        console.error('Error en eliminarUsuario controller:', error);
        res.status(500).json({ error: 'Error al eliminar usuario', detalle: error.message });
    }
};

module.exports = {
    obtenerUsuarios,
    crearUsuario,
    obtenerUsuarioPorId,
    actualizarUsuario,
    eliminarUsuario
};
