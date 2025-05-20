const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pedidos = sequelize.define('PEDIDOS', {
  ID_Pedido: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Codigo_Pedido: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  },
  ID_Cliente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'CLIENTES',       // Asegúrate que coincida con el nombre real de la tabla
      key: 'ID_Cliente'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'       // Evita eliminar un cliente si hay pedidos asociados
  },
  ID_Vendedor: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  ID_Sucursal: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Fecha_Pedido: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  Canal: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      isIn: [['Online', 'Físico']]
    }
  },
  Estado: {
    type: DataTypes.STRING(30),
    allowNull: true,
    validate: {
      isIn: [['Pendiente', 'Aprobado', 'En_Preparacion', 'Listo_Para_Entrega', 'En_Ruta', 'Entregado', 'Cancelado', 'Devuelto']]
    }
  },
  Metodo_Entrega: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      isIn: [['Retiro_Tienda', 'Despacho_Domicilio']]
    }
  },
  Direccion_Entrega: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  Ciudad_Entrega: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  Region_Entrega: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  Pais_Entrega: {
    type: DataTypes.STRING(50),
    defaultValue: 'Chile',
    allowNull: true
  },
  Comentarios: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  Subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  Descuento: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    allowNull: false
  },
  Impuestos: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    allowNull: false
  },
  Costo_Envio: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    allowNull: false
  },
  Total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  ID_Divisa: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Fecha_Estimada_Entrega: {
    type: DataTypes.DATE,
    allowNull: true
  },
  Prioridad: {
    type: DataTypes.STRING(20),
    defaultValue: 'Normal',
    validate: {
      isIn: [['Baja', 'Normal', 'Alta', 'Urgente']]
    }
  }
}, {
  tableName: 'PEDIDOS',
  timestamps: false
});

module.exports = Pedidos;
