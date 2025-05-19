// src/models/tarjeta.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tarjeta = sequelize.define('TARJETAS', {
  ID_Tarjeta: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ID_Cliente: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ID_Banco: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ID_Cuenta: {
    type: DataTypes.INTEGER
  },
  Tipo_Tarjeta: {
    type: DataTypes.STRING(20),
    validate: {
      isIn: [['Debito', 'Credito', 'Prepago']]
    },
    allowNull: false
  },
  Numero_Tarjeta: {
    type: DataTypes.STRING(255),
    allowNull: false
    // En producción real, este campo estaría encriptado
  },
  Titular: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  Fecha_Expiracion: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  CVV: {
    type: DataTypes.STRING(255)
    // En producción real, este campo estaría encriptado
  },
  Limite_Credito: {
    type: DataTypes.DECIMAL(15, 2)
  },
  Saldo_Actual: {
    type: DataTypes.DECIMAL(15, 2)
  },
  Estado: {
    type: DataTypes.STRING(20),
    validate: {
      isIn: [['Activa', 'Bloqueada', 'Expirada', 'Cancelada']]
    },
    defaultValue: 'Activa'
  },
  Fecha_Emision: {
    type: DataTypes.DATE
  },
  Fecha_Actualizacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'TARJETAS',
  timestamps: false,
  indexes: [
    {
      fields: ['ID_Cliente']
    }
  ]
});

module.exports = Tarjeta;
