// src/models/banco.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Banco = sequelize.define('BANCOS', {
  ID_Banco: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  Codigo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  Swift_Code: {
    type: DataTypes.STRING(20)
  },
  Logo_URL: {
    type: DataTypes.STRING(255)
  },
  Estado: {
    type: DataTypes.STRING(20),
    validate: {
      isIn: [['Activo', 'Inactivo']]
    },
    defaultValue: 'Activo'
  },
  Fecha_Creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  Fecha_Actualizacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'BANCOS',
  timestamps: false
});

module.exports = Banco;
