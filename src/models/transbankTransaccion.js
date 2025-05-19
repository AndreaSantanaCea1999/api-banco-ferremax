// src/models/transbankTransaccion.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TransbankTransaccion = sequelize.define('TRANSBANK_TRANSACCIONES', {
  ID_Transbank: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ID_Pago: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ID_Pago_Bancario: {
    type: DataTypes.INTEGER
  },
  Token_Transaccion: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  Codigo_Comercio: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  Numero_Orden: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  Monto: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  Fecha_Transaccion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  Estado: {
    type: DataTypes.STRING(20),
    validate: {
      isIn: [['Iniciada', 'Confirmada', 'Fallida', 'Anulada']]
    },
    defaultValue: 'Iniciada'
  },
  URL_Retorno: {
    type: DataTypes.STRING(255)
  },
  JSON_Respuesta: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'TRANSBANK_TRANSACCIONES',
  timestamps: false,
  indexes: [
    {
      fields: ['ID_Pago']
    },
    {
      fields: ['Token_Transaccion']
    }
  ]
});

module.exports = TransbankTransaccion;
