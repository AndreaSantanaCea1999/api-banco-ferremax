const axios = require('axios');

const { getConfig } = require('../config/config'); // Esta línea ahora debería funcionar

async function getDolarRate() {
    const appConfig = getConfig(); // Usar getConfig para obtener las URLs y keys
    const apiKey = process.env.BANCO_API_KEY || appConfig.bancoApiKey;
    const apiUrl = process.env.BANCO_API_URL || appConfig.bancoApiUrl;

    // Simulación de llamada a API o mock
    if (!apiUrl || !apiKey) {
        console.warn('[BancoCentralService] BANCO_API_URL o BANCO_API_KEY no configuradas. Usando valor mockeado para tasa de dólar.');
        const today = new Date();
        const mockDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        return { fecha: mockDate, valor: 930.50 }; // Devuelve un objeto
    }

    try {
        const response = await axios.get(`${apiUrl}?apikey=${apiKey}&formato=json`);

        if (response.data && response.data.Dolares && response.data.Dolares.length > 0) {
            const infoDolar = response.data.Dolares[0];
            const valorStr = infoDolar.Valor.replace('.', '').replace(',', '.');
            return { fecha: infoDolar.Fecha, valor: parseFloat(valorStr) };
        } else {
            throw new Error('Respuesta inesperada o vacía de la API del Banco Central.');
        }

    } catch (error) {
        console.error("Error al obtener tasa del dólar desde el servicio:", error.message);
        throw new Error('No se pudo obtener la tasa del dólar del servicio externo.');
    }
}

module.exports = { getDolarRate };
