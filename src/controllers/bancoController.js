// src/controllers/bancoController.js
const { Banco, CuentaBancaria } = require('../models/indexBanco');

// Obtener todos los bancos
exports.getAllBancos = async (req, res) => {
  try {
    const bancos = await Banco.findAll();
    return res.status(200).json({
      success: true,
      count: bancos.length,
      data: bancos
    });
  } catch (error) {
    console.error('Error al obtener bancos:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener bancos',
      message: error.message
    });
  }
};

// Obtener banco por ID
exports.getBancoById = async (req, res) => {
  try {
    const banco = await Banco.findByPk(req.params.id, {
      include: [
        { 
          model: CuentaBancaria, 
          as: 'cuentas',
          attributes: ['ID_Cuenta', 'Tipo_Cuenta', 'Numero_Cuenta', 'Estado'] 
        }
      ]
    });
    
    if (!banco) {
      return res.status(404).json({
        success: false,
        error: 'Banco no encontrado'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: banco
    });
  } catch (error) {
    console.error('Error al obtener banco:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener banco',
      message: error.message
    });
  }
};

// Crear un nuevo banco
exports.createBanco = async (req, res) => {
  try {
    const { Nombre, Codigo, Swift_Code, Logo_URL, Estado } = req.body;
    
    // Validación básica
    if (!Nombre || !Codigo) {
      return res.status(400).json({
        success: false,
        error: 'Los campos Nombre y Código son obligatorios'
      });
    }
    
    // Verificar si ya existe un banco con ese código
    const bancoExistente = await Banco.findOne({ where: { Codigo } });
    if (bancoExistente) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe un banco con ese código'
      });
    }
    
    const nuevoBanco = await Banco.create({
      Nombre,
      Codigo,
      Swift_Code,
      Logo_URL,
      Estado: Estado || 'Activo'
    });
    
    return res.status(201).json({
      success: true,
      message: 'Banco creado exitosamente',
      data: nuevoBanco
    });
  } catch (error) {
    console.error('Error al crear banco:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al crear banco',
      message: error.message
    });
  }
};

// Actualizar un banco existente
exports.updateBanco = async (req, res) => {
  try {
    const { id } = req.params;
    const { Nombre, Codigo, Swift_Code, Logo_URL, Estado } = req.body;
    
    const banco = await Banco.findByPk(id);
    
    if (!banco) {
      return res.status(404).json({
        success: false,
        error: 'Banco no encontrado'
      });
    }
    
    // Si se está modificando el código, verificar que no exista otro con ese código
    if (Codigo && Codigo !== banco.Codigo) {
      const bancoExistente = await Banco.findOne({ where: { Codigo } });
      if (bancoExistente) {
        return res.status(400).json({
          success: false,
          error: 'Ya existe un banco con ese código'
        });
      }
    }
    
    await banco.update({
      Nombre: Nombre || banco.Nombre,
      Codigo: Codigo || banco.Codigo,
      Swift_Code: Swift_Code !== undefined ? Swift_Code : banco.Swift_Code,
      Logo_URL: Logo_URL !== undefined ? Logo_URL : banco.Logo_URL,
      Estado: Estado || banco.Estado,
      Fecha_Actualizacion: new Date()
    });
    
    return res.status(200).json({
      success: true,
      message: 'Banco actualizado exitosamente',
      data: banco
    });
  } catch (error) {
    console.error('Error al actualizar banco:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar banco',
      message: error.message
    });
  }
};

// Eliminar un banco
exports.deleteBanco = async (req, res) => {
  try {
    const { id } = req.params;
    
    const banco = await Banco.findByPk(id);
    
    if (!banco) {
      return res.status(404).json({
        success: false,
        error: 'Banco no encontrado'
      });
    }
    
    // Verificar si tiene cuentas asociadas
    const cuentasAsociadas = await CuentaBancaria.findOne({
      where: { ID_Banco: id }
    });
    
    if (cuentasAsociadas) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar el banco porque tiene cuentas asociadas'
      });
    }
    
    await banco.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Banco eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar banco:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al eliminar banco',
      message: error.message
    });
  }
};