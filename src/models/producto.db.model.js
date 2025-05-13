// c:\Users\andre\Desktop\api-banco-ferremax\src\models\producto.db.model.js
const pool = require('../config/database'); // Asegúrate que la ruta a tu configuración de BD sea correcta

class ProductoModel {
    /**
     * Obtiene un producto de la base de datos local por su código.
     * @param {string} codigoProducto - El código alfanumérico del producto (ej. "BOS-TAL-001").
     * @returns {Promise<object|null>} El objeto del producto si se encuentra, o null.
     */
    static async obtenerPorCodigo(codigoProducto) {
        if (!codigoProducto) {
            console.error('[ProductoModel.obtenerPorCodigo] Se recibió un código de producto undefined o null.');
            return null;
        }
        // Devuelve todos los campos necesarios, incluyendo ID_Producto y Estado
        const query = 'SELECT ID_Producto, Codigo, Nombre, Precio_Venta, Estado, Descripcion, Especificaciones, ID_Categoria, ID_Marca, ID_Proveedor, ID_Divisa FROM PRODUCTOS WHERE Codigo = ?';
        try {
            console.log(`[ProductoModel.obtenerPorCodigo] Buscando producto con código: ${codigoProducto}`);
            const [rows] = await pool.query(query, [codigoProducto]);
            if (rows.length > 0) {
                // Opcional: podrías añadir una verificación de Estado aquí si solo quieres productos 'Activo'
                // if (rows[0].Estado !== 'Activo') {
                //     console.log(`[ProductoModel.obtenerPorCodigo] Producto ${codigoProducto} encontrado pero no está Activo. Estado: ${rows[0].Estado}`);
                //     return null; // O devolver el producto y dejar que el servicio/controlador decida
                // }
                console.log(`[ProductoModel.obtenerPorCodigo] Producto encontrado:`, rows[0]);
                const producto = rows[0];
                // Asegurar que los campos numéricos sean números
                if (producto.Precio_Venta) producto.Precio_Venta = parseFloat(producto.Precio_Venta);
                // Puedes hacer lo mismo para otros campos numéricos si es necesario
                return producto;
            }
            console.log(`[ProductoModel.obtenerPorCodigo] Producto con código ${codigoProducto} no encontrado.`);
            return null; // No se encontró el producto
        } catch (error) {
            console.error(`[ProductoModel.obtenerPorCodigo] Error al obtener producto por código ${codigoProducto}:`, error);
            throw error; // Relanzar el error para que sea manejado por el servicio/controlador
        }
    }

    // Puedes añadir más métodos estáticos aquí para interactuar con la tabla PRODUCTOS si es necesario
    // static async obtenerPorId(idProducto) { ... }
    // static async crear(datosProducto) { ... }
    // static async actualizar(idProducto, datosProducto) { ... }
    // static async eliminar(idProducto) { ... }
}

module.exports = ProductoModel;
