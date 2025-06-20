// src/services/bancoCentralService.js
const axios = require('axios');

const BANCO_CENTRAL_CONFIG = {
  baseUrl: 'https://api.cmfchile.cl/api-sbifv3/recursos_api',
  apiKey: process.env.BANCO_API_KEY || '9974f2b8c5544bc35bc1c8a970ab4a2adec5a85f',
  timeout: 10000
};

// Obtener tipo de cambio USD/CLP desde Banco Central Chile
async function obtenerTipoCambioUSD() {
  try {
    console.log('💱 [obtenerTipoCambioUSD] Consultando Banco Central Chile...');
    
    const response = await axios.get(`${BANCO_CENTRAL_CONFIG.baseUrl}/dolar`, {
      headers: {
        'User-Agent': 'FERREMAS-API/1.0'
      },
      timeout: BANCO_CENTRAL_CONFIG.timeout
    });

    if (response.data && response.data.Dolares && response.data.Dolares.length > 0) {
      const ultimoDolar = response.data.Dolares[0];
      
      return {
        success: true,
        divisa: 'USD',
        moneda_nacional: 'CLP',
        valor: parseFloat(ultimoDolar.Valor.replace(',', '.')),
        fecha: ultimoDolar.Fecha,
        fuente: 'Banco Central de Chile'
      };
    } else {
      throw new Error('Formato de respuesta inesperado del Banco Central');
    }
    
  } catch (error) {
    console.warn('⚠️ Error consultando Banco Central, usando valor simulado:', error.message);
    
    // Fallback simulado para desarrollo/testing
    return {
      success: true,
      divisa: 'USD',
      moneda_nacional: 'CLP',
      valor: 950.75, // Valor aproximado para testing
      fecha: new Date().toISOString().split('T')[0],
      fuente: 'Simulado (Banco Central no disponible)',
      simulado: true
    };
  }
}

// Obtener múltiples tipos de cambio
async function obtenerTiposCambio() {
  try {
    console.log('💱 [obtenerTiposCambio] Consultando múltiples divisas...');
    
    const resultados = {
      timestamp: new Date().toISOString(),
      moneda_base: 'CLP',
      tasas: {}
    };

    // USD (principal desde Banco Central)
    const usd = await obtenerTipoCambioUSD();
    resultados.tasas.USD = usd;

    // EUR (calculado desde USD - aproximación)
    resultados.tasas.EUR = {
      success: true,
      divisa: 'EUR',
      moneda_nacional: 'CLP',
      valor: Math.round(usd.valor * 1.1 * 100) / 100, // EUR ≈ USD * 1.1
      fecha: usd.fecha,
      fuente: 'Calculado desde USD (Banco Central)',
      simulado: true
    };

    return {
      success: true,
      data: resultados
    };
    
  } catch (error) {
    console.error('❌ Error obteniendo tipos de cambio:', error.message);
    throw error;
  }
}

// Convertir monto entre divisas
async function convertirDivisa(monto, divisaOrigen, divisaDestino) {
  try {
    console.log(`💱 [convertirDivisa] ${monto} ${divisaOrigen} → ${divisaDestino}`);

    // Si es la misma divisa, no hay conversión
    if (divisaOrigen === divisaDestino) {
      return {
        success: true,
        monto_original: monto,
        divisa_origen: divisaOrigen,
        monto_convertido: monto,
        divisa_destino: divisaDestino,
        tasa_cambio: 1,
        fecha_conversion: new Date().toISOString()
      };
    }

    const tiposCambio = await obtenerTiposCambio();
    let tasaConversion = 1;
    let fuenteTasa = 'Directo';

    // Lógica de conversión
    if (divisaOrigen === 'CLP' && divisaDestino === 'USD') {
      // CLP → USD
      tasaConversion = 1 / tiposCambio.data.tasas.USD.valor;
    } else if (divisaOrigen === 'USD' && divisaDestino === 'CLP') {
      // USD → CLP
      tasaConversion = tiposCambio.data.tasas.USD.valor;
    } else if (divisaOrigen === 'CLP' && divisaDestino === 'EUR') {
      // CLP → EUR
      tasaConversion = 1 / tiposCambio.data.tasas.EUR.valor;
    } else if (divisaOrigen === 'EUR' && divisaDestino === 'CLP') {
      // EUR → CLP
      tasaConversion = tiposCambio.data.tasas.EUR.valor;
    } else if (divisaOrigen === 'USD' && divisaDestino === 'EUR') {
      // USD → EUR (vía CLP)
      const usdToCLP = tiposCambio.data.tasas.USD.valor;
      const clpToEur = 1 / tiposCambio.data.tasas.EUR.valor;
      tasaConversion = usdToCLP * clpToEur;
      fuenteTasa = 'Calculado vía CLP';
    } else if (divisaOrigen === 'EUR' && divisaDestino === 'USD') {
      // EUR → USD (vía CLP)
      const eurToCLP = tiposCambio.data.tasas.EUR.valor;
      const clpToUsd = 1 / tiposCambio.data.tasas.USD.valor;
      tasaConversion = eurToCLP * clpToUsd;
      fuenteTasa = 'Calculado vía CLP';
    } else {
      throw new Error(`Conversión no soportada: ${divisaOrigen} → ${divisaDestino}`);
    }

    const montoConvertido = monto * tasaConversion;

    return {
      success: true,
      monto_original: monto,
      divisa_origen: divisaOrigen,
      monto_convertido: Math.round(montoConvertido * 100) / 100, // 2 decimales
      divisa_destino: divisaDestino,
      tasa_cambio: Math.round(tasaConversion * 10000) / 10000, // 4 decimales
      fuente_tasa: fuenteTasa,
      fecha_conversion: new Date().toISOString(),
      tipos_cambio_referencia: tiposCambio.data.tasas
    };
    
  } catch (error) {
    console.error('❌ Error convirtiendo divisa:', error.message);
    throw error;
  }
}

module.exports = {
  obtenerTipoCambioUSD,
  obtenerTiposCambio,
  convertirDivisa
};