// c:\Users\andre\api-banco-ferremax\src\services\webpay.service.js

const axios = require('axios');

// Estas URLs son ejemplos y pueden cambiar. Consulta la documentación oficial de Transbank.
// Ambiente de Integración/Pruebas
const WEBPAY_BASE_URL_INTEGRACION = 'https://webpay3gint.transbank.cl/rswebpaytransaction/api/webpay/v1.2';
// Ambiente de Producción
const WEBPAY_BASE_URL_PRODUCCION = 'https://webpay3g.transbank.cl/rswebpaytransaction/api/webpay/v1.2';

// Determina la URL base según el entorno (puedes usar una variable de entorno para esto)
const CURRENT_WEBPAY_URL = process.env.NODE_ENV === 'production' ? WEBPAY_BASE_URL_PRODUCCION : WEBPAY_BASE_URL_INTEGRACION;

const TbkApiKeyId = process.env.WEBPAY_COMMERCE_CODE; // Tu código de comercio
const TbkApiKeySecret = process.env.WEBPAY_API_KEY;   // Tu API Key Secret para la API REST

if (!TbkApiKeyId || !TbkApiKeySecret) {
  console.warn(
    'ADVERTENCIA: WEBPAY_COMMERCE_CODE o WEBPAY_API_KEY no están configurados en las variables de entorno. La integración con Webpay fallará.'
  );
}

const headers = {
  'Tbk-Api-Key-Id': TbkApiKeyId,
  'Tbk-Api-Key-Secret': TbkApiKeySecret,
  'Content-Type': 'application/json',
};

/**
 * Inicia una transacción en Webpay Plus REST.
 * @param {number} monto - Monto total del pedido (en CLP).
 * @param {string} ordenCompra - Identificador único de la orden de compra (tu Codigo_Pedido).
 * @param {string} sessionId - Identificador de la sesión del usuario.
 * @param {string} returnUrl - URL a la que Webpay redirigirá tras el pago.
 * @returns {Promise<{token: string, urlRedireccion: string}>}
 * @throws {Error} - Si falla la petición a Webpay.
 */
const iniciarTransaccion = async (monto, ordenCompra, sessionId, returnUrl) => {
  if (!TbkApiKeyId || !TbkApiKeySecret) {
    throw new Error('Credenciales de Webpay no configuradas para iniciar transacción.');
  }
  const payload = {
    buy_order: ordenCompra,
    session_id: sessionId,
    amount: monto,
    return_url: returnUrl,
  };

  try {
    console.log(`[WebpayService] Iniciando transacción en ${CURRENT_WEBPAY_URL}/transactions con payload:`, payload);
    const response = await axios.post(
      `${CURRENT_WEBPAY_URL}/transactions`,
      payload,
      { headers }
    );
    console.log('[WebpayService] Respuesta de inicio de transacción:', response.data);
    if (!response.data || !response.data.token || !response.data.url) {
        throw new Error('Respuesta inesperada de Webpay al iniciar transacción.');
    }
    return { token: response.data.token, urlRedireccion: response.data.url };
  } catch (error) {
    console.error('[WebpayService] Error al iniciar transacción:', error.response?.data || error.message);
    throw new Error(`Error al iniciar transacción con Webpay: ${error.response?.data?.error_message || error.message}`);
  }
};

/**
 * Confirma una transacción en Webpay Plus REST.
 * @param {string} tokenWs - El token_ws recibido en la URL de retorno.
 * @returns {Promise<object>} - La respuesta completa de la confirmación de Webpay.
 * @throws {Error} - Si falla la petición a Webpay.
 */
const confirmarTransaccion = async (tokenWs) => {
  if (!TbkApiKeyId || !TbkApiKeySecret) {
    throw new Error('Credenciales de Webpay no configuradas para confirmar transacción.');
  }
  if (!tokenWs) {
    throw new Error('token_ws es requerido para confirmar la transacción.');
  }

  try {
    console.log(`[WebpayService] Confirmando transacción en ${CURRENT_WEBPAY_URL}/transactions/${tokenWs}`);
    // La confirmación en Webpay Plus REST es un PUT sin body
    const response = await axios.put(
      `${CURRENT_WEBPAY_URL}/transactions/${tokenWs}`,
      {}, // Body vacío
      { headers }
    );
    console.log('[WebpayService] Respuesta de confirmación de transacción:', response.data);
    if (!response.data) {
         throw new Error('Respuesta inesperada de Webpay al confirmar transacción.');
    }
    return response.data; // Contiene el estado, detalles del pago, etc.
  } catch (error) {
    console.error('[WebpayService] Error al confirmar transacción:', error.response?.data || error.message);
    throw new Error(`Error al confirmar transacción con Webpay: ${error.response?.data?.error_message || error.message}`);
  }
};

// Puedes añadir otras funciones aquí como anularTransaccion (refund), obtenerEstado, etc.

module.exports = {
  iniciarTransaccion,
  confirmarTransaccion,
};
