// c:\Users\andre\api-banco-ferremax\src\models\pedido.db.model.js

const db = require('../config/database'); // Importar el pool de conexiones

/**
 * @typedef {Object} ItemPedidoData
 * @property {string} productoIdExterno - ID del producto en la API de Inventario
 * @property {string} nombreProducto - Nombre del producto (para guardar una copia)
 * @property {number} cantidad
 * @property {number} precioUnitario - Precio al momento de la compra
 * @property {number} [descuentoItem=0]
 * @property {number} [impuestoItem=0]
 * @property {number} subtotalItem
 */

/**
 * @typedef {Object} PedidoData
 * @property {number} clienteId - ID del cliente (asumiendo que tienes una tabla de clientes en esta BD o lo manejas por ID externo)
 * @property {number} sucursalId - ID de la sucursal
 * @property {number} usuarioId - ID del usuario que crea/modifica el pedido (vendedor, admin, cliente logueado)
 * @property {string} [canal='Online'] - 'Online' o 'Físico'
 * @property {string} [metodoEntrega='Despacho_Domicilio'] - 'Retiro_Tienda' o 'Despacho_Domicilio'
 * @property {string} [direccionEntrega]
 * @property {string} [ciudadEntrega]
 * @property {string} [regionEntrega]
 * @property {string} [paisEntrega='Chile']
 * @property {string} [comentarios]
 * @property {number} subtotal
 * @property {number} [descuento=0]
 * @property {number} [impuestos=0]
 * @property {number} [costoEnvio=0]
 * @property {number} total
 * @property {number} idDivisa - ID de la divisa del pedido (de tu tabla DIVISAS)
 * @property {string} [fechaEstimadaEntrega]
 * @property {string} [prioridad='Normal']
 */

/**
 * Crea un nuevo pedido y sus detalles en la base de datos.
 * @param {PedidoData} datosPedido - Datos del pedido principal.
 * @param {ItemPedidoData[]} detallesItems - Array de detalles de los items del pedido.
 * @returns {Promise<object>} - El pedido creado con su ID y Codigo_Pedido.
 */
const crearPedidoConDetalles = async (datosPedido, detallesItems) => {
    const connection = await db.getConnection(); // Obtener una conexión del pool
    try {
        await connection.beginTransaction(); // Iniciar transacción

        // 1. Insertar en PEDIDOS
        // Generar un código de pedido único (ejemplo simple)
        const codigoPedido = `PED-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        const [pedidoResult] = await connection.execute(
            `INSERT INTO PEDIDOS (Codigo_Pedido, ID_Cliente, ID_Vendedor, ID_Sucursal, Fecha_Pedido, Canal, Estado, Metodo_Entrega, Direccion_Entrega, Ciudad_Entrega, Region_Entrega, Pais_Entrega, Comentarios, Subtotal, Descuento, Impuestos, Costo_Envio, Total, ID_Divisa, Fecha_Estimada_Entrega, Prioridad, ID_Usuario)
             VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                codigoPedido,
                datosPedido.clienteId,
                datosPedido.vendedorId || null, // Puede ser null si no hay vendedor asociado
                datosPedido.sucursalId,
                datosPedido.canal,
                'Pendiente', // Estado inicial
                datosPedido.metodoEntrega,
                datosPedido.direccionEntrega,
                datosPedido.ciudadEntrega,
                datosPedido.regionEntrega,
                datosPedido.paisEntrega,
                datosPedido.comentarios,
                datosPedido.subtotal,
                datosPedido.descuento,
                datosPedido.impuestos,
                datosPedido.costoEnvio,
                datosPedido.total,
                datosPedido.idDivisa,
                datosPedido.fechaEstimadaEntrega || null,
                datosPedido.prioridad,
                datosPedido.usuarioId // Guardar el usuario que creó el pedido
            ]
        );
        const pedidoId = pedidoResult.insertId; // Obtener el ID autogenerado

        // 2. Insertar en DETALLES_PEDIDO
        for (const item of detallesItems) {
            await connection.execute(
                `INSERT INTO DETALLES_PEDIDO (ID_Pedido, ID_Producto, Cantidad, Precio_Unitario, Descuento, Impuesto, Subtotal, Estado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    pedidoId,
                    item.productoIdExterno, // Usamos el ID externo del producto
                    item.cantidad,
                    item.precioUnitario,
                    item.descuentoItem,
                    item.impuestoItem,
                    item.subtotalItem,
                    'Pendiente' // Estado inicial del detalle
                ]
            );
            // NOTA: La actualización de inventario (descontar stock) NO se hace aquí.
            // Se hace DESPUÉS de confirmar el pago (en el callback de Webpay)
            // llamando a la API de Inventario.
        }

        // 3. Insertar en HISTORICO_ESTADOS_PEDIDO
        await connection.execute(
            `INSERT INTO HISTORICO_ESTADOS_PEDIDO (ID_Pedido, Estado_Nuevo, Fecha_Cambio, ID_Usuario, Comentario)
             VALUES (?, ?, NOW(), ?, ?)`,
            [pedidoId, 'Pendiente', datosPedido.usuarioId, 'Pedido creado']
        );

        await connection.commit(); // Confirmar la transacción
        return { id: pedidoId, codigoPedido: codigoPedido, ...datosPedido }; // Devolver el pedido creado
    } catch (error) {
        await connection.rollback(); // Revertir si algo falla
        console.error("Error al crear pedido en BD:", error);
        throw error; // Re-lanzar para que el controlador lo maneje
    } finally {
        connection.release(); // Liberar la conexión al pool
    }
};
const crearRegistroPagoInicial = async (idPedido, monto, idDivisa, metodoPago = 'Webpay') => {
    const connection = await db.getConnection();
    try {
        const [result] = await connection.execute(
            `INSERT INTO PAGOS (ID_Pedido, Fecha_Pago, Metodo_Pago, Monto, ID_Divisa, Estado)
             VALUES (?, NOW(), ?, ?, ?, 'Pendiente')`,
            [idPedido, metodoPago, monto, idDivisa]
        );
        return result.insertId; // Devuelve el ID_Pago generado
    } catch (error) {
        console.error(`Error al crear registro de pago inicial para pedido ${idPedido}:`, error);
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Actualiza el estado de un pedido y registra el cambio en el histórico.
 * @param {number} idPedido - ID del pedido a actualizar.
 * @param {string} nuevoEstado - El nuevo estado del pedido.
 * @param {number} usuarioId - ID del usuario que realiza la acción.
 * @param {string} [comentario=''] - Comentario sobre el cambio de estado.
 * @returns {Promise<boolean>} - True si se actualizó, false si no se encontró el pedido.
 */
const actualizarEstadoPedido = async (idPedido, nuevoEstado, usuarioId, comentario = '') => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [pedidoActualRows] = await connection.execute('SELECT Estado FROM PEDIDOS WHERE ID_Pedido = ?', [idPedido]);
        if (pedidoActualRows.length === 0) {
            await connection.rollback();
            return false; // Pedido no encontrado
        }
        const estadoAnterior = pedidoActualRows[0].Estado;

        await connection.execute(
            'UPDATE PEDIDOS SET Estado = ? WHERE ID_Pedido = ?',
            [nuevoEstado, idPedido]
        );

        await connection.execute(
            `INSERT INTO HISTORICO_ESTADOS_PEDIDO (ID_Pedido, Estado_Anterior, Estado_Nuevo, Fecha_Cambio, ID_Usuario, Comentario)
             VALUES (?, ?, ?, NOW(), ?, ?)`,
            [idPedido, estadoAnterior, nuevoEstado, usuarioId, comentario]
        );

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        console.error(`Error al actualizar estado del pedido ${idPedido} a ${nuevoEstado}:`, error);
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Obtiene un pedido específico por su ID, incluyendo sus detalles.
 * @param {number} idPedido - El ID del pedido a obtener.
 * @returns {Promise<object|null>} - El objeto del pedido con sus detalles, o null si no se encuentra.
 */
const obtenerPedidoPorId = async (idPedido) => {
    const connection = await db.getConnection();
    try {
        const [pedidoRows] = await connection.execute(
            // Ajusta los campos y JOINs según las tablas que quieras incluir (ej. CLIENTE, SUCURSALES, DIVISAS de tu BD de pedidos)
            // Asumiendo que tienes una tabla USUARIO para los nombres de cliente, vendedor, etc.
            `SELECT p.*,
                    u_cliente.Nombre AS NombreCliente,
                    s.Nombre AS NombreSucursal,
                    d.Codigo AS CodigoDivisa,
                    u_vendedor.Nombre AS NombreVendedor
             FROM PEDIDOS p
             LEFT JOIN CLIENTE cl ON p.ID_Cliente = cl.ID_Cliente
             LEFT JOIN USUARIO u_cliente ON cl.ID_Usuario = u_cliente.ID_Usuario
             LEFT JOIN SUCURSALES s ON p.ID_Sucursal = s.ID_Sucursal
             LEFT JOIN DIVISAS d ON p.ID_Divisa = d.ID_Divisa
             LEFT JOIN VENDEDOR ve ON p.ID_Vendedor = ve.ID_Vendedor
             LEFT JOIN USUARIO u_vendedor ON ve.ID_Usuario = u_vendedor.ID_Usuario
             WHERE p.ID_Pedido = ?`,
            [idPedido]
        );

        if (pedidoRows.length === 0) {
            return null; // Pedido no encontrado
        }

        const pedido = pedidoRows[0];

        const [detallesRows] = await connection.execute(
            // ID_Producto en DETALLES_PEDIDO es el productoIdExterno que referencia al ID de tu API de Inventario
            // Aquí podrías querer guardar también el nombre del producto al momento de la compra para histórico.
            `SELECT dp.ID_Detalle, dp.ID_Producto AS ProductoIdExterno, dp.Cantidad, dp.Precio_Unitario, dp.Descuento, dp.Impuesto, dp.Subtotal, dp.Estado
             FROM DETALLES_PEDIDO dp
             WHERE dp.ID_Pedido = ?`,
            [idPedido]
        );

        pedido.items = detallesRows; // Añadir los detalles al objeto del pedido

        // Opcional: Obtener el historial de estados
        const [historialRows] = await connection.execute(
            `SELECT he.Estado_Anterior, he.Estado_Nuevo, he.Fecha_Cambio, u.Nombre AS NombreUsuarioModifica, he.Comentario
             FROM HISTORICO_ESTADOS_PEDIDO he
             JOIN USUARIO u ON he.ID_Usuario = u.ID_Usuario
             WHERE he.ID_Pedido = ? ORDER BY he.Fecha_Cambio ASC`,
            [idPedido]
        );
        pedido.historialEstados = historialRows;

        return pedido;
    } catch (error) {
        console.error(`Error al obtener pedido por ID ${idPedido}:`, error);
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Obtiene todos los pedidos (puedes añadir filtros y paginación aquí).
 * @param {object} [filtros={}] - Objeto con filtros (ej. { clienteId: 1, estado: 'Pendiente' })
 * @param {object} [paginacion={limit: 10, offset: 0}] - Objeto para paginación
 * @returns {Promise<Array<object>>} - Un array de objetos de pedido.
 */
const obtenerTodosLosPedidos = async (filtros = {}, paginacion = { limit: 10, offset: 0 }) => {
    const connection = await db.getConnection();
    try {
        // Esta es una consulta simple, podrías querer añadir JOINs, filtros dinámicos, paginación.
        // Por simplicidad, solo ordenamos por fecha.
        // TODO: Implementar filtros y paginación si es necesario.
        const [rows] = await connection.execute('SELECT ID_Pedido, Codigo_Pedido, ID_Cliente, Fecha_Pedido, Total, Estado, ID_Divisa FROM PEDIDOS ORDER BY Fecha_Pedido DESC LIMIT ? OFFSET ?', [paginacion.limit, paginacion.offset]);
        return rows;
    } catch (error) {
        console.error('Error al obtener todos los pedidos:', error);
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Registra una transacción de Webpay.
 * @param {object} datosTransaccion - Datos de la transacción de Webpay.
 * @returns {Promise<number>} - El ID de la transacción de Webpay registrada.
 */
const registrarTransaccionWebpay = async (datosTransaccion) => {
    const connection = await db.getConnection();
    try {
        // Asumiendo que datosTransaccion tiene campos como ID_Pago, Token_Webpay, Orden_Compra, etc.
        // que coinciden con tu tabla WEBPAY_TRANSACCIONES
        const [result] = await connection.execute(
            `INSERT INTO WEBPAY_TRANSACCIONES (ID_Pago, Token_Webpay, Orden_Compra, Tarjeta_Tipo, Tarjeta_Numero, Autorizacion_Codigo, Respuesta_Codigo, Respuesta_Descripcion, Fecha_Transaccion, Installments, JSON_Respuesta)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
            [
                datosTransaccion.idPago || null, // Puede ser null si no se encontró el pago asociado
                datosTransaccion.tokenWebpay,
                datosTransaccion.ordenCompra,
                datosTransaccion.tipoTarjeta || null,
                datosTransaccion.numeroTarjeta || null, // Considerar no guardar el número completo
                datosTransaccion.codigoAutorizacion || null,
                datosTransaccion.codigoRespuesta || null,
                datosTransaccion.descripcionRespuesta || null,
                datosTransaccion.cuotas || 1,
                JSON.stringify(datosTransaccion.jsonRespuestaCompleta) || null
            ]
        );
        return result.insertId;
    } catch (error) {
        console.error('Error al registrar transacción de Webpay:', error);
        throw error;
    } finally {
        connection.release();
    }
};


/**
 * Obtiene un pedido por su Codigo_Pedido.
 * @param {string} codigoPedido - El código único del pedido.
 * @returns {Promise<object|null>} - El objeto del pedido, o null si no se encuentra.
 */
const obtenerPedidoPorCodigo = async (codigoPedido) => {
    const connection = await db.getConnection();
    try {
        // Devuelve los campos necesarios para el flujo de Webpay y actualización de stock
        const [pedidoRows] = await connection.execute(
            `SELECT ID_Pedido, Codigo_Pedido, ID_Cliente, ID_Sucursal, ID_Usuario, Estado
             FROM PEDIDOS
             WHERE Codigo_Pedido = ?`,
            [codigoPedido]
        );
        return pedidoRows.length > 0 ? pedidoRows[0] : null;
    } catch (error) {
        console.error(`Error al obtener pedido por código ${codigoPedido}:`, error);
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Obtiene los detalles (items) de un pedido específico.
 * @param {number} idPedido - El ID del pedido.
 * @returns {Promise<Array<object>>} - Un array con los items del pedido.
 */
const obtenerDetallesPorPedidoId = async (idPedido) => {
    const connection = await db.getConnection();
    try {
        const [detallesRows] = await connection.execute(
            // ID_Producto aquí es el productoIdExterno que guardaste
            `SELECT dp.ID_Producto AS ProductoIdExterno, dp.Cantidad
             FROM DETALLES_PEDIDO dp
             WHERE dp.ID_Pedido = ?`,
            [idPedido]
        );
        return detallesRows;
    } catch (error) {
        console.error(`Error al obtener detalles para pedido ${idPedido}:`, error);
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Obtiene el ID de un registro de PAGO pendiente para un pedido específico.
 * @param {number} idPedido - El ID del pedido.
 * @param {string} estado - El estado del pago a buscar (ej. 'Pendiente').
 * @returns {Promise<number|null>} - El ID_Pago o null si no se encuentra.
 */
const obtenerIdPagoPorPedidoIdYEstado = async (idPedido, estado = 'Pendiente') => {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.execute(
            `SELECT ID_Pago FROM PAGOS WHERE ID_Pedido = ? AND Estado = ? ORDER BY Fecha_Pago DESC LIMIT 1`,
            [idPedido, estado]
        );
        return rows.length > 0 ? rows[0].ID_Pago : null;
    } catch (error) {
        console.error(`Error al obtener idPago para pedido ${idPedido} con estado ${estado}:`, error);
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Actualiza el estado de un registro de PAGO.
 * @param {number} idPago - El ID del pago a actualizar.
 * @param {string} nuevoEstado - El nuevo estado del pago (ej. 'Completado', 'Rechazado').
 * @returns {Promise<boolean>} - True si se actualizó, false si no.
 */
const actualizarEstadoPago = async (idPago, nuevoEstado) => {
    const connection = await db.getConnection();
    try {
        const [result] = await connection.execute('UPDATE PAGOS SET Estado = ? WHERE ID_Pago = ?', [nuevoEstado, idPago]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error(`Error al actualizar estado del pago ${idPago} a ${nuevoEstado}:`, error);
        throw error;
    } finally {
        connection.release();
    }
};

// TODO: Implementar función para eliminar (o más probablemente, cancelar) un pedido.
// const cancelarPedido = async (idPedido, usuarioId, motivoCancelacion) => { ... }
// Esto implicaría llamar a actualizarEstadoPedido con el nuevo estado 'Cancelado'.

module.exports = {
    crearPedidoConDetalles,
    actualizarEstadoPedido,
    obtenerPedidoPorId,
    obtenerTodosLosPedidos,
    registrarTransaccionWebpay,
    crearRegistroPagoInicial,
    obtenerPedidoPorCodigo,
    obtenerDetallesPorPedidoId,
    obtenerIdPagoPorPedidoIdYEstado,
    actualizarEstadoPago,
    // cancelarPedido,
};
