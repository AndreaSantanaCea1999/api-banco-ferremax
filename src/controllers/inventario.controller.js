const InventarioModel = require('../models/inventario.model'); // Asume que tienes un modelo

exports.verificarStock = async (req, res) => {
    const { productoId, sucursalId } = req.query;

    if (!productoId || !sucursalId) {
        return res.status(400).json({ error: 'Se requieren productoId y sucursalId.' });
    }

    try {
        // Llama a una función de tu modelo que busca en la tabla INVENTARIO
        // El ID_Producto en tu tabla PRODUCTOS es 4 (numérico)
        // El ID_Sucursal en tu tabla SUCURSALES es 1 (numérico)
        // Asegúrate de que tu modelo maneje los tipos de datos correctamente.
        const stockInfo = await InventarioModel.obtenerStockPorProductoYSucursal(
            parseInt(productoId), // O solo productoId si ya es número
            parseInt(sucursalId)  // O solo sucursalId si ya es número
        );

        if (stockInfo && stockInfo.Stock_Actual !== undefined) { // Verifica que se encontró y tiene la propiedad
            res.json({ stock_actual: stockInfo.Stock_Actual });
        } else {
            // Si no se encontró el registro de inventario para ese producto/sucursal
            res.status(404).json({ error: `Stock no encontrado para producto ${productoId} en sucursal ${sucursalId}.` });
        }
    } catch (error) {
        console.error("Error al verificar stock en API de Inventario:", error);
        res.status(500).json({ error: 'Error interno al verificar stock.' });
    }
};
