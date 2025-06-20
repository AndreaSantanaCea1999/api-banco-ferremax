require('dotenv').config();
const express = require('express');
const { TiposCambio, Divisas, sequelize } = require('./src/models');
const axios = require('axios');

const app = express();
app.use(express.json()); 

const { PORT = 3001, BANCO_API_URL: BASE_URL, BANCO_API_KEY: API_KEY } = process.env;

// Verificación de variables de entorno críticas al inicio
if (!BASE_URL) {
  console.error("FATAL ERROR: La variable de entorno BANCO_API_URL no está definida. La aplicación no puede iniciar.");
  process.exit(1); // Detiene la aplicación si la configuración es inválida
}

// 🔽 NUEVOS ENDPOINTS SOLICITADOS
// Convertir divisas
app.post('/api/v1/convertir', async (req, res) => {
  const { monedaOrigen, monedaDestino, monto } = req.body;

  if (!monedaOrigen || !monedaDestino || monto == null) {
    return res.status(400).json({ message: 'Faltan parámetros: se requiere monedaOrigen, monedaDestino y monto.' });
  }

  if (typeof monto !== 'number' || monto <= 0) {
    return res.status(400).json({ message: 'El parámetro "monto" debe ser un número positivo.' });
  }

  if (monedaOrigen === monedaDestino) {
    return res.json({ montoOriginal: monto, monedaOrigen, montoConvertido: monto, monedaDestino, tasaUtilizada: 1 });
  }

  try {
    // Para conversiones cruzadas (ej. USD -> EUR), necesitamos ambas tasas contra CLP
    const [tasaOrigen, tasaDestino] = await Promise.all([
      monedaOrigen === 'CLP' ? Promise.resolve({ Tasa_Cambio: 1 }) : getLatestExchangeRate(monedaOrigen, 'CLP'),
      monedaDestino === 'CLP' ? Promise.resolve({ Tasa_Cambio: 1 }) : getLatestExchangeRate(monedaDestino, 'CLP')
    ]);

    if (!tasaOrigen) {
      return res.status(404).json({ message: `No se encontró tasa de cambio para el par ${monedaOrigen}/CLP.` });
    }
    if (!tasaDestino) {
      return res.status(404).json({ message: `No se encontró tasa de cambio para el par ${monedaDestino}/CLP.` });
    }

    // Convertimos el monto original a CLP y luego a la moneda de destino
    const montoEnCLP = monto * tasaOrigen.Tasa_Cambio;
    const montoFinal = montoEnCLP / tasaDestino.Tasa_Cambio;

    res.json({
      montoOriginal: monto,
      monedaOrigen,
      montoConvertido: parseFloat(montoFinal.toFixed(2)),
      monedaDestino,
      tasaUtilizada: parseFloat((tasaOrigen.Tasa_Cambio / tasaDestino.Tasa_Cambio).toFixed(6)),
      fechaTasa: tasaOrigen.Fecha || tasaDestino.Fecha,
    });
  } catch (error) {
    console.error("Error en la conversión de divisas:", error);
    res.status(500).json({ message: 'Error interno al realizar la conversión.', error: error.message });
  }
});

// Convertir carrito de compras
app.post('/api/v1/carrito/convertir', async (req, res) => {
  // Para FERREMAS ecommerce
  res.status(501).json({ message: 'Conversión de carrito aún no implementada.' });
});

// Obtener tasas actuales para frontend
app.get('/api/v1/indicadores', async (req, res) => {
  try {
    // Ejecutamos ambas consultas en paralelo para mayor eficiencia
    const [usd, eur] = await Promise.all([
      getLatestExchangeRate('USD', 'CLP'),
      getLatestExchangeRate('EUR', 'CLP')
    ]);

    res.json({
      usd: usd ? { valor: usd.Tasa_Cambio, fecha: usd.Fecha } : null,
      eur: eur ? { valor: eur.Tasa_Cambio, fecha: eur.Fecha } : null
    });
  } catch (error) {
    console.error("Error al obtener indicadores:", error);
    res.status(500).json({ message: 'Error al obtener indicadores', error: error.message });
  }
});
// 🔼 FIN BLOQUE NUEVO

/**
 * Busca en la base de datos el tipo de cambio más reciente para un par de divisas.
 * @param {string} codigoMonedaOrigen - El código de la moneda de origen (ej. 'USD').
 * @param {string} codigoMonedaDestino - El código de la moneda de destino (ej. 'CLP').
 * @returns {Promise<TiposCambio|null>} El objeto del tipo de cambio o null si no se encuentra.
 */
async function getLatestExchangeRate(codigoMonedaOrigen, codigoMonedaDestino) {
  const divisaOrigen = await Divisas.findOne({ where: { Codigo: codigoMonedaOrigen } });
  const divisaDestino = await Divisas.findOne({ where: { Codigo: codigoMonedaDestino } });

  if (!divisaOrigen || !divisaDestino) {
    throw new Error(`Una o ambas divisas no se encontraron en la BD: ${codigoMonedaOrigen}, ${codigoMonedaDestino}`);
  }

  return TiposCambio.findOne({
    where: {
      ID_Divisa_Origen: divisaOrigen.ID_Divisa,
      ID_Divisa_Destino: divisaDestino.ID_Divisa,
    },
    order: [['Fecha', 'DESC']],
  });
}

async function obtenerValorDesdeAPI(endpoint, monedaKey) {
  if (!BASE_URL) { // API_KEY no es necesaria para mindicador.cl
    console.error('Error: BANCO_API_URL no está configurada.');
    return { success: false, message: 'Configuración de API externa incompleta.' };
  }

  try {
    const URL_COMPLETA = `${BASE_URL}/${endpoint}`; // mindicador.cl no usa apikey ni formato en la URL
    console.log(`Consultando URL externa: ${URL_COMPLETA}`);
    const respuesta = await axios.get(URL_COMPLETA, { timeout: 10000 });

    // mindicador.cl devuelve el valor directamente bajo la clave de la moneda (ej. 'dolar', 'euro')
    // y el valor es un número, no una cadena con coma.
    // La respuesta real de mindicador.cl contiene un array "serie". El primer elemento es el más reciente.
    if (respuesta.data && Array.isArray(respuesta.data.serie) && respuesta.data.serie.length > 0) {
      const registroReciente = respuesta.data.serie[0];
      const valorNumerico = registroReciente.valor;
      const fechaExterna = registroReciente.fecha;

      console.log(`Valor de ${monedaKey} (numérico) desde API externa:`, valorNumerico, 'Fecha API:', fechaExterna);
      return { success: true, valor: valorNumerico, fecha: fechaExterna };
    } else {
      console.error('Error: La respuesta de la API externa no tiene el formato esperado para mindicador.cl.');
      console.log('Respuesta completa de la API externa:', respuesta.data);
      return { success: false, message: 'Formato de respuesta de API externa inesperado.', apiResponse: respuesta.data };
    }
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error(`Error al obtener el valor de ${monedaKey} de mindicador.cl: Timeout - La solicitud tardó demasiado.`);
    } else {
      console.error(`Error al obtener el valor de ${monedaKey} de mindicador.cl:`, error.response ? (error.response.data || error.message) : error.message);
    }
    return { success: false, message: 'Error al conectar con API externa.', errorDetail: error.response ? (error.response.data || error.message) : error.message };
  }
}

async function guardarActualizarTipoCambioEnDB(valor, fechaApi, codigoMonedaOrigen = 'USD', codigoMonedaDestino = 'CLP') {
  try {
    const divisaOrigen = await Divisas.findOne({ where: { Codigo: codigoMonedaOrigen } });
    const divisaDestino = await Divisas.findOne({ where: { Codigo: codigoMonedaDestino } });

    if (!divisaOrigen || !divisaDestino) {
      const errorMessage = `Error: Divisa ${codigoMonedaOrigen} o ${codigoMonedaDestino} no encontrada en la base de datos.`;
      console.error(errorMessage);
      return { success: false, message: errorMessage };
    }

    let fechaParaGuardar = new Date(fechaApi);
    if (isNaN(fechaParaGuardar.getTime())) {
      console.error(`Fecha inválida recibida de la API: ${fechaApi}`);
      return { success: false, message: `Fecha inválida recibida de la API: ${fechaApi}` };
    }

    // Estandarizar la fecha al inicio del día (medianoche UTC) para evitar problemas de precisión y duplicados.
    fechaParaGuardar.setUTCHours(0, 0, 0, 0);

    const [tipoCambio, created] = await TiposCambio.findOrCreate({
      where: {
        ID_Divisa_Origen: divisaOrigen.ID_Divisa,
        ID_Divisa_Destino: divisaDestino.ID_Divisa,
        Fecha: fechaParaGuardar,
      },
      defaults: {
        Tasa_Cambio: valor,
        Fuente: 'mindicador.cl'
      }
    });

    if (created) {
      console.log(`Tipo de cambio ${codigoMonedaOrigen}/${codigoMonedaDestino} guardado en BD: ${valor} para fecha ${fechaParaGuardar.toISOString().split('T')[0]}`);
      return { success: true, data: tipoCambio, created: true, message: 'Tipo de cambio guardado.' };
    } else if (Math.abs(parseFloat(tipoCambio.Tasa_Cambio) - valor) > 1e-4 || tipoCambio.Fuente !== 'mindicador.cl') {
      // Si el registro ya existía, pero la tasa o la fuente son diferentes, lo actualizamos para mantener los datos frescos.
      tipoCambio.Tasa_Cambio = valor;
      tipoCambio.Fuente = 'mindicador.cl';
      await tipoCambio.save();
      console.log(`Tipo de cambio ${codigoMonedaOrigen}/${codigoMonedaDestino} para fecha ${fechaParaGuardar.toISOString().split('T')[0]} actualizado en BD.`);
      return { success: true, data: tipoCambio, created: false, message: 'Tipo de cambio actualizado.' };
    } else {
      // Si el registro ya existía y es idéntico, no hacemos nada.
      console.log(`Tipo de cambio ${codigoMonedaOrigen}/${codigoMonedaDestino} para fecha ${fechaParaGuardar.toISOString().split('T')[0]} ya existe en BD: ${tipoCambio.Tasa_Cambio}.`);
      return { success: true, data: tipoCambio, created: false, message: 'Tipo de cambio ya existía para esta fecha.' };
    }
  } catch (error) {
    console.error('Error al guardar/actualizar el tipo de cambio en la base de datos:', error);
    return { success: false, message: 'Error interno al interactuar con la base de datos para tipos de cambio.', errorDetail: error.message };
  }
}

/**
 * Crea un manejador de ruta de Express para actualizar un tipo de cambio.
 * @param {string} apiEndpoint - El endpoint para la API externa (ej. 'dolar').
 * @param {string} dbCurrencyCode - El código de la divisa en la BD (ej. 'USD').
 * @param {string} currencyName - El nombre legible de la divisa (ej. 'Dólar').
 * @returns {Function} Un manejador de ruta async para Express.
 */
function createUpdateHandler(apiEndpoint, dbCurrencyCode, currencyName) {
  return async (req, res) => {
    try {
      const resultadoAPI = await obtenerValorDesdeAPI(apiEndpoint, apiEndpoint);

      if (!resultadoAPI.success) {
        return res.status(500).json({
          message: `Error al obtener datos de ${currencyName} de la API externa.`,
          details: resultadoAPI.message,
          error: resultadoAPI.errorDetail,
          apiResponse: resultadoAPI.apiResponse
        });
      }

      const resultadoGuardado = await guardarActualizarTipoCambioEnDB(resultadoAPI.valor, resultadoAPI.fecha, dbCurrencyCode, 'CLP');

      if (!resultadoGuardado.success) {
        return res.status(500).json({
          message: `Error al guardar el tipo de cambio de ${currencyName} en la base de datos.`,
          details: resultadoGuardado.message,
          error: resultadoGuardado.errorDetail
        });
      }

      res.json({
        message: `Proceso de actualización de tipo de cambio de ${currencyName} completado.`,
        apiData: { valor: resultadoAPI.valor, fecha: resultadoAPI.fecha },
        dbStatus: resultadoGuardado.message,
        data: resultadoGuardado.data,
        created: resultadoGuardado.created
      });
    } catch (error) {
      console.error(`Error fatal en la ruta de actualización para ${currencyName}:`, error);
      res.status(500).json({ message: 'Ocurrió un error inesperado en el servidor.', error: error.message });
    }
  };
}

app.get('/api/tipo-cambio/actualizar-dolar', createUpdateHandler('dolar', 'USD', 'Dólar'));
app.get('/api/tipo-cambio/actualizar-euro', createUpdateHandler('euro', 'EUR', 'Euro'));

// Endpoint para inserción manual de tipos de cambio (para pruebas)
app.post('/api/tipo-cambio/manual', async (req, res) => {
  const { monedaOrigen, monedaDestino, fecha, tasa } = req.body;

  if (!monedaOrigen || !monedaDestino || !fecha || tasa == null) {
    return res.status(400).json({ message: 'Faltan parámetros: se requiere monedaOrigen, monedaDestino, fecha y tasa.' });
  }

  if (typeof tasa !== 'number' || tasa <= 0) {
    return res.status(400).json({ message: 'El parámetro "tasa" debe ser un número positivo.' });
  }

  try {
    // Reutilizamos la lógica de guardado que ya es muy robusta
    const resultadoGuardado = await guardarActualizarTipoCambioEnDB(tasa, fecha, monedaOrigen, monedaDestino);

    if (!resultadoGuardado.success) {
      return res.status(500).json({
        message: `Error al guardar el tipo de cambio manual de ${monedaOrigen}/${monedaDestino}.`,
        details: resultadoGuardado.message,
        error: resultadoGuardado.errorDetail
      });
    }

    res.status(201).json({
      message: `Tipo de cambio manual ${monedaOrigen}/${monedaDestino} guardado/actualizado exitosamente.`,
      ...resultadoGuardado
    });
  } catch (error) {
    console.error(`Error fatal en la ruta /api/tipo-cambio/manual:`, error);
    res.status(500).json({ message: 'Ocurrió un error inesperado en el servidor.', error: error.message });
  }
});

app.get('/api/divisas', async (req, res) => {
  try {
    const divisas = await Divisas.findAll();
    res.json(divisas);
  } catch (error) {
    console.error("Error al obtener divisas:", error);
    res.status(500).json({ message: "Error al obtener listado de divisas.", error: error.message });
  }
});

app.get('/api/tipo-cambio/dolar-actual', async (req, res) => {
  try {
    const ultimoTipoCambio = await getLatestExchangeRate('USD', 'CLP');
    if (ultimoTipoCambio) {
      res.json(ultimoTipoCambio);
    } else {
      res.status(404).json({ message: "No hay tipos de cambio USD/CLP registrados en la base de datos." });
    }
  } catch (error) {
    console.error("Error al obtener el último tipo de cambio USD/CLP:", error);
    res.status(500).json({ message: "Error al obtener el último tipo de cambio USD/CLP.", error: error.message });
  }
});

app.get('/api/tipo-cambio/euro-actual', async (req, res) => {
  try {
    const ultimoTipoCambio = await getLatestExchangeRate('EUR', 'CLP');
    if (ultimoTipoCambio) {
      res.json(ultimoTipoCambio);
    } else {
      res.status(404).json({ message: "No hay tipos de cambio EUR/CLP registrados en la base de datos." });
    }
  } catch (error) {
    console.error("Error al obtener el último tipo de cambio EUR/CLP:", error);
    res.status(500).json({ message: "Error al obtener el último tipo de cambio EUR/CLP.", error: error.message });
  }
});

async function iniciarServidor() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
    app.listen(PORT, () => {
      console.log(`Servidor API corriendo en http://localhost:${PORT}`);
      console.log('Endpoints disponibles:');
      console.log(`  GET http://localhost:${PORT}/api/divisas`);
      console.log(`  GET http://localhost:${PORT}/api/tipo-cambio/actualizar-euro`); 
      console.log(`  GET http://localhost:${PORT}/api/tipo-cambio/euro-actual`);
      console.log(`  GET http://localhost:${PORT}/api/tipo-cambio/actualizar-dolar`);
      console.log(`  GET http://localhost:${PORT}/api/tipo-cambio/dolar-actual`);
      console.log(`  POST http://localhost:${PORT}/api/tipo-cambio/manual`);
      console.log(`  POST http://localhost:${PORT}/api/v1/convertir`);
      console.log(`  POST http://localhost:${PORT}/api/v1/carrito/convertir`);
      console.log(`  GET  http://localhost:${PORT}/api/v1/indicadores`);
    });
  } catch (error) {
    console.error('No se pudo conectar a la base de datos al iniciar el servidor:', error);
    process.exit(1); 
  }
}

iniciarServidor();
