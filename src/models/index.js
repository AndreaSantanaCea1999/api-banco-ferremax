const sequelize = require('../config/database');
const Pedidos = require('./pedidos');
const DetallesPedido = require('./detallesPedido');
const Pagos = require('./pagos');
const WebpayTransacciones = require('./webpayTransacciones');
const Divisas = require('./divisas');
const TiposCambio = require('./tiposCambio');

// Definir relaciones
Pedidos.hasMany(DetallesPedido, { foreignKey: 'ID_Pedido' });
DetallesPedido.belongsTo(Pedidos, { foreignKey: 'ID_Pedido' });

Pedidos.hasMany(Pagos, { foreignKey: 'ID_Pedido' });
Pagos.belongsTo(Pedidos, { foreignKey: 'ID_Pedido' });

Pagos.hasOne(WebpayTransacciones, { foreignKey: 'ID_Pago' });
WebpayTransacciones.belongsTo(Pagos, { foreignKey: 'ID_Pago' });

Divisas.hasMany(TiposCambio, { foreignKey: 'ID_Divisa_Origen', as: 'DivisaOrigen' });
Divisas.hasMany(TiposCambio, { foreignKey: 'ID_Divisa_Destino', as: 'DivisaDestino' });
TiposCambio.belongsTo(Divisas, { foreignKey: 'ID_Divisa_Origen', as: 'DivisaOrigen' });
TiposCambio.belongsTo(Divisas, { foreignKey: 'ID_Divisa_Destino', as: 'DivisaDestino' });

const models = {
  Pedidos,
  DetallesPedido,
  Pagos,
  WebpayTransacciones,
  Divisas,
  TiposCambio,
  sequelize
};

module.exports = models;