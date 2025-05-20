const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Divisas = sequelize.define('DIVISAS', {
  ID_Divisa: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Codigo: {
    type: DataTypes.STRING(10),
    unique: true,
    allowNull: false
  },
  Nombre: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  Simbolo: {
    type: DataTypes.STRING(5),
    allowNull: false
  },
  Es_Default: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = Divisas;