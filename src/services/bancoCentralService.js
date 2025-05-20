const axios = require('axios');
const { Divisas, TiposCambio } = require('../models');
const { Op } = require('sequelize');

// Esta es una simulación de la API del Banco Central
// En producción, deberías usar la API oficial del Banco Central de Chile

const BANCO_CENTRAL_API_URL = process.env.BANCO_CENTRAL_API_URL || 'https://api.bancacentral.cl';
const BANCO_CENTRAL_API_KEY = process.env.BANCO_CENTRAL_API_KEY || 'api_key_simulada';

// Obtener tipo de cambio entre dos divisas
const obtenerTipoCambio = async (codigoOrigen, codigoDestino, fecha) => {
  try {
    if (codigoOrigen === codigoDestino) {
      return 1.0; // Misma divisa, tasa 1:1
    }
    
    // Si estamos en desarrollo, simulamos tasas de cambio
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SIMULACIÓN] Obteniendo tipo de cambio de ${codigoOrigen} a ${codigoDestino} para fecha ${fecha}`);
      
      // Tasas simuladas para pares comunes
      const tasasSimuladas = {
        'CLP-USD': 0.0011,
        'USD-CLP': 900.50,
        'CLP-EUR': 0.00095,
        'EUR-CLP': 950.25,
        'USD-EUR': 0.92,
        'EUR-USD': 1.09
      };
      
      const par = `${codigoOrigen}-${codigoDestino}`;
      
      if (tasasSimuladas[par]) {
        return tasasSimuladas[par];
      } else {
        // Generar una tasa simulada entre 0.5 y 1.5
        return 0.5 + Math.random();
      }
    } else {
      // En producción, llamamos a la API real del Banco Central
      const response = await axios.get(`${BANCO_CENTRAL_API_URL}/exchange-rates`, {
        params: {
          from: codigoOrigen,
          to: codigoDestino,
          date: fecha.toISOString().split('T')[0] // Formato YYYY-MM-DD
        },
        headers: {
          'X-API-KEY': BANCO_CENTRAL_API_KEY
        }
      });
      
      return response.data.rate;
    }
  } catch (error) {
    console.error('Error al obtener tipo de cambio:', error);
    throw new Error('Error al obtener el tipo de cambio');
  }
};

// Convertir un monto entre dos divisas
const convertirMonto = async (monto, codigoOrigen, codigoDestino, fecha) => {
  try {
    // Obtener tipo de cambio
    const tasaCambio = await obtenerTipoCambio(codigoOrigen, codigoDestino, fecha);
    
    // Calcular monto convertido
    const montoConvertido = monto * tasaCambio;
    
    return {
      montoConvertido,
      tasaCambio
    };
  } catch (error) {
    console.error('Error al convertir monto:', error);
    throw new Error('Error al convertir el monto entre divisas');
  }
};

// Actualizar todos los tipos de cambio (tarea programada)
const actualizarTiposCambio = async () => {
  try {
    // Obtener todas las divisas
    const divisas = await Divisas.findAll();
    
    if (divisas.length < 2) {
      throw new Error('Se requieren al menos dos divisas para actualizar tipos de cambio');
    }
    
    const resultados = {
      actualizados: 0,
      errores: 0
    };
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Para cada par de divisas, actualizar tipo de cambio
    for (let i = 0; i < divisas.length; i++) {
      for (let j = 0; j < divisas.length; j++) {
        if (i !== j) { // No actualizar para la misma divisa
          try {
            const divisaOrigen = divisas[i];
            const divisaDestino = divisas[j];
            
            // Verificar si ya existe un tipo de cambio para hoy
            const existente = await TiposCambio.findOne({
              where: {
                ID_Divisa_Origen: divisaOrigen.ID_Divisa,
                ID_Divisa_Destino: divisaDestino.ID_Divisa,
                Fecha: {
                  [Op.gte]: hoy
                }
              }
            });
            
            // Si no existe, crear uno nuevo
            if (!existente) {
              const tasaCambio = await obtenerTipoCambio(divisaOrigen.Codigo, divisaDestino.Codigo, hoy);
              
              await TiposCambio.create({
                ID_Divisa_Origen: divisaOrigen.ID_Divisa,
                ID_Divisa_Destino: divisaDestino.ID_Divisa,
                Fecha: hoy,
                Tasa_Cambio: tasaCambio,
                Fuente: 'Banco Central de Chile'
              });
              
              resultados.actualizados++;
            }
          } catch (error) {
            console.error(`Error al actualizar tipo de cambio: ${error.message}`);
            resultados.errores++;
          }
        }
      }
    }
    
    return resultados;
  } catch (error) {
    console.error('Error al actualizar tipos de cambio:', error);
    throw new Error('Error al actualizar los tipos de cambio');
  }
};

module.exports = {
  obtenerTipoCambio,
  convertirMonto,
  actualizarTiposCambio
};