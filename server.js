
require('dotenv').config();
const express = require('express');
const { TiposCambio, Divisas, sequelize } = require('./src/models');
const axios = require('axios');

const app = express();
app.use(express.json()); 

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.BANCO_API_KEY;
const BASE_URL = process.env.BANCO_API_URL;

async function obtenerValorDesdeAPI(endpoint, monedaKey) {
  if (!API_KEY || !BASE_URL) {
    console.error('Error: BANCO_API_KEY o BANCO_API_URL no están configuradas.');
    return { success: false, message: 'Configuración de API externa incompleta.', endpoint: endpoint };
  }

  try {
    const URL_COMPLETA = `${BASE_URL}/${endpoint}?apikey=${API_KEY}&formato=json`;
    console.log(`Consultando URL externa: ${URL_COMPLETA}`);
    const respuesta = await axios.get(URL_COMPLETA, { timeout: 10000 }); // Timeout de 10 segundos (10000 ms)

    if (respuesta.data && respuesta.data[monedaKey] && respuesta.data[monedaKey].length > 0) {
      const primerRegistro = respuesta.data[monedaKey][0];
      const valorExtraido = primerRegistro.Valor.replace(',', '.');
      const valorNumerico = parseFloat(valorExtraido);
      const fechaExterna = primerRegistro.Fecha;
      
      console.log('Valor del Dólar (numérico) desde API externa:', valorNumerico, 'Fecha API:', fechaExterna);
      return { success: true, valor: valorNumerico, fecha: fechaExterna };
    } else {
      console.error('Error: La respuesta de la API externa no tiene el formato esperado.');
      console.log('Respuesta completa de la API externa:', respuesta.data);
      return { success: false, message: 'Formato de respuesta de API externa inesperado.', apiResponse: respuesta.data };
    }
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error('Error al obtener el valor del dólar de API externa: Timeout - La solicitud tardó demasiado.');
    } else { // Otros errores de red o HTTP
      console.error('Error al obtener el valor del dólar de API externa:', error.response ? error.response.data : error.message);
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

    // Usar la fecha de la API para guardar. Convertir a objeto Date.
    // La API de CMF devuelve fechas en formato "YYYY-MM-DD".
    const fechaParaGuardar = new Date(fechaApi);
     if (isNaN(fechaParaGuardar.getTime())) {
        console.error(`Fecha inválida recibida de la API: ${fechaApi}`);
        return { success: false, message: `Fecha inválida recibida de la API: ${fechaApi}` };
    }


    const [tipoCambio, created] = await TiposCambio.findOrCreate({
      where: {
        ID_Divisa_Origen: divisaOrigen.ID_Divisa,
        ID_Divisa_Destino: divisaDestino.ID_Divisa,
        Fecha: fechaParaGuardar,
      },
      defaults: {
        Tasa_Cambio: valor,
        Fuente: 'API Banco Central CMF' // O la fuente específica
      }
    });

    if (created) {
      console.log(`Tipo de cambio ${codigoMonedaOrigen}/${codigoMonedaDestino} guardado en BD: ${valor} para fecha ${fechaParaGuardar.toISOString().split('T')[0]}`);
      return { success: true, data: tipoCambio, created: true, message: 'Tipo de cambio guardado.' };
    } else {
  
      console.log(`Tipo de cambio ${codigoMonedaOrigen}/${codigoMonedaDestino} para fecha ${fechaParaGuardar.toISOString().split('T')[0]} ya existe en BD: ${tipoCambio.Tasa_Cambio}.`);
      return { success: true, data: tipoCambio, created: false, message: 'Tipo de cambio ya existía para esta fecha.' };
    }

  } catch (error) {
    console.error('Error al guardar/actualizar el tipo de cambio en la base de datos:', error);
    return { success: false, message: 'Error interno al interactuar con la base de datos para tipos de cambio.', errorDetail: error.message };
  }
}

app.get('/api/tipo-cambio/actualizar-dolar', async (req, res) => {
  const resultadoAPI = await obtenerValorDesdeAPI('dolar', 'Dolares'); 

  if (!resultadoAPI.success) {
    return res.status(500).json({
      message: "Error al obtener datos de la API del Banco Central.",
      details: resultadoAPI.message,
      error: resultadoAPI.errorDetail,
      apiResponse: resultadoAPI.apiResponse
    });
  }

  const resultadoGuardado = await guardarActualizarTipoCambioEnDB(resultadoAPI.valor, resultadoAPI.fecha, 'USD', 'CLP');

  if (!resultadoGuardado.success) {
    return res.status(500).json({
      message: "Error al guardar el tipo de cambio en la base de datos.",
      details: resultadoGuardado.message,
      error: resultadoGuardado.errorDetail
    });
  }

  res.json({
    message: "Proceso de actualización de tipo de cambio completado.",
    apiData: { valor: resultadoAPI.valor, fecha: resultadoAPI.fecha },
    dbStatus: resultadoGuardado.message,
    data: resultadoGuardado.data,
    created: resultadoGuardado.created
  });
});


app.get('/api/tipo-cambio/actualizar-euro', async (req, res) => {
  const resultadoAPI = await obtenerValorDesdeAPI('euro', 'Euros'); 

  if (!resultadoAPI.success) {
    return res.status(500).json({
      message: "Error al obtener datos del Euro de la API del Banco Central.",
      details: resultadoAPI.message,
      error: resultadoAPI.errorDetail,
      apiResponse: resultadoAPI.apiResponse,
      endpoint: resultadoAPI.endpoint 
    });
  }


  const resultadoGuardado = await guardarActualizarTipoCambioEnDB(resultadoAPI.valor, resultadoAPI.fecha, 'EUR', 'CLP');

  if (!resultadoGuardado.success) {
    return res.status(500).json({
      message: "Error al guardar el tipo de cambio del Euro en la base de datos.",
      details: resultadoGuardado.message,
      error: resultadoGuardado.errorDetail
    });
  }

  res.json({
    message: "Proceso de actualización de tipo de cambio del Euro completado.",
    apiData: { valor: resultadoAPI.valor, fecha: resultadoAPI.fecha },
    dbStatus: resultadoGuardado.message,
    data: resultadoGuardado.data,
    created: resultadoGuardado.created
  });
});

// Endpoint para listar todas las divisas
app.get('/api/divisas', async (req, res) => {
  try {
    const divisas = await Divisas.findAll();
    res.json(divisas);
  } catch (error) {
    console.error("Error al obtener divisas:", error);
    res.status(500).json({ message: "Error al obtener listado de divisas.", error: error.message });
  }
});

// Endpoint para obtener el último tipo de cambio USD/CLP guardado en la BD
app.get('/api/tipo-cambio/dolar-actual', async (req, res) => {
  try {
    const divisaOrigen = await Divisas.findOne({ where: { Codigo: 'USD' } });
    const divisaDestino = await Divisas.findOne({ where: { Codigo: 'CLP' } });

    if (!divisaOrigen || !divisaDestino) {
      return res.status(404).json({ message: "Divisas USD o CLP no encontradas en la configuración de la base de datos." });
    }

    const ultimoTipoCambio = await TiposCambio.findOne({
      where: {
        ID_Divisa_Origen: divisaOrigen.ID_Divisa,
        ID_Divisa_Destino: divisaDestino.ID_Divisa,
      },
      order: [['Fecha', 'DESC']], // Obtener el más reciente
    });

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

// Endpoint para obtener el último tipo de cambio EUR/CLP guardado en la BD
app.get('/api/tipo-cambio/euro-actual', async (req, res) => {
  try {
    const divisaOrigen = await Divisas.findOne({ where: { Codigo: 'EUR' } });
    const divisaDestino = await Divisas.findOne({ where: { Codigo: 'CLP' } });

    if (!divisaOrigen || !divisaDestino) {
      return res.status(404).json({ message: "Divisas EUR o CLP no encontradas en la configuración de la base de datos." });
    }

    const ultimoTipoCambio = await TiposCambio.findOne({
      where: {
        ID_Divisa_Origen: divisaOrigen.ID_Divisa,
        ID_Divisa_Destino: divisaDestino.ID_Divisa,
      },
      order: [['Fecha', 'DESC']], 
    });

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

// Iniciar el servidor y conectar a la BD
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
    });
  } catch (error) {
    console.error('No se pudo conectar a la base de datos al iniciar el servidor:', error);
    // Salir del proceso si no se puede conectar a la BD al inicio es una opción
    process.exit(1); 
  }
}

iniciarServidor();
