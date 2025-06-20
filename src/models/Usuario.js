// src/models/Usuario.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database'); // Importar sequelize directamente

const Usuario = sequelize.define('Usuario', {
  ID_Usuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  rol: {
    type: DataTypes.ENUM('cliente', 'administrador', 'vendedor', 'bodeguero', 'contador'),
    allowNull: false,
    defaultValue: 'cliente'
  },
  rut: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  direccion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  primer_login: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  fecha_ultimo_login: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'usuarios',
  timestamps: true
});

// Hashear password antes de crear usuario
Usuario.beforeCreate(async (usuario) => {
  if (usuario.password) {
    usuario.password = await bcrypt.hash(usuario.password, 10);
  }
});

// Método para validar password
Usuario.prototype.validarPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Método estático para generar credenciales de administrador
Usuario.generarCredencialesAdmin = (nombre, rut) => {
  return {
    usuario: nombre.toLowerCase().replace(/\s+/g, ''),
    password: rut.replace(/[^0-9kK]/g, '')
  };
};


module.exports = Usuario;