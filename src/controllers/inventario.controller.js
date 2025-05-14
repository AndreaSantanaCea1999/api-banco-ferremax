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

exports.actualizarInventario = async (req, res) => {
    const idInventario = parseInt(req.params.id, 10);
    const datosParaActualizar = req.body;

    if (isNaN(idInventario)) {
        return res.status(400).json({ error: 'El ID de inventario debe ser un número.' });
    }

    if (Object.keys(datosParaActualizar).length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron datos para actualizar.' });
    }

    // Validar que los campos a actualizar sean permitidos y tengan tipos correctos (ejemplo simple)
    if (datosParaActualizar.Stock_Actual !== undefined && typeof datosParaActualizar.Stock_Actual !== 'number') {
        return res.status(400).json({ error: 'Stock_Actual debe ser un número.' });
    }
    // Puedes añadir más validaciones para otros campos (Stock_Minimo, Stock_Maximo, etc.)

    try {
        const actualizado = await InventarioModel.actualizarRegistroInventario(idInventario, datosParaActualizar);
        if (actualizado) {
            res.json({ mensaje: `Registro de inventario con ID ${idInventario} actualizado correctamente.` });
        } else {
            res.status(404).json({ error: `Registro de inventario con ID ${idInventario} no encontrado o no se realizaron cambios.` });
        }
    } catch (error) {
        console.error(`Error en inventarioController.actualizarInventario para ID ${idInventario}:`, error);
        res.status(500).json({ error: 'Error interno al actualizar el registro de inventario.' });
    }
};
