// src/models/cuentaBancaria.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CuentaBancaria = sequelize.define('CUENTAS_BANCARIAS', {
  ID_Cuenta: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ID_Banco: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ID_Cliente: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ID_Sucursal: {
    type: DataTypes.INTEGER
  },
  Tipo_Cuenta: {
    type: DataTypes.STRING(30),
    validate: {
      isIn: [['Corriente', 'Ahorro', 'Vista', 'Comercial']]
    }
  },
  Numero_Cuenta: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  Saldo: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  Estado: {
    type: DataTypes.STRING(20),
    validate: {
      isIn: [['Activa', 'Bloqueada', 'Cerrada']]
    },
    defaultValue: 'Activa'
  },
  Fecha_Apertura: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  Fecha_Actualizacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'CUENTAS_BANCARIAS',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['ID_Banco', 'Numero_Cuenta']
    }
  ]
});

module.exports = CuentaBancaria;
