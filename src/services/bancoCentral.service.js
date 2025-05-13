// c:\Users\andre\api-banco-ferremax\src\services\bancoCentral.service.js

const axios = require('axios');

const BANCO_API_URL = process.env.BANCO_API_URL;
const BANCO_API_KEY = process.env.BANCO_API_KEY;

if (!BANCO_API_URL || !BANCO_API_KEY) {
  console.warn('ADVERTENCIA: BANCO_API_URL o BANCO_API_KEY no están configuradas en .env. La funcionalidad de divisas podría fallar.');
}

/**
 * Obtiene la tasa de cambio actual del dólar desde la API del Banco Central de Chile (CMF).
 * @returns {Promise<number>} - El valor del dólar en CLP.
 * @throws {Error} - Si falla la petición o la respuesta no tiene el formato esperado.
 */
const getDolarRate = async () => {
  if (!BANCO_API_URL || !BANCO_API_KEY) {
    throw new Error('Configuración de API del Banco Central incompleta.');
  }

  try {
    // La URL de la CMF para el dólar suele ser algo como:
    // https://api.cmfchile.cl/api-sbifv3/recursos_api/dolar?apikey=TU_API_KEY&formato=json
    const url = `${BANCO_API_URL}?apikey=${BANCO_API_KEY}&formato=json`;
    const response = await axios.get(url);

    // La estructura de respuesta típica es { Dolares: [{ Fecha: 'YYYY-MM-DD', Valor: 'XXX.XX' }] }
    if (response.data && response.data.Dolares && response.data.Dolares.length > 0) {
      const valorString = response.data.Dolares[0].Valor;
      // Reemplazar coma por punto para asegurar que parseFloat funcione correctamente
      const valorNumerico = parseFloat(valorString.replace(',', '.'));
      if (isNaN(valorNumerico)) {
        throw new Error('El valor del dólar recibido no es un número válido.');
      }
      return valorNumerico;
    } else {
      throw new Error('Respuesta inesperada de la API del Banco Central.');
    }

  } catch (error) {
    console.error('Error en bancoCentralService.getDolarRate:', error.response?.data || error.message);
    throw new Error(`Error al obtener tasa de dólar: ${error.response?.data?.message || error.message}`);
  }
};

module.exports = {
  getDolarRate,
};
