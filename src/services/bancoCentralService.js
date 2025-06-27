// src/services/bancoCentralService.js
// Servicio completo para integración con Banco Central según documento FERREMAS

const axios = require('axios');
const { TiposCambio, Divisas } = require('../models');

// Configuración para múltiples fuentes de datos financieros
const FUENTES_DATOS = {
  mindicador: {
    baseUrl: 'https://mindicador.cl/api',
    timeout: 8000,
    descripcion: 'Mindicador.cl'
  },
  banco_central: {
    baseUrl: 'https://api.sbif.cl/api-sbifv3/recursos_api',
    apiKey: process.env.BANCO_API_KEY || '9974f2b8c5544bc35bc1c8a970ab4a2adec5a85f',
    timeout: 10000,
    descripcion: 'Banco Central de Chile'
  },
  fixer: {
    baseUrl: 'https://api.fixer.io/v1',
    apiKey: process.env.FIXER_API_KEY,
    timeout: 8000,
    descripcion: 'Fixer.io'
  }
};

// Cache en memoria para tipos de cambio (válido por 1 hora)
const cacheTypesExchange = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

/**
 * Obtener tipo de cambio USD/CLP desde múltiples fuentes
 */
async function obtenerTipoCambioUSD() {
  try {
    console.log('💱 [obtenerTipoCambioUSD] Consultando fuentes externas...');
    
    // Intentar con Mindicador.cl primero
    try {
      const response = await axios.get(`${FUENTES_DATOS.mindicador.baseUrl}/dolar`, {
        timeout: FUENTES_DATOS.mindicador.timeout,
        headers: { 'User-Agent': 'FERREMAS-API/1.0' }
      });

      if (response.data && response.data.serie && response.data.serie.length > 0) {
        const ultimoDolar = response.data.serie[0];
        
        return {
          success: true,
          valor: parseFloat(ultimoDolar.valor),
          fecha: ultimoDolar.fecha,
          fuente: 'Mindicador.cl',
          moneda_origen: 'USD',
          moneda_destino: 'CLP'
        };
      }
    } catch (error) {
      console.warn('⚠️ Mindicador.cl no disponible:', error.message);
    }

    // Intentar con API del Banco Central
    try {
      const response = await axios.get(`${FUENTES_DATOS.banco_central.baseUrl}/dolar`, {
        timeout: FUENTES_DATOS.banco_central.timeout,
        headers: {
          'User-Agent': 'FERREMAS-API/1.0',
          'Authorization': `Bearer ${FUENTES_DATOS.banco_central.apiKey}`
        }
      });

      if (response.data && response.data.Dolares && response.data.Dolares.length > 0) {
        const ultimoDolar = response.data.Dolares[0];
        
        return {
          success: true,
          valor: parseFloat(ultimoDolar.Valor.replace(',', '.')),
          fecha: ultimoDolar.Fecha,
          fuente: 'Banco Central de Chile',
          moneda_origen: 'USD',
          moneda_destino: 'CLP'
        };
      }
    } catch (error) {
      console.warn('⚠️ Banco Central no disponible:', error.message);
    }

    // Fallback: valor simulado para desarrollo
    console.warn('⚠️ Todas las fuentes externas fallaron, usando valor simulado');
    
    return {
      success: true,
      valor: 950.75 + (Math.random() * 20 - 10), // Simular variación
      fecha: new Date().toISOString().split('T')[0],
      fuente: 'Simulado (APIs externas no disponibles)',
      moneda_origen: 'USD',
      moneda_destino: 'CLP',
      simulado: true
    };

  } catch (error) {
    console.error('❌ Error obteniendo tipo de cambio USD:', error);
    throw new Error('No se pudo obtener tipo de cambio USD/CLP');
  }
}

/**
 * Obtener tipo de cambio EUR/CLP
 */
async function obtenerTipoCambioEUR() {
  try {
    console.log('💱 [obtenerTipoCambioEUR] Consultando fuentes externas...');
    
    // Intentar con Mindicador.cl
    try {
      const response = await axios.get(`${FUENTES_DATOS.mindicador.baseUrl}/euro`, {
        timeout: FUENTES_DATOS.mindicador.timeout,
        headers: { 'User-Agent': 'FERREMAS-API/1.0' }
      });

      if (response.data && response.data.serie && response.data.serie.length > 0) {
        const ultimoEuro = response.data.serie[0];
        
        return {
          success: true,
          valor: parseFloat(ultimoEuro.valor),
          fecha: ultimoEuro.fecha,
          fuente: 'Mindicador.cl',
          moneda_origen: 'EUR',
          moneda_destino: 'CLP'
        };
      }
    } catch (error) {
      console.warn('⚠️ Mindicador.cl EUR no disponible:', error.message);
    }

    // Calcular EUR desde USD (aproximación)
    const usdData = await obtenerTipoCambioUSD();
    const eurApprox = usdData.valor * 1.08; // EUR ≈ USD * 1.08

    return {
      success: true,
      valor: Math.round(eurApprox * 100) / 100,
      fecha: usdData.fecha,
      fuente: 'Calculado desde USD (aproximación)',
      moneda_origen: 'EUR',
      moneda_destino: 'CLP',
      calculado: true
    };

  } catch (error) {
    console.error('❌ Error obteniendo tipo de cambio EUR:', error);
    throw new Error('No se pudo obtener tipo de cambio EUR/CLP');
  }
}

/**
 * Obtener todos los tipos de cambio actuales
 */
async function obtenerTodosTiposCambio() {
  try {
    const cacheKey = 'todos_tipos_cambio';
    const cached = cacheTypesExchange.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('📱 Usando tipos de cambio desde cache');
      return cached.data;
    }

    console.log('💱 [obtenerTodosTiposCambio] Consultando múltiples divisas...');
    
    const [usdData, eurData] = await Promise.all([
      obtenerTipoCambioUSD().catch(err => ({ error: err.message })),
      obtenerTipoCambioEUR().catch(err => ({ error: err.message }))
    ]);

    const resultado = {
      timestamp: new Date().toISOString(),
      moneda_base: 'CLP',
      tipos_cambio: {
        USD: usdData.success ? {
          valor: usdData.valor,
          fecha: usdData.fecha,
          fuente: usdData.fuente,
          simulado: usdData.simulado || false
        } : { error: usdData.error },
        
        EUR: eurData.success ? {
          valor: eurData.valor,
          fecha: eurData.fecha,
          fuente: eurData.fuente,
          calculado: eurData.calculado || false
        } : { error: eurData.error }
      }
    };

    // Guardar en cache
    cacheTypesExchange.set(cacheKey, {
      data: resultado,
      timestamp: Date.now()
    });

    return resultado;

  } catch (error) {
    console.error('❌ Error obteniendo todos los tipos de cambio:', error);
    throw error;
  }
}

/**
 * Convertir monto entre divisas
 * Soporta: CLP, USD, EUR
 */
async function convertirDivisa(monto, divisaOrigen, divisaDestino) {
  try {
    console.log(`💱 [convertirDivisa] ${monto} ${divisaOrigen} → ${divisaDestino}`);

    // Validaciones
    if (!monto || monto <= 0) {
      throw new Error('Monto debe ser mayor a 0');
    }

    const divisasValidas = ['CLP', 'USD', 'EUR'];
    if (!divisasValidas.includes(divisaOrigen) || !divisasValidas.includes(divisaDestino)) {
      throw new Error(`Divisas soportadas: ${divisasValidas.join(', ')}`);
    }

    // Si es la misma divisa, no hay conversión
    if (divisaOrigen === divisaDestino) {
      return {
        success: true,
        monto_original: monto,
        monto_convertido: monto,
        divisa_origen: divisaOrigen,
        divisa_destino: divisaDestino,
        tasa_cambio: 1,
        fecha_conversion: new Date().toISOString(),
        mensaje: 'Misma divisa, no requiere conversión'
      };
    }

    // Obtener tipos de cambio actuales
    const tiposCambio = await obtenerTodosTiposCambio();
    let tasaConversion = 1;
    let rutaConversion = 'Directo';

    // Lógica de conversión
    if (divisaOrigen === 'CLP' && divisaDestino === 'USD') {
      // CLP → USD
      if (tiposCambio.tipos_cambio.USD.error) {
        throw new Error('No se pudo obtener tasa USD/CLP');
      }
      tasaConversion = 1 / tiposCambio.tipos_cambio.USD.valor;
      
    } else if (divisaOrigen === 'USD' && divisaDestino === 'CLP') {
      // USD → CLP
      if (tiposCambio.tipos_cambio.USD.error) {
        throw new Error('No se pudo obtener tasa USD/CLP');
      }
      tasaConversion = tiposCambio.tipos_cambio.USD.valor;
      
    } else if (divisaOrigen === 'CLP' && divisaDestino === 'EUR') {
      // CLP → EUR
      if (tiposCambio.tipos_cambio.EUR.error) {
        throw new Error('No se pudo obtener tasa EUR/CLP');
      }
      tasaConversion = 1 / tiposCambio.tipos_cambio.EUR.valor;
      
    } else if (divisaOrigen === 'EUR' && divisaDestino === 'CLP') {
      // EUR → CLP
      if (tiposCambio.tipos_cambio.EUR.error) {
        throw new Error('No se pudo obtener tasa EUR/CLP');
      }
      tasaConversion = tiposCambio.tipos_cambio.EUR.valor;
      
    } else if (divisaOrigen === 'USD' && divisaDestino === 'EUR') {
      // USD → EUR (vía CLP)
      if (tiposCambio.tipos_cambio.USD.error || tiposCambio.tipos_cambio.EUR.error) {
        throw new Error('No se pudieron obtener tasas para conversión USD/EUR');
      }
      const usdToCLP = tiposCambio.tipos_cambio.USD.valor;
      const clpToEur = 1 / tiposCambio.tipos_cambio.EUR.valor;
      tasaConversion = usdToCLP * clpToEur;
      rutaConversion = 'USD → CLP → EUR';
      
    } else if (divisaOrigen === 'EUR' && divisaDestino === 'USD') {
      // EUR → USD (vía CLP)
      if (tiposCambio.tipos_cambio.USD.error || tiposCambio.tipos_cambio.EUR.error) {
        throw new Error('No se pudieron obtener tasas para conversión EUR/USD');
      }
      const eurToCLP = tiposCambio.tipos_cambio.EUR.valor;
      const clpToUsd = 1 / tiposCambio.tipos_cambio.USD.valor;
      tasaConversion = eurToCLP * clpToUsd;
      rutaConversion = 'EUR → CLP → USD';
    }

    const montoConvertido = monto * tasaConversion;

    // Guardar en base de datos para historial
    try {
      await guardarTipoCambioEnBD(divisaOrigen, divisaDestino, tasaConversion);
    } catch (error) {
      console.warn('⚠️ No se pudo guardar en BD:', error.message);
    }

    return {
      success: true,
      monto_original: parseFloat(monto),
      monto_convertido: Math.round(montoConvertido * 100) / 100,
      divisa_origen: divisaOrigen,
      divisa_destino: divisaDestino,
      tasa_cambio: Math.round(tasaConversion * 10000) / 10000,
      ruta_conversion: rutaConversion,
      fecha_conversion: new Date().toISOString(),
      fuentes_utilizadas: tiposCambio.tipos_cambio,
      cache_utilizado: false
    };

  } catch (error) {
    console.error('❌ Error en conversión de divisa:', error);
    throw error;
  }
}

/**
 * Guardar tipo de cambio en base de datos
 */
async function guardarTipoCambioEnBD(codigoOrigen, codigoDestino, tasa) {
  try {
    // Buscar IDs de divisas
    const divisaOrigen = await Divisas.findOne({ where: { Codigo: codigoOrigen } });
    const divisaDestino = await Divisas.findOne({ where: { Codigo: codigoDestino } });

    if (!divisaOrigen || !divisaDestino) {
      throw new Error(`Divisas no encontradas en BD: ${codigoOrigen}, ${codigoDestino}`);
    }

    const fechaHoy = new Date();
    fechaHoy.setHours(0, 0, 0, 0);

    // Crear o actualizar registro
    const [tipoCambio, created] = await TiposCambio.findOrCreate({
      where: {
        ID_Divisa_Origen: divisaOrigen.ID_Divisa,
        ID_Divisa_Destino: divisaDestino.ID_Divisa,
        Fecha: fechaHoy
      },
      defaults: {
        Tasa_Cambio: tasa,
        Fuente: 'API FERREMAS'
      }
    });

    if (!created && Math.abs(parseFloat(tipoCambio.Tasa_Cambio) - tasa) > 0.01) {
      await tipoCambio.update({ Tasa_Cambio: tasa });
    }

    return tipoCambio;

  } catch (error) {
    console.error('Error guardando tipo de cambio en BD:', error);
    throw error;
  }
}

/**
 * Limpiar cache manualmente
 */
function limpiarCache() {
  cacheTypesExchange.clear();
  console.log('🧹 Cache de tipos de cambio limpiado');
}

module.exports = {
  obtenerTipoCambioUSD,
  obtenerTipoCambioEUR,
  obtenerTodosTiposCambio,
  convertirDivisa,
  guardarTipoCambioEnBD,
  limpiarCache
};