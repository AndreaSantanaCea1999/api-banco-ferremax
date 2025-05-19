// src/models/pagoBancario.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PagoBancario = sequelize.define('PAGOS_BANCARIOS', {
  ID_Pago_Bancario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ID_Pago: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ID_Transaccion: {
    type: DataTypes.INTEGER
  },
  ID_Tarjeta: {
    type: DataTypes.INTEGER
  },
  Tipo_Pago: {
    type: DataTypes.STRING(30),
    validate: {
      isIn: [['Cuenta_Bancaria', 'Tarjeta_Credito', 'Tarjeta_Debito', 'Transbank']]
    },
    allowNull: false
  },
  Fecha_Pago: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  Codigo_Autorizacion: {
    type: DataTypes.STRING(50)
  },
  Estado: {
    type: DataTypes.STRING(20),
    validate: {
      isIn: [['Pendiente', 'Procesando', 'Aprobado', 'Rechazado', 'Anulado']]
    },
    defaultValue: 'Pendiente'
  }
}, {
  tableName: 'PAGOS_BANCARIOS',
  timestamps: false,
  indexes: [
    {
      fields: ['ID_Pago']
    },
    {
      fields: ['Estado']
    }
  ]
});

module.exports = PagoBancario;
