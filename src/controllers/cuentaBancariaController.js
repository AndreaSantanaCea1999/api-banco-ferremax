// src/controllers/cuentaBancariaController.js
const { CuentaBancaria, Banco, Cliente, TransaccionBancaria } = require('../models/indexBanco');
const { sequelize } = require('../config/database');

// Obtener todas las cuentas bancarias
exports.getAllCuentas = async (req, res) => {
  try {
    const cuentas = await CuentaBancaria.findAll({
      include: [
        { model: Banco, as: 'banco', attributes: ['ID_Banco', 'Nombre', 'Codigo'] },
        { model: Cliente, as: 'cliente', attributes: ['ID_Cliente', 'ID_Usuario'] }
      ]
    });
    
    return res.status(200).json({
      success: true,
      count: cuentas.length,
      data: cuentas
    });
  } catch (error) {
    console.error('Error al obtener cuentas bancarias:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener cuentas bancarias',
      message: error.message
    });
  }
};

// Obtener cuenta bancaria por ID
exports.getCuentaById = async (req, res) => {
  try {
    const cuenta = await CuentaBancaria.findByPk(req.params.id, {
      include: [
        { model: Banco, as: 'banco', attributes: ['ID_Banco', 'Nombre', 'Codigo'] },
        { model: Cliente, as: 'cliente', attributes: ['ID_Cliente', 'ID_Usuario'] },
        { 
          model: TransaccionBancaria, 
          as: 'transacciones',
          attributes: ['ID_Transaccion', 'Tipo_Transaccion', 'Monto', 'Fecha_Transaccion', 'Estado'],
          limit: 10,
          order: [['Fecha_Transaccion', 'DESC']]
        }
      ]
    });
    
    if (!cuenta) {
      return res.status(404).json({
        success: false,
        error: 'Cuenta bancaria no encontrada'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: cuenta
    });
  } catch (error) {
    console.error('Error al obtener cuenta bancaria:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener cuenta bancaria',
      message: error.message
    });
  }
};

// Obtener cuentas bancarias por cliente
exports.getCuentasByCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    
    const cuentas = await CuentaBancaria.findAll({
      where: { ID_Cliente: clienteId },
      include: [
        { model: Banco, as: 'banco', attributes: ['ID_Banco', 'Nombre', 'Codigo'] }
      ]
    });
    
    return res.status(200).json({
      success: true,
      count: cuentas.length,
      data: cuentas
    });
  } catch (error) {
    console.error('Error al obtener cuentas del cliente:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener cuentas del cliente',
      message: error.message
    });
  }
};

// Crear una nueva cuenta bancaria
exports.createCuenta = async (req, res) => {
  try {
    const { 
      ID_Banco, 
      ID_Cliente, 
      ID_Sucursal, 
      Tipo_Cuenta, 
      Numero_Cuenta, 
      Saldo, 
      Estado 
    } = req.body;
    
    // Validación básica
    if (!ID_Banco || !ID_Cliente || !Tipo_Cuenta || !Numero_Cuenta) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos obligatorios'
      });
    }
    
    // Verificar si existe el banco
    const banco = await Banco.findByPk(ID_Banco);
    if (!banco) {
      return res.status(404).json({
        success: false,
        error: 'El banco especificado no existe'
      });
    }
    
    // Verificar si existe el cliente
    const cliente = await Cliente.findByPk(ID_Cliente);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'El cliente especificado no existe'
      });
    }
    
    // Verificar si ya existe una cuenta con ese número en ese banco
    const cuentaExistente = await CuentaBancaria.findOne({
      where: { 
        ID_Banco, 
        Numero_Cuenta 
      }
    });
    
    if (cuentaExistente) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe una cuenta con ese número en ese banco'
      });
    }
    
    const nuevaCuenta = await CuentaBancaria.create({
      ID_Banco,
      ID_Cliente,
      ID_Sucursal,
      Tipo_Cuenta,
      Numero_Cuenta,
      Saldo: Saldo || 0,
      Estado: Estado || 'Activa',
      Fecha_Apertura: new Date()
    });
    
    return res.status(201).json({
      success: true,
      message: 'Cuenta bancaria creada exitosamente',
      data: nuevaCuenta
    });
  } catch (error) {
    console.error('Error al crear cuenta bancaria:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al crear cuenta bancaria',
      message: error.message
    });
  }
};

// Actualizar una cuenta bancaria
exports.updateCuenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      Tipo_Cuenta, 
      Saldo, 
      Estado, 
      ID_Sucursal 
    } = req.body;
    
    const cuenta = await CuentaBancaria.findByPk(id);
    
    if (!cuenta) {
      return res.status(404).json({
        success: false,
        error: 'Cuenta bancaria no encontrada'
      });
    }
    
    // No permitir actualizar campos críticos como ID_Banco, ID_Cliente o Numero_Cuenta
    delete req.body.ID_Banco;
    delete req.body.ID_Cliente;
    delete req.body.Numero_Cuenta;
    
    await cuenta.update({
      Tipo_Cuenta: Tipo_Cuenta || cuenta.Tipo_Cuenta,
      Estado: Estado || cuenta.Estado,
      ID_Sucursal: ID_Sucursal !== undefined ? ID_Sucursal : cuenta.ID_Sucursal,
      // Solo actualizar el saldo mediante transacciones específicas
      Fecha_Actualizacion: new Date()
    });
    
    // Si se proporciona un nuevo saldo, actualizarlo mediante una transacción
    if (Saldo !== undefined && Saldo !== cuenta.Saldo) {
      const diferencia = Saldo - cuenta.Saldo;
      const tipoTransaccion = diferencia > 0 ? 'Deposito' : 'Retiro';
      
      // Iniciar una transacción de base de datos
      const t = await sequelize.transaction();
      
      try {
        // Crear la transacción bancaria
        await TransaccionBancaria.create({
          ID_Cuenta: cuenta.ID_Cuenta,
          Tipo_Transaccion: tipoTransaccion,
          Monto: Math.abs(diferencia),
          Saldo_Resultante: Saldo,
          Descripcion: 'Ajuste de saldo',
          Fecha_Transaccion: new Date(),
          Estado: 'Completada'
        }, { transaction: t });
        
        // Actualizar el saldo de la cuenta
        await cuenta.update({
          Saldo: Saldo
        }, { transaction: t });
        
        await t.commit();
      } catch (error) {
        await t.rollback();
        throw error;
      }
    }
    
    // Obtener la cuenta actualizada con relaciones
    const cuentaActualizada = await CuentaBancaria.findByPk(id, {
      include: [
        { model: Banco, as: 'banco', attributes: ['ID_Banco', 'Nombre', 'Codigo'] }
      ]
    });
    
    return res.status(200).json({
      success: true,
      message: 'Cuenta bancaria actualizada exitosamente',
      data: cuentaActualizada
    });
  } catch (error) {
    console.error('Error al actualizar cuenta bancaria:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar cuenta bancaria',
      message: error.message
    });
  }
};

// Eliminar una cuenta bancaria (con validación de transacciones)
exports.deleteCuenta = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cuenta = await CuentaBancaria.findByPk(id);
    
    if (!cuenta) {
      return res.status(404).json({
        success: false,
        error: 'Cuenta bancaria no encontrada'
      });
    }
    
    // Verificar si tiene transacciones asociadas
    const transaccionesAsociadas = await TransaccionBancaria.findOne({
      where: { ID_Cuenta: id }
    });
    
    if (transaccionesAsociadas) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar la cuenta porque tiene transacciones asociadas'
      });
    }
    
    await cuenta.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Cuenta bancaria eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar cuenta bancaria:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al eliminar cuenta bancaria',
      message: error.message
    });
  }
};