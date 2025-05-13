const sucursalService = require('../services/sucursal.service');

const obtenerSucursales = async (req, res) => {
    try {
        const sucursales = await sucursalService.getAllSucursales(req.query);
        res.status(200).json(sucursales);
    } catch (error) {
        console.error('Error en obtenerSucursales controller:', error);
        res.status(500).json({ error: 'Error al obtener sucursales', detalle: error.message });
    }
};

const crearSucursal = async (req, res) => {
    try {
        const datosSucursal = req.body;
        const nuevaSucursal = await sucursalService.createSucursal(datosSucursal);
        res.status(201).json(nuevaSucursal);
    } catch (error) {
        console.error('Error en crearSucursal controller:', error);
        if (error.message.toLowerCase().includes('nombre de sucursal ya existe')) {
            return res.status(409).json({ error: 'Error al crear sucursal', detalle: 'El nombre de la sucursal ya está registrado.' });
        }
        res.status(500).json({ error: 'Error al crear sucursal', detalle: error.message });
    }
};

const obtenerSucursalPorId = async (req, res) => {
    try {
        const { id } = req.params;
        if (isNaN(parseInt(id))) {
            return res.status(400).json({ error: 'El ID de la sucursal debe ser un número.' });
        }
        const sucursal = await sucursalService.getSucursalById(parseInt(id));
        if (!sucursal) {
            return res.status(404).json({ error: 'Sucursal no encontrada' });
        }
        res.status(200).json(sucursal);
    } catch (error) {
        console.error('Error en obtenerSucursalPorId controller:', error);
        res.status(500).json({ error: 'Error al obtener sucursal', detalle: error.message });
    }
};

const actualizarSucursal = async (req, res) => {
    try {
        const { id } = req.params;
        if (isNaN(parseInt(id))) {
            return res.status(400).json({ error: 'El ID de la sucursal debe ser un número.' });
        }
        const datosActualizar = req.body;
        const sucursalActualizada = await sucursalService.updateSucursal(parseInt(id), datosActualizar);
        if (!sucursalActualizada) {
            return res.status(404).json({ error: 'Sucursal no encontrada para actualizar' });
        }
        res.status(200).json(sucursalActualizada);
    } catch (error) {
        console.error('Error en actualizarSucursal controller:', error);
        if (error.message.toLowerCase().includes('nombre de sucursal ya existe')) {
            return res.status(409).json({ error: 'Error al actualizar sucursal', detalle: 'El nombre de la sucursal ya está en uso.' });
        }
        res.status(500).json({ error: 'Error al actualizar sucursal', detalle: error.message });
    }
};

const eliminarSucursal = async (req, res) => {
    try {
        const { id } = req.params;
        if (isNaN(parseInt(id))) {
            return res.status(400).json({ error: 'El ID de la sucursal debe ser un número.' });
        }
        const resultado = await sucursalService.deleteSucursal(parseInt(id));
        if (!resultado) {
            return res.status(404).json({ error: 'Sucursal no encontrada para eliminar' });
        }
        res.status(200).json({ mensaje: `Sucursal con ID ${id} eliminada correctamente` });
    } catch (error) {
        console.error('Error en eliminarSucursal controller:', error);
        res.status(500).json({ error: 'Error al eliminar sucursal', detalle: error.message });
    }
};

module.exports = {
    obtenerSucursales,
    crearSucursal,
    obtenerSucursalPorId,
    actualizarSucursal,
    eliminarSucursal
};