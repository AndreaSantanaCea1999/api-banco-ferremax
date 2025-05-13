// En src/controllers/divisas.controller.js
const bancoCentralService = require('../services/bancoCentral.service');

exports.obtenerTasaDolarActual = async (req, res) => {
    try {
        const tasa = await bancoCentralService.getDolarRate();
        // Log para depuración: ver qué devuelve el servicio
        console.log('[DivisasController] Tasa recibida del servicio:', tasa);

        if (tasa && typeof tasa.valor === 'number' && tasa.fecha) { // Verificación más robusta
            res.json(tasa);
        } else {
            console.error('[DivisasController] La tasa obtenida del servicio no es válida o no contiene un valor numérico y una fecha:', tasa);
            res.status(500).json({ error: 'No se pudo obtener una tasa de dólar válida del servicio.' });
        }
    } catch (error) {
        console.error("Error en divisasController.obtenerTasaDolarActual:", error);
        res.status(500).json({
            error: 'Error al obtener la tasa del dólar.',
            detalle: error.message || 'Error interno del servidor'
        });
    }
};

exports.convertirMoneda = async (req, res) => {
    const { montoUSD } = req.body;

    if (montoUSD === undefined || typeof montoUSD !== 'number' || montoUSD <= 0) {
        return res.status(400).json({ error: 'El campo montoUSD es requerido y debe ser un número positivo.' });
    }

    try {
        const tasaInfo = await bancoCentralService.getDolarRate();
        if (!tasaInfo || tasaInfo.valor === undefined) {
            return res.status(500).json({ error: 'No se pudo obtener la tasa de conversión actual.' });
        }

        const montoCLP = parseFloat((montoUSD * tasaInfo.valor).toFixed(2));

        res.json({
            montoUSD: montoUSD,
            tasaConversion: tasaInfo.valor,
            montoCLP: montoCLP,
            fechaTasa: tasaInfo.fecha
        });
    } catch (error) {
        console.error("Error en divisasController.convertirMoneda:", error);
        res.status(500).json({ error: 'Error al realizar la conversión de divisa.', detalle: error.message });
    }
};
