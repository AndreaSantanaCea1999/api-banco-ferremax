// src/models/indexBanco.js
const { sequelize } = require('../config/database');

// Importar modelos existentes
const { Productos, Pagos, Cliente } = require('./index');

// Importar nuevos modelos de la API bancaria
const Banco = require('./banco');
const CuentaBancaria = require('./cuentaBancaria');
const TransaccionBancaria = require('./transaccionBancaria');
const Tarjeta = require('./tarjeta');
const PagoBancario = require('./pagoBancario');
const TransbankTransaccion = require('./transbankTransaccion');

// Definir relaciones entre modelos de la API bancaria
// Relaciones de Banco
Banco.hasMany(CuentaBancaria, { foreignKey: 'ID_Banco', as: 'cuentas' });
Banco.hasMany(Tarjeta, { foreignKey: 'ID_Banco', as: 'tarjetas' });

// Relaciones de Cuenta Bancaria
CuentaBancaria.belongsTo(Banco, { foreignKey: 'ID_Banco', as: 'banco' });
CuentaBancaria.belongsTo(Cliente, { foreignKey: 'ID_Cliente', as: 'cliente' });
CuentaBancaria.hasMany(TransaccionBancaria, { foreignKey: 'ID_Cuenta', as: 'transacciones' });
CuentaBancaria.hasMany(Tarjeta, { foreignKey: 'ID_Cuenta', as: 'tarjetas' });

// Relaciones de Transacción Bancaria
TransaccionBancaria.belongsTo(CuentaBancaria, { foreignKey: 'ID_Cuenta', as: 'cuenta' });
TransaccionBancaria.belongsTo(TransaccionBancaria, { foreignKey: 'ID_Transaccion_Relacionada', as: 'transaccionRelacionada' });
TransaccionBancaria.hasMany(TransaccionBancaria, { foreignKey: 'ID_Transaccion_Relacionada', as: 'transaccionesDerivadas' });
TransaccionBancaria.hasMany(PagoBancario, { foreignKey: 'ID_Transaccion', as: 'pagosBancarios' });

// Relaciones de Tarjeta
Tarjeta.belongsTo(Banco, { foreignKey: 'ID_Banco', as: 'banco' });
Tarjeta.belongsTo(Cliente, { foreignKey: 'ID_Cliente', as: 'cliente' });
Tarjeta.belongsTo(CuentaBancaria, { foreignKey: 'ID_Cuenta', as: 'cuentaBancaria' });
Tarjeta.hasMany(PagoBancario, { foreignKey: 'ID_Tarjeta', as: 'pagosBancarios' });

// Relaciones de Pago Bancario
PagoBancario.belongsTo(Pagos, { foreignKey: 'ID_Pago', as: 'pago' });
PagoBancario.belongsTo(TransaccionBancaria, { foreignKey: 'ID_Transaccion', as: 'transaccion' });
PagoBancario.belongsTo(Tarjeta, { foreignKey: 'ID_Tarjeta', as: 'tarjeta' });
PagoBancario.hasMany(TransbankTransaccion, { foreignKey: 'ID_Pago_Bancario', as: 'transaccionesTransbank' });

// Relaciones de Transbank Transacción
TransbankTransaccion.belongsTo(Pagos, { foreignKey: 'ID_Pago', as: 'pago' });
TransbankTransaccion.belongsTo(PagoBancario, { foreignKey: 'ID_Pago_Bancario', as: 'pagoBancario' });

// Relaciones con modelos existentes
Pagos.hasMany(PagoBancario, { foreignKey: 'ID_Pago', as: 'pagosBancarios' });
Pagos.hasMany(TransbankTransaccion, { foreignKey: 'ID_Pago', as: 'transaccionesTransbank' });
Cliente.hasMany(CuentaBancaria, { foreignKey: 'ID_Cliente', as: 'cuentasBancarias' });
Cliente.hasMany(Tarjeta, { foreignKey: 'ID_Cliente', as: 'tarjetas' });

// Exportar modelos
module.exports = {
  Banco,
  CuentaBancaria,
  TransaccionBancaria,
  Tarjeta,
  PagoBancario,
  TransbankTransaccion
};