const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// Esta es una simulación de la API de WebPay
// En producción, deberías usar el SDK oficial de Transbank/WebPay

const WEBPAY_API_KEY = process.env.WEBPAY_API_KEY || 'api_key_simulada';
const WEBPAY_API_SECRET = process.env.WEBPAY_API_SECRET || 'api_secret_simulada';
const WEBPAY_API_URL = process.env.WEBPAY_API_URL || 'https://webpay3g.transbank.cl';
const WEBPAY_INTEGRATION = process.env.NODE_ENV !== 'production';

// Iniciar una transacción
const iniciarTransaccion = async (idPedido, monto, returnUrl, finalUrl) => {
  try {
    if (WEBPAY_INTEGRATION) {
      // En integración/desarrollo, simulamos una respuesta exitosa
      console.log(`[SIMULACIÓN] Iniciando transacción WebPay para pedido ${idPedido} por $${monto}`);
      
      const token = `SIMU-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      
      return {
        token,
        url: `${WEBPAY_API_URL}/webpayserver/initTransaction?token_ws=${token}`
      };
    } else {
      // En producción, llamamos a la API real de WebPay
      const response = await axios.post(`${WEBPAY_API_URL}/transactions`, {
        buy_order: `PED-${idPedido}`,
        session_id: `SES-${idPedido}`,
        amount: monto,
        return_url: returnUrl,
        final_url: finalUrl
      }, {
        headers: {
          'Tbk-Api-Key-Id': WEBPAY_API_KEY,
          'Tbk-Api-Key-Secret': WEBPAY_API_SECRET,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        token: response.data.token,
        url: response.data.url
      };
    }
  } catch (error) {
    console.error('Error al iniciar transacción WebPay:', error);
    throw new Error('Error al iniciar la transacción de pago');
  }
};

// Confirmar resultado de una transacción
const confirmarTransaccion = async (token) => {
  try {
    if (WEBPAY_INTEGRATION) {
      // En integración/desarrollo, simulamos una respuesta exitosa
      console.log(`[SIMULACIÓN] Confirmando transacción WebPay con token ${token}`);
      
      return {
        responseCode: '0', // 0 significa transacción exitosa
        responseDescription: 'Transacción aprobada',
        authorizationCode: `AUTH-${Math.floor(Math.random() * 1000000)}`,
        cardType: 'Visa',
        cardNumber: '****1234',
        installmentsNumber: 1,
        amount: 50000,
        buyOrder: 'PED-12345'
      };
    } else {
      // En producción, llamamos a la API real de WebPay
      const response = await axios.put(`${WEBPAY_API_URL}/transactions/${token}`, {}, {
        headers: {
          'Tbk-Api-Key-Id': WEBPAY_API_KEY,
          'Tbk-Api-Key-Secret': WEBPAY_API_SECRET,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        responseCode: response.data.response_code,
        responseDescription: response.data.status,
        authorizationCode: response.data.authorization_code,
        cardType: response.data.card_detail.card_type,
        cardNumber: response.data.card_detail.card_number,
        installmentsNumber: response.data.installments_number,
        amount: response.data.amount,
        buyOrder: response.data.buy_order
      };
    }
  } catch (error) {
    console.error('Error al confirmar transacción WebPay:', error);
    throw new Error('Error al confirmar la transacción de pago');
  }
};

module.exports = {
  iniciarTransaccion,
  confirmarTransaccion
};