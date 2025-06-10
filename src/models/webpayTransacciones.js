const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WebpayTransacciones = sequelize.define('webpay_transacciones', {
  ID_Webpay_Transaccion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ID_Pago: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Token_Webpay: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  Orden_Compra: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  Tarjeta_Tipo: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  Tarjeta_Numero: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  Autorizacion_Codigo: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  Respuesta_Codigo: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  Respuesta_Descripcion: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  Fecha_Transaccion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  Installments: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  JSON_Respuesta: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'webpay_transacciones',
  timestamps: false
});

module.exports = WebpayTransacciones;