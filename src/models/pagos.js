const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pagos = sequelize.define('PAGOS', {
  ID_Pago: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ID_Pedido: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Fecha_Pago: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  Metodo_Pago: {
    type: DataTypes.STRING(20),
    validate: {
      isIn: [['Efectivo', 'Débito', 'Crédito', 'Transferencia']]
    }
  },
  Procesador_Pago: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  Numero_Transaccion: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  Monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  ID_Divisa: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Estado: {
    type: DataTypes.STRING(20),
    validate: {
      isIn: [['Pendiente', 'Completado', 'Rechazado', 'Reembolsado']]
    }
  },
  ID_Contador: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  Comprobante_URL: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  Numero_Cuotas: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  Observaciones: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
});

module.exports = Pagos;