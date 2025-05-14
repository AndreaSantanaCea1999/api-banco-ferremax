const pool = require('../config/database'); // Tu conexión a la BD

async function obtenerStockPorProductoYSucursal(idProducto, idSucursal) {
    const [rows] = await pool.execute(
        'SELECT Stock_Actual FROM INVENTARIO WHERE ID_Producto = ? AND ID_Sucursal = ?',
        [idProducto, idSucursal]
    );
    if (rows.length > 0) {
        return rows[0]; // Devuelve { Stock_Actual: N }
    }
    return null; // No se encontró
}

/**
 * Actualiza un registro de inventario específico por su ID_Inventario.
 * @param {number} idInventario - El ID del registro de inventario a actualizar.
 * @param {object} datosParaActualizar - Objeto con los campos a actualizar (ej. { Stock_Actual: 50 }).
 * @returns {Promise<boolean>} - True si la actualización fue exitosa, false si no se encontró el registro.
 */
async function actualizarRegistroInventario(idInventario, datosParaActualizar) {
    if (Object.keys(datosParaActualizar).length === 0) {
        return false; // No hay nada que actualizar
    }

    // Añadir Ultima_Actualizacion automáticamente
    datosParaActualizar.Ultima_Actualizacion = new Date();

    const campos = Object.keys(datosParaActualizar).map(key => `${key} = ?`).join(', ');
    const valores = [...Object.values(datosParaActualizar), idInventario];

    const query = `UPDATE INVENTARIO SET ${campos} WHERE ID_Inventario = ?`;

    try {
        const [result] = await pool.execute(query, valores);
        return result.affectedRows > 0;
    } catch (error) {
        console.error(`[InventarioModel.actualizarRegistroInventario] Error al actualizar inventario ID ${idInventario}:`, error);
        throw error;
    }
}

module.exports = {
    obtenerStockPorProductoYSucursal,
    actualizarRegistroInventario // Exportar la nueva función
};
