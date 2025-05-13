const db = require('../config/database'); // Tu conexión a la BD de inventario

async function obtenerStockPorProductoYSucursal(idProducto, idSucursal) {
    const [rows] = await db.execute(
        'SELECT Stock_Actual FROM INVENTARIO WHERE ID_Producto = ? AND ID_Sucursal = ?',
        [idProducto, idSucursal]
    );
    if (rows.length > 0) {
        return rows[0]; // Devuelve { Stock_Actual: N }
    }
    return null; // No se encontró
}

module.exports = {
    obtenerStockPorProductoYSucursal
};
