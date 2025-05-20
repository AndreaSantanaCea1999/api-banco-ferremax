const { WebpayTransacciones, Pagos } = require('../models');
const webpayService = require('../services/webpayService');

// Iniciar una transacción WebPay
const iniciarTransaccion = async (req, res) => {
  try {
    const { idPedido, monto, returnUrl, finalUrl } = req.body;
    
    if (!idPedido || !monto || !returnUrl || !finalUrl) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }
    
    // Iniciar transacción con WebPay
    const resultado = await webpayService.iniciarTransaccion(idPedido, monto, returnUrl, finalUrl);
    
    // Crear registro de pago pendiente
    const pago = await Pagos.create({
      ID_Pedido: idPedido,
      Metodo_Pago: 'Crédito',
      Procesador_Pago: 'WebPay',
      Numero_Transaccion: resultado.token,
      Monto: monto,
      ID_Divisa: 1, // Asumiendo que 1 es CLP
      Estado: 'Pendiente'
    });
    
    // Crear registro de transacción WebPay
    await WebpayTransacciones.create({
      ID_Pago: pago.ID_Pago,
      Token_Webpay: resultado.token,
      Orden_Compra: `PED-${idPedido}`
    });
    
    res.status(200).json({
      token: resultado.token,
      url: resultado.url,
      idPago: pago.ID_Pago
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Confirmar resultado de transacción WebPay
const confirmarTransaccion = async (req, res) => {
  try {
    const { token_ws } = req.body; // Token recibido desde WebPay
    
    if (!token_ws) {
      return res.status(400).json({ message: 'Token no proporcionado' });
    }
    
    // Verificar resultado con WebPay
    const resultado = await webpayService.confirmarTransaccion(token_ws);
    
    // Encontrar la transacción en nuestra base de datos
    const transaccion = await WebpayTransacciones.findOne({
      where: { Token_Webpay: token_ws },
      include: [Pagos]
    });
    
    if (!transaccion) {
      return res.status(404).json({ message: 'Transacción no encontrada' });
    }
    
    // Actualizar datos de la transacción
    await transaccion.update({
      Respuesta_Codigo: resultado.responseCode,
      Respuesta_Descripcion: resultado.responseDescription,
      Autorizacion_Codigo: resultado.authorizationCode,
      Tarjeta_Tipo: resultado.cardType,
      Tarjeta_Numero: resultado.cardNumber,
      Installments: resultado.installmentsNumber || 1,
      JSON_Respuesta: JSON.stringify(resultado)
    });
    
    // Actualizar el estado del pago
    const estadoPago = resultado.responseCode === '0' ? 'Completado' : 'Rechazado';
    await Pagos.update(
      { 
        Estado: estadoPago,
        Numero_Cuotas: resultado.installmentsNumber || 1
      },
      { where: { ID_Pago: transaccion.ID_Pago } }
    );
    
    res.status(200).json({
      status: resultado.responseCode === '0' ? 'success' : 'failure',
      message: resultado.responseDescription,
      transaccion: {
        id: transaccion.ID_Webpay_Transaccion,
        authorizationCode: resultado.authorizationCode,
        responseCode: resultado.responseCode
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  iniciarTransaccion,
  confirmarTransaccion
};