const bancoCentralService = require('../services/bancoCentral.service.js'); // Asegúrate que la ruta sea correcta

const obtenerValorDolar = async (req, res) => {
  try {
    const valorDolar = await bancoCentralService.getDolarRate();
    res.json({ valor_dolar: valorDolar });
  } catch (error) {
    // Es buena práctica loggear el error en el servidor para debugging
    console.error('Error en obtenerValorDolar:', error.message);
    res.status(500).json({ error: error.message || 'Error al obtener el valor del dólar.' });
  }
};

const convertirMonto = async (req, res) => {
  const { montoUSD } = req.body;

  if (montoUSD === undefined) {
    return res.status(400).json({ error: 'El campo montoUSD es requerido.' });
  }
  if (typeof montoUSD !== 'number' || isNaN(montoUSD)) {
    return res.status(400).json({ error: 'El campo montoUSD debe ser un número.' });
  }
  if (montoUSD < 0) {
    return res.status(400).json({ error: 'El campo montoUSD no puede ser negativo.' });
  }

  try {
    const valorDolar = await bancoCentralService.getDolarRate();
    const resultado = montoUSD * valorDolar;
    // Formatear a 2 decimales para montos monetarios
    res.json({ montoCLP: parseFloat(resultado.toFixed(2)) });
  } catch (error) {
    // Es buena práctica loggear el error en el servidor para debugging
    console.error('Error en convertirMonto:', error.message);
    // Devolver el mensaje de error del servicio si está disponible, o uno genérico
    res.status(500).json({ error: error.message || 'Error al convertir el monto.' });
  }
};

module.exports = {
  obtenerValorDolar,
  convertirMonto
};
