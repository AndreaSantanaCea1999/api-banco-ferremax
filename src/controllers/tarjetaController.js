// src/controllers/tarjetaController.js
const { Tarjeta, Banco, Cliente, CuentaBancaria, PagoBancario } = require('../models/indexBanco');
const { sequelize } = require('../config/database');
const crypto = require('crypto');

// Función para encriptar el número de tarjeta (simulación)
const encriptarTarjeta = (numeroTarjeta) => {
  // En producción usaríamos encriptación real con claves seguras
  return crypto.createHash('sha256').update(numeroTarjeta).digest('hex');
};

// Función para enmascarar el número de tarjeta
const enmascararTarjeta = (numeroTarjeta) => {
  if (!numeroTarjeta || numeroTarjeta.length < 12) return 'XXXX-XXXX-XXXX-XXXX';
  const ultimosDigitos = numeroTarjeta.slice(-4);
  return `XXXX-XXXX-XXXX-${ultimosDigitos}`;
};

// Obtener todas las tarjetas
exports.getAllTarjetas = async (req, res) => {
  try {
    const tarjetas = await Tarjeta.findAll({
      include: [
        { model: Banco, as: 'banco', attributes: ['ID_Banco', 'Nombre', 'Codigo'] },
        { model: Cliente, as: 'cliente', attributes: ['ID_Cliente', 'ID_Usuario'] },
        { model: CuentaBancaria, as: 'cuentaBancaria', attributes: ['ID_Cuenta', 'Numero_Cuenta', 'Tipo_Cuenta'] }
      ],
      attributes: { 
        exclude: ['CVV'] // Nunca devolver CVV
      }
    });
    
    // Enmascarar números de tarjeta en los resultados
    const tarjetasSeguras = tarjetas.map(tarjeta => {
      const tarjetaJSON = tarjeta.toJSON();
      tarjetaJSON.Numero_Tarjeta = enmascararTarjeta(tarjetaJSON.Numero_Tarjeta);
      return tarjetaJSON;
    });
    
    return res.status(200).json({
      success: true,
      count: tarjetasSeguras.length,
      data: tarjetasSeguras
    });
  } catch (error) {
    console.error('Error al obtener tarjetas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener tarjetas',
      message: error.message
    });
  }
};

// Obtener tarjeta por ID
exports.getTarjetaById = async (req, res) => {
  try {
    const tarjeta = await Tarjeta.findByPk(req.params.id, {
      include: [
        { model: Banco, as: 'banco', attributes: ['ID_Banco', 'Nombre', 'Codigo'] },
        { model: Cliente, as: 'cliente', attributes: ['ID_Cliente', 'ID_Usuario'] },
        { model: CuentaBancaria, as: 'cuentaBancaria', attributes: ['ID_Cuenta', 'Numero_Cuenta', 'Tipo_Cuenta'] }
      ],
      attributes: { 
        exclude: ['CVV'] // Nunca devolver CVV
      }
    });
    
    if (!tarjeta) {
      return res.status(404).json({
        success: false,
        error: 'Tarjeta no encontrada'
      });
    }
    
    // Enmascarar número de tarjeta
    const tarjetaSegura = tarjeta.toJSON();
    tarjetaSegura.Numero_Tarjeta = enmascararTarjeta(tarjetaSegura.Numero_Tarjeta);
    
    return res.status(200).json({
      success: true,
      data: tarjetaSegura
    });
  } catch (error) {
    console.error('Error al obtener tarjeta:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener tarjeta',
      message: error.message
    });
  }
};

// Obtener tarjetas por cliente
exports.getTarjetasByCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    
    // Verificar que el cliente existe
    const cliente = await Cliente.findByPk(clienteId);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    const tarjetas = await Tarjeta.findAll({
      where: { ID_Cliente: clienteId },
      include: [
        { model: Banco, as: 'banco', attributes: ['ID_Banco', 'Nombre', 'Codigo'] }
      ],
      attributes: { 
        exclude: ['CVV'] // Nunca devolver CVV
      }
    });
    
    // Enmascarar números de tarjeta en los resultados
    const tarjetasSeguras = tarjetas.map(tarjeta => {
      const tarjetaJSON = tarjeta.toJSON();
      tarjetaJSON.Numero_Tarjeta = enmascararTarjeta(tarjetaJSON.Numero_Tarjeta);
      return tarjetaJSON;
    });
    
    return res.status(200).json({
      success: true,
      count: tarjetasSeguras.length,
      data: tarjetasSeguras
    });
  } catch (error) {
    console.error('Error al obtener tarjetas del cliente:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener tarjetas del cliente',
      message: error.message
    });
  }
};

// Crear una nueva tarjeta
exports.createTarjeta = async (req, res) => {
  try {
    const { 
      ID_Cliente, 
      ID_Banco, 
      ID_Cuenta, 
      Tipo_Tarjeta, 
      Numero_Tarjeta, 
      Titular, 
      Fecha_Expiracion, 
      CVV, 
      Limite_Credito 
    } = req.body;
    
    // Validación básica
    if (!ID_Cliente || !ID_Banco || !Tipo_Tarjeta || !Numero_Tarjeta || !Titular || !Fecha_Expiracion) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos obligatorios'
      });
    }
    
    // Verificar que el cliente existe
    const cliente = await Cliente.findByPk(ID_Cliente);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    // Verificar que el banco existe
    const banco = await Banco.findByPk(ID_Banco);
    if (!banco) {
      return res.status(404).json({
        success: false,
        error: 'Banco no encontrado'
      });
    }
    
    // Verificar la cuenta si se proporciona
    if (ID_Cuenta) {
      const cuenta = await CuentaBancaria.findByPk(ID_Cuenta);
      if (!cuenta) {
        return res.status(404).json({
          success: false,
          error: 'Cuenta bancaria no encontrada'
        });
      }
      
      // Verificar que la cuenta pertenezca al mismo cliente
      if (cuenta.ID_Cliente !== parseInt(ID_Cliente)) {
        return res.status(400).json({
          success: false,
          error: 'La cuenta bancaria no pertenece al cliente especificado'
        });
      }
    }
    
    // Encriptar datos sensibles
    const numeroTarjetaEncriptado = encriptarTarjeta(Numero_Tarjeta);
    
    // Crear tarjeta en la base de datos
    const nuevaTarjeta = await Tarjeta.create({
      ID_Cliente,
      ID_Banco,
      ID_Cuenta,
      Tipo_Tarjeta,
      Numero_Tarjeta: numeroTarjetaEncriptado, // Almacenar encriptado
      Titular,
      Fecha_Expiracion,
      CVV: CVV ? encriptarTarjeta(CVV) : null, // Encriptar CVV si se proporciona
      Limite_Credito: Tipo_Tarjeta === 'Credito' ? Limite_Credito : null,
      Saldo_Actual: Tipo_Tarjeta === 'Credito' ? 0 : null,
      Estado: 'Activa',
      Fecha_Emision: new Date()
    });
    
    // Preparar respuesta segura (sin mostrar datos sensibles)
    const respuesta = nuevaTarjeta.toJSON();
    respuesta.Numero_Tarjeta = enmascararTarjeta(Numero_Tarjeta);
    delete respuesta.CVV;
    
    return res.status(201).json({
      success: true,
      message: 'Tarjeta creada exitosamente',
      data: respuesta
    });
  } catch (error) {
    console.error('Error al crear tarjeta:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al crear tarjeta',
      message: error.message
    });
  }
};

// Actualizar una tarjeta
exports.updateTarjeta = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      Estado, 
      Limite_Credito, 
      Fecha_Expiracion 
    } = req.body;
    
    const tarjeta = await Tarjeta.findByPk(id);
    
    if (!tarjeta) {
      return res.status(404).json({
        success: false,
        error: 'Tarjeta no encontrada'
      });
    }
    
    // No permitir actualizar datos críticos
    delete req.body.ID_Cliente;
    delete req.body.ID_Banco;
    delete req.body.Numero_Tarjeta;
    delete req.body.Titular;
    delete req.body.CVV;
    
    // Actualizar solo los campos permitidos
    await tarjeta.update({
      Estado: Estado || tarjeta.Estado,
      Limite_Credito: Limite_Credito !== undefined && tarjeta.Tipo_Tarjeta === 'Credito' ? 
        Limite_Credito : tarjeta.Limite_Credito,
      Fecha_Expiracion: Fecha_Expiracion || tarjeta.Fecha_Expiracion,
      Fecha_Actualizacion: new Date()
    });
    
    // Preparar respuesta segura
    const respuesta = tarjeta.toJSON();
    respuesta.Numero_Tarjeta = enmascararTarjeta(respuesta.Numero_Tarjeta);
    delete respuesta.CVV;
    
    return res.status(200).json({
      success: true,
      message: 'Tarjeta actualizada exitosamente',
      data: respuesta
    });
  } catch (error) {
    console.error('Error al actualizar tarjeta:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar tarjeta',
      message: error.message
    });
  }
};

// Bloquear una tarjeta
exports.bloquearTarjeta = async (req, res) => {
  try {
    const { id } = req.params;
    const { Motivo } = req.body;
    
    const tarjeta = await Tarjeta.findByPk(id);
    
    if (!tarjeta) {
      return res.status(404).json({
        success: false,
        error: 'Tarjeta no encontrada'
      });
    }
    
    // Verificar que la tarjeta esté activa
    if (tarjeta.Estado !== 'Activa') {
      return res.status(400).json({
        success: false,
        error: `La tarjeta ya está ${tarjeta.Estado.toLowerCase()}`
      });
    }
    
    // Bloquear la tarjeta
    await tarjeta.update({
      Estado: 'Bloqueada',
      Fecha_Actualizacion: new Date()
    });
    
    // Registrar el motivo del bloqueo (podría hacerse en una tabla separada en un caso real)
    
    return res.status(200).json({
      success: true,
      message: 'Tarjeta bloqueada exitosamente',
      data: {
        ID_Tarjeta: tarjeta.ID_Tarjeta,
        Estado: 'Bloqueada',
        Motivo: Motivo || 'Bloqueada por solicitud del usuario'
      }
    });
  } catch (error) {
    console.error('Error al bloquear tarjeta:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al bloquear tarjeta',
      message: error.message
    });
  }
};

// Eliminar una tarjeta (con validación de uso)
exports.deleteTarjeta = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tarjeta = await Tarjeta.findByPk(id);
    
    if (!tarjeta) {
      return res.status(404).json({
        success: false,
        error: 'Tarjeta no encontrada'
      });
    }
    
    // Verificar si tiene pagos asociados
    const pagosAsociados = await PagoBancario.findOne({
      where: { ID_Tarjeta: id }
    });
    
    if (pagosAsociados) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar la tarjeta porque tiene pagos asociados'
      });
    }
    
    await tarjeta.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Tarjeta eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar tarjeta:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al eliminar tarjeta',
      message: error.message
    });
  }
};
