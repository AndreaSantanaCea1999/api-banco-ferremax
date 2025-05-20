const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TiposCambio = sequelize.define('TIPOS_CAMBIO', {
  ID_Tipo_Cambio: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ID_Divisa_Origen: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ID_Divisa_Destino: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Fecha: {
    type: DataTypes.DATE,
    allowNull: false
  },
  Tasa_Cambio: {
    type: DataTypes.DECIMAL(14, 6),
    allowNull: false
  },
  Fuente: {
    type: DataTypes.STRING(100),
    defaultValue: 'Banco Central de Chile'
  }
});

module.exports = TiposCambio;