const { Divisas } = require('../models');

// Obtener todas las divisas
const getAllDivisas = async (req, res) => {
  try {
    const divisas = await Divisas.findAll();
    res.status(200).json(divisas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener una divisa por ID
const getDivisaById = async (req, res) => {
  try {
    const divisa = await Divisas.findByPk(req.params.id);
    
    if (!divisa) {
      return res.status(404).json({ message: 'Divisa no encontrada' });
    }
    
    res.status(200).json(divisa);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear una nueva divisa
const createDivisa = async (req, res) => {
  try {
    const divisa = await Divisas.create(req.body);
    res.status(201).json(divisa);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Actualizar una divisa
const updateDivisa = async (req, res) => {
  try {
    const divisa = await Divisas.findByPk(req.params.id);
    
    if (!divisa) {
      return res.status(404).json({ message: 'Divisa no encontrada' });
    }
    
    await divisa.update(req.body);
    
    res.status(200).json(divisa);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Establecer divisa predeterminada
const setDefaultDivisa = async (req, res) => {
  try {
    // Resetear todas las divisas
    await Divisas.update(
      { Es_Default: 0 },
      { where: {} }
    );
    
    // Establecer la divisa seleccionada como predeterminada
    const divisa = await Divisas.findByPk(req.params.id);
    
    if (!divisa) {
      return res.status(404).json({ message: 'Divisa no encontrada' });
    }
    
    await divisa.update({ Es_Default: 1 });
    
    res.status(200).json({ message: `${divisa.Nombre} ha sido establecida como divisa predeterminada` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getAllDivisas,
  getDivisaById,
  createDivisa,
  updateDivisa,
  setDefaultDivisa
};