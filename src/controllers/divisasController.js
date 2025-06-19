const { Divisas, sequelize } = require('../models'); // sequelize para transacciones
const { UniqueConstraintError, ValidationError, ForeignKeyConstraintError } = require('sequelize');

// Obtener todas las divisas
const getAllDivisas = async (req, res) => {
  try {
    const divisas = await Divisas.findAll();
    if (divisas.length === 0) {
      return res.status(200).json({ message: 'No se encontraron divisas.', data: [] });
    }
    res.status(200).json({ message: 'Divisas obtenidas con éxito.', data: divisas });
  } catch (error) {
    console.error('Error al obtener todas las divisas:', error);
    res.status(500).json({ message: 'Error al obtener las divisas.', error: error.message });
  }
};
// Obtener una divisa por ID
const getDivisaById = async (req, res) => {
  try {
    const divisa = await Divisas.findByPk(req.params.id);
    
    if (!divisa) {
      return res.status(404).json({ message: 'Divisa no encontrada' });
    }
    
    res.status(200).json({ message: 'Divisa obtenida con éxito.', data: divisa });
  } catch (error) {
    console.error(`Error al obtener la divisa ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al obtener la divisa.', error: error.message });
  }
};

// Crear una nueva divisa
const createDivisa = async (req, res) => {
  try {
    // Es buena práctica extraer solo los campos esperados del body
    const { Codigo, Nombre, Simbolo, Es_Default } = req.body;

    // Validación básica (aunque Sequelize también valida según el modelo)
    if (!Codigo || !Nombre || !Simbolo) {
      return res.status(400).json({
        message: 'Los campos Codigo, Nombre y Simbolo son obligatorios.',
      });
    }

    const nuevaDivisa = await Divisas.create({
      Codigo,
      Nombre,
      Simbolo,
      Es_Default: Es_Default !== undefined ? Es_Default : 0 // Asegurar valor para Es_Default
    });
    res.status(201).json({ // Cambiado a 201 Created
      message: 'El registro se ha realizado con éxito',
      data: nuevaDivisa // Devolver la divisa creada
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({ // 409 Conflict para códigos duplicados
        message: 'Error al crear la divisa: Ya existe una divisa con ese código.',
        error: error.errors.map(e => e.message)
      });
    }
    if (error instanceof ValidationError) {
      return res.status(400).json({ // 400 Bad Request para errores de validación
        message: 'Error de validación al crear la divisa.',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }
    console.error('Error al crear la divisa:', error); // Loguear el error completo para depuración
    res.status(500).json({
      message: 'Error inesperado al procesar la solicitud.',
      error: error.message
    });
  }
};

// Actualizar una divisa
const updateDivisa = async (req, res) => {
  try {
    const { id } = req.params;
    const { Codigo, Nombre, Simbolo, Es_Default } = req.body;

    const divisa = await Divisas.findByPk(id);
    
    if (!divisa) {
      return res.status(404).json({ message: 'Divisa no encontrada.' });
    }

    // Prepara los datos a actualizar, solo campos provistos
    const updateData = {};
    if (Codigo !== undefined) updateData.Codigo = Codigo;
    if (Nombre !== undefined) updateData.Nombre = Nombre;
    if (Simbolo !== undefined) updateData.Simbolo = Simbolo;
    // Es_Default se maneja mejor con setDefaultDivisa para garantizar unicidad del default.
    // Si se permite aquí, se debe tener cuidado de no crear múltiples defaults sin la lógica de setDefaultDivisa.
    // Por simplicidad, permitimos actualizarlo, pero se recomienda usar el endpoint específico.
    if (Es_Default !== undefined) {
        if (Es_Default === 1 || Es_Default === true) {
            // Si se intenta establecer como default aquí, advertir o redirigir a la función específica.
            // Opcionalmente, se podría replicar la lógica de setDefaultDivisa aquí, pero es mejor mantenerla separada.
            // Por ahora, simplemente actualizamos.
        }
        updateData.Es_Default = Es_Default;
    }

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No se proporcionaron datos para actualizar.' });
    }

    await divisa.update(updateData);
    res.status(200).json({ message: 'Divisa actualizada con éxito.', data: divisa });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({
        message: 'Error al actualizar la divisa: Ya existe una divisa con ese código.',
        error: error.errors.map(e => e.message)
      });
    }
    if (error instanceof ValidationError) {
      return res.status(400).json({
        message: 'Error de validación al actualizar la divisa.',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }
    console.error(`Error al actualizar la divisa ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al actualizar la divisa.', error: error.message });
  }
};

// Establecer divisa predeterminada
const setDefaultDivisa = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    // Resetear todas las divisas
    await Divisas.update(
      { Es_Default: 0 },
      { where: {}, transaction: t }
    );
    
    // Establecer la divisa seleccionada como predeterminada
    const divisa = await Divisas.findByPk(id, { transaction: t });
    
    if (!divisa) {
      await t.rollback();
      return res.status(404).json({ message: 'Divisa no encontrada.' });
    }
    
    await divisa.update({ Es_Default: 1 }, { transaction: t });
    await t.commit();
    
    res.status(200).json({ 
      message: `La divisa '${divisa.Nombre}' ha sido establecida como predeterminada con éxito.`,
      data: divisa
    });
  } catch (error) {
    if (t && !t.finished) {
        await t.rollback();
    }
    console.error(`Error al establecer la divisa predeterminada ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al establecer la divisa predeterminada.', error: error.message });
  }
};

// Eliminar una divisa
const deleteDivisa = async (req, res) => {
  try {
    const { id } = req.params;
    const divisa = await Divisas.findByPk(id);

    if (!divisa) {
      return res.status(404).json({ message: 'Divisa no encontrada.' });
    }
    if (divisa.Es_Default === 1 || divisa.Es_Default === true) {
        return res.status(400).json({ message: 'No se puede eliminar la divisa predeterminada. Establezca otra divisa como predeterminada primero.' });
    }
    await divisa.destroy();
    res.status(200).json({ message: 'Divisa eliminada con éxito.' });
  } catch (error) {
    if (error instanceof ForeignKeyConstraintError) {
      return res.status(409).json({ message: 'No se puede eliminar la divisa porque está en uso en otros registros (ej. Pagos, Tipos de Cambio).', error: error.message });
    }
    console.error(`Error al eliminar la divisa ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al eliminar la divisa.', error: error.message });
  }
};

module.exports = {
  getAllDivisas,
  getDivisaById,
  createDivisa,
  updateDivisa,
  setDefaultDivisa,
  deleteDivisa // Exportar la nueva función
};