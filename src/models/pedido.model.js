// src/models/pedido.model.js
const pool = require('../config/database');

/**
 * Crea un nuevo pedido con sus detalles, usando una transacción para garantizar integridad
 * @param {Object} datosPedido - Datos del pedido principal
 * @param {Array} detallesItems - Datos de los ítems del pedido
 * @returns {Promise<Object>} - Pedido creado con su ID
 */
async function crearPedidoConDetalles(datosPedido, detallesItems) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Calcular totales
    let subtotal = 0;
    let impuestos = 0;
    let descuentoTotal = 0;

    detallesItems.forEach(item => {
      subtotal += item.subtotalItem;
      impuestos += item.impuestoItem || 0;
      descuentoTotal += item.descuentoItem || 0;
    });

    // Calcular costo de envío según método de entrega
    const costoEnvio = datosPedido.metodoEntrega === 'Despacho_Domicilio' ? 5000 : 0;
    
    // Calcular total
    const total = subtotal - descuentoTotal + impuestos + costoEnvio;

    // 1. Generar código de pedido único
    const codigoPedido = `PED-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // 2. Insertar en PEDIDOS
    const [pedidoResult] = await connection.execute(
      `INSERT INTO PEDIDOS (
        Codigo_Pedido, ID_Cliente, ID_Sucursal, ID_Usuario, 
        Fecha_Pedido, Canal, Estado, Metodo_Entrega, 
        Direccion_Entrega, Ciudad_Entrega, Region_Entrega, Pais_Entrega, 
        Comentarios, Subtotal, Descuento, Impuestos, 
        Costo_Envio, Total, ID_Divisa, Fecha_Estimada_Entrega, Prioridad
      ) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        codigoPedido,
        datosPedido.clienteId,
        datosPedido.sucursalId,
        datosPedido.usuarioId,
        datosPedido.canal || 'Online',
        'Pendiente', // Estado inicial
        datosPedido.metodoEntrega || 'Despacho_Domicilio',
        datosPedido.direccionEntrega || null,
        datosPedido.ciudadEntrega || null,
        datosPedido.regionEntrega || null,
        datosPedido.paisEntrega || 'Chile',
        datosPedido.comentarios || null,
        subtotal,
        descuentoTotal,
        impuestos,
        costoEnvio,
        total,
        datosPedido.idDivisa || 1, // Default a CLP
        datosPedido.fechaEstimadaEntrega || null,
        datosPedido.prioridad || 'Normal'
      ]
    );

    const pedidoId = pedidoResult.insertId;

    // 3. Insertar detalles del pedido
    for (const item of detallesItems) {
      await connection.execute(
        `INSERT INTO DETALLES_PEDIDO (
          ID_Pedido, ID_Producto, Cantidad, Precio_Unitario, 
          Descuento, Impuesto, Subtotal, Estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pedidoId,
          item.productoIdExterno,
          item.cantidad,
          item.precioUnitario,
          item.descuentoItem || 0,
          item.impuestoItem || 0,
          item.subtotalItem,
          'Pendiente' // Estado inicial
        ]
      );
    }

    // 4. Insertar en histórico de estados
    await connection.execute(
      `INSERT INTO HISTORICO_ESTADOS_PEDIDO (
        ID_Pedido, Estado_Nuevo, Fecha_Cambio, ID_Usuario, Comentario
      ) VALUES (?, ?, NOW(), ?, ?)`,
      [
        pedidoId, 
        'Pendiente', 
        datosPedido.usuarioId,
        'Pedido creado inicialmente'
      ]
    );

    await connection.commit();

    // Devolver el pedido completo
    return {
      id: pedidoId,
      codigoPedido,
      clienteId: datosPedido.clienteId,
      sucursalId: datosPedido.sucursalId,
      subtotal,
      descuento: descuentoTotal,
      impuestos,
      costoEnvio,
      total,
      estado: 'Pendiente',
      metodoEntrega: datosPedido.metodoEntrega || 'Despacho_Domicilio',
      fechaCreacion: new Date(),
      items: detallesItems,
      idDivisa: datosPedido.idDivisa || 1
    };
  } catch (error) {
    await connection.rollback();
    console.error('Error en pedido.model.crearPedidoConDetalles:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Registra un pago inicial para un pedido
 * @param {number} idPedido - ID del pedido
 * @param {number} monto - Monto del pago
 * @param {number} idDivisa - ID de la divisa
 * @param {string} metodoPago - Método de pago
 * @returns {Promise<number>} - ID del pago creado
 */
async function crearRegistroPagoInicial(idPedido, monto, idDivisa, metodoPago = 'Webpay') {
  try {
    const [result] = await pool.execute(
      `INSERT INTO PAGOS (ID_Pedido, Fecha_Pago, Metodo_Pago, Monto, ID_Divisa, Estado)
       VALUES (?, NOW(), ?, ?, ?, 'Pendiente')`,
      [idPedido, metodoPago, monto, idDivisa]
    );
    
    return result.insertId;
  } catch (error) {
    console.error(`Error en pedido.model.crearRegistroPagoInicial: ${idPedido}`, error);
    throw error;
  }
}

/**
 * Actualiza el estado de un pedido y registra el cambio en el histórico
 * @param {number} idPedido - ID del pedido a actualizar
 * @param {string} nuevoEstado - Nuevo estado del pedido
 * @param {number} usuarioId - ID del usuario que realiza el cambio
 * @param {string} comentario - Comentario sobre el cambio
 * @returns {Promise<boolean>} - true si se actualizó, false si no se encontró
 */
async function actualizarEstadoPedido(idPedido, nuevoEstado, usuarioId, comentario = '') {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Obtener estado actual
    const [pedidoActualRows] = await connection.execute(
      'SELECT Estado FROM PEDIDOS WHERE ID_Pedido = ?', 
      [idPedido]
    );
    
    if (pedidoActualRows.length === 0) {
      await connection.rollback();
      return false; // Pedido no encontrado
    }
    
    const estadoAnterior = pedidoActualRows[0].Estado;

    // Actualizar estado
    await connection.execute(
      'UPDATE PEDIDOS SET Estado = ? WHERE ID_Pedido = ?',
      [nuevoEstado, idPedido]
    );

    // Registrar en histórico
    await connection.execute(
      `INSERT INTO HISTORICO_ESTADOS_PEDIDO (
        ID_Pedido, Estado_Anterior, Estado_Nuevo, 
        Fecha_Cambio, ID_Usuario, Comentario
      ) VALUES (?, ?, ?, NOW(), ?, ?)`,
      [idPedido, estadoAnterior, nuevoEstado, usuarioId, comentario]
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.error(`Error en pedido.model.actualizarEstadoPedido: ${idPedido}`, error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Obtiene un pedido específico por su ID con todos los detalles
 * @param {number} idPedido - ID del pedido a obtener
 * @returns {Promise<Object|null>} - Pedido completo o null si no existe
 */
async function obtenerPedidoPorId(idPedido) {
  try {
    // 1. Obtener datos del pedido
    const [pedidos] = await pool.execute(
      `SELECT p.*, 
        c.Nombre AS NombreCliente, c.Email AS EmailCliente,
        s.Nombre AS NombreSucursal,
        d.Codigo AS CodigoDivisa, d.Nombre AS NombreDivisa
       FROM PEDIDOS p
       LEFT JOIN CLIENTES c ON p.ID_Cliente = c.ID_Cliente
       LEFT JOIN SUCURSALES s ON p.ID_Sucursal = s.ID_Sucursal
       LEFT JOIN DIVISAS d ON p.ID_Divisa = d.ID_Divisa
       WHERE p.ID_Pedido = ?`,
      [idPedido]
    );

    if (pedidos.length === 0) {
      return null; // Pedido no encontrado
    }

    const pedido = pedidos[0];

    // 2. Obtener detalles del pedido
    const [detalles] = await pool.execute(
      `SELECT dp.ID_Detalle, dp.ID_Producto, dp.Cantidad, 
        dp.Precio_Unitario, dp.Descuento, dp.Impuesto, 
        dp.Subtotal, dp.Estado
       FROM DETALLES_PEDIDO dp
       WHERE dp.ID_Pedido = ?`,
      [idPedido]
    );

    // 3. Obtener historial de estados
    const [historial] = await pool.execute(
      `SELECT he.ID_Historico, he.Estado_Anterior, he.Estado_Nuevo, 
        he.Fecha_Cambio, he.ID_Usuario, he.Comentario
       FROM HISTORICO_ESTADOS_PEDIDO he
       WHERE he.ID_Pedido = ?
       ORDER BY he.Fecha_Cambio DESC`,
      [idPedido]
    );

    // 4. Obtener información de pagos
    const [pagos] = await pool.execute(
      `SELECT p.ID_Pago, p.Fecha_Pago, p.Metodo_Pago, 
        p.Monto, p.Estado, d.Codigo AS CodigoDivisa
       FROM PAGOS p
       JOIN DIVISAS d ON p.ID_Divisa = d.ID_Divisa
       WHERE p.ID_Pedido = ?
       ORDER BY p.Fecha_Pago DESC`,
      [idPedido]
    );

    // Construir respuesta completa
    return {
      ...pedido,
      detalles,
      historialEstados: historial,
      pagos
    };
  } catch (error) {
    console.error(`Error en pedido.model.obtenerPedidoPorId: ${idPedido}`, error);
    throw error;
  }
}

/**
 * Obtiene una lista de pedidos con filtros y paginación
 * @param {Object} filtros - Filtros a aplicar
 * @param {Object} paginacion - Opciones de paginación {limit, offset}
 * @returns {Promise<Array>} - Lista de pedidos
 */
async function obtenerTodosLosPedidos(filtros = {}, paginacion = { limit: 10, offset: 0 }) {
  try {
    let query = `
      SELECT p.ID_Pedido, p.Codigo_Pedido, p.Fecha_Pedido, 
        p.ID_Cliente, c.Nombre AS NombreCliente,
        p.ID_Sucursal, s.Nombre AS NombreSucursal,
        p.Estado, p.Total, p.Metodo_Entrega,
        d.Codigo AS CodigoDivisa
      FROM PEDIDOS p
      LEFT JOIN CLIENTES c ON p.ID_Cliente = c.ID_Cliente
      LEFT JOIN SUCURSALES s ON p.ID_Sucursal = s.ID_Sucursal
      LEFT JOIN DIVISAS d ON p.ID_Divisa = d.ID_Divisa
      WHERE 1=1
    `;
    
    let queryParams = [];
    
    // Aplicar filtros
    if (filtros.clienteId) {
      query += ' AND p.ID_Cliente = ?';
      queryParams.push(filtros.clienteId);
    }
    
    if (filtros.estado) {
      query += ' AND p.Estado = ?';
      queryParams.push(filtros.estado);
    }
    
    if (filtros.fecha && (filtros.fecha.desde || filtros.fecha.hasta)) {
      if (filtros.fecha.desde) {
        query += ' AND p.Fecha_Pedido >= ?';
        queryParams.push(filtros.fecha.desde);
      }
      
      if (filtros.fecha.hasta) {
        query += ' AND p.Fecha_Pedido <= ?';
        queryParams.push(filtros.fecha.hasta);
      }
    }
    
    // Ordenar y paginar
    query += ' ORDER BY p.Fecha_Pedido DESC LIMIT ? OFFSET ?';
    queryParams.push(paginacion.limit, paginacion.offset);
    
    // Ejecutar consulta
    const [pedidos] = await pool.execute(query, queryParams);
    
    return pedidos;
  } catch (error) {
    console.error('Error en pedido.model.obtenerTodosLosPedidos:', error);
    throw error;
  }
}

/**
 * Registra una transacción de Webpay
 * @param {Object} datosTransaccion - Datos de la transacción
 * @returns {Promise<number>} - ID de la transacción creada
 */
async function registrarTransaccionWebpay(datosTransaccion) {
  try {
    const [result] = await pool.execute(
      `INSERT INTO WEBPAY_TRANSACCIONES (
        ID_Pago, Token_Webpay, Orden_Compra, 
        Tarjeta_Tipo, Tarjeta_Numero, Autorizacion_Codigo,
        Respuesta_Codigo, Respuesta_Descripcion, 
        Fecha_Transaccion, Installments, JSON_Respuesta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [
        datosTransaccion.idPago || null,
        datosTransaccion.tokenWebpay,
        datosTransaccion.ordenCompra,
        datosTransaccion.tipoTarjeta || null,
        datosTransaccion.numeroTarjeta || null,
        datosTransaccion.codigoAutorizacion || null,
        datosTransaccion.codigoRespuesta || null,
        datosTransaccion.descripcionRespuesta || null,
        datosTransaccion.cuotas || 1,
        JSON.stringify(datosTransaccion.jsonRespuestaCompleta) || null
      ]
    );
    
    return result.insertId;
  } catch (error) {
    console.error('Error en pedido.model.registrarTransaccionWebpay:', error);
    throw error;
  }
}

/**
 * Obtiene un pedido por su código
 * @param {string} codigoPedido - Código único del pedido
 * @returns {Promise<Object|null>} - Pedido o null si no existe
 */
async function obtenerPedidoPorCodigo(codigoPedido) {
  try {
    const [pedidos] = await pool.execute(
      `SELECT ID_Pedido, Codigo_Pedido, ID_Cliente, 
        ID_Sucursal, ID_Usuario, Estado
       FROM PEDIDOS
       WHERE Codigo_Pedido = ?`,
      [codigoPedido]
    );
    
    return pedidos.length > 0 ? pedidos[0] : null;
  } catch (error) {
    console.error(`Error en pedido.model.obtenerPedidoPorCodigo: ${codigoPedido}`, error);
    throw error;
  }
}

/**
 * Obtiene los detalles (items) de un pedido específico
 * @param {number} idPedido - ID del pedido
 * @returns {Promise<Array>} - Detalles del pedido
 */
async function obtenerDetallesPorPedidoId(idPedido) {
  try {
    const [detalles] = await pool.execute(
      `SELECT ID_Producto AS ProductoIdExterno, Cantidad
       FROM DETALLES_PEDIDO
       WHERE ID_Pedido = ?`,
      [idPedido]
    );
    
    return detalles;
  } catch (error) {
    console.error(`Error en pedido.model.obtenerDetallesPorPedidoId: ${idPedido}`, error);
    throw error;
  }
}

/**
 * Obtiene el ID de un pago pendiente para un pedido
 * @param {number} idPedido - ID del pedido
 * @param {string} estado - Estado del pago a buscar
 * @returns {Promise<number|null>} - ID del pago o null si no existe
 */
async function obtenerIdPagoPorPedidoIdYEstado(idPedido, estado = 'Pendiente') {
  try {
    const [pagos] = await pool.execute(
      `SELECT ID_Pago 
       FROM PAGOS 
       WHERE ID_Pedido = ? AND Estado = ?
       ORDER BY Fecha_Pago DESC 
       LIMIT 1`,
      [idPedido, estado]
    );
    
    return pagos.length > 0 ? pagos[0].ID_Pago : null;
  } catch (error) {
    console.error(`Error en pedido.model.obtenerIdPagoPorPedidoIdYEstado: ${idPedido}`, error);
    throw error;
  }
}

/**
 * Actualiza el estado de un pago
 * @param {number} idPago - ID del pago a actualizar
 * @param {string} nuevoEstado - Nuevo estado del pago
 * @returns {Promise<boolean>} - true si se actualizó, false si no
 */
async function actualizarEstadoPago(idPago, nuevoEstado) {
  try {
    const [result] = await pool.execute(
      'UPDATE PAGOS SET Estado = ? WHERE ID_Pago = ?',
      [nuevoEstado, idPago]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error(`Error en pedido.model.actualizarEstadoPago: ${idPago}`, error);
    throw error;
  }
}

/**
 * Cuenta el total de pedidos según filtros
 * @param {Object} filtros - Filtros a aplicar
 * @returns {Promise<number>} - Total de pedidos
 */
async function contarPedidos(filtros = {}) {
  try {
    let query = `
      SELECT COUNT(*) as total
      FROM PEDIDOS p
      WHERE 1=1
    `;
    
    let queryParams = [];
    
    // Aplicar filtros
    if (filtros.clienteId) {
      query += ' AND p.ID_Cliente = ?';
      queryParams.push(filtros.clienteId);
    }
    
    if (filtros.estado) {
      query += ' AND p.Estado = ?';
      queryParams.push(filtros.estado);
    }
    
    if (filtros.fecha && (filtros.fecha.desde || filtros.fecha.hasta)) {
      if (filtros.fecha.desde) {
        query += ' AND p.Fecha_Pedido >= ?';
        queryParams.push(filtros.fecha.desde);
      }
      
      if (filtros.fecha.hasta) {
        query += ' AND p.Fecha_Pedido <= ?';
        queryParams.push(filtros.fecha.hasta);
      }
    }
    
    // Ejecutar consulta
    const [result] = await pool.execute(query, queryParams);
    
    return result[0].total;
  } catch (error) {
    console.error('Error en pedido.model.contarPedidos:', error);
    throw error;
  }
}

module.exports = {
  crearPedidoConDetalles,
  crearRegistroPagoInicial,
  actualizarEstadoPedido,
  obtenerPedidoPorId,
  obtenerTodosLosPedidos,
  registrarTransaccionWebpay,
  obtenerPedidoPorCodigo,
  obtenerDetallesPorPedidoId,
  obtenerIdPagoPorPedidoIdYEstado,
  actualizarEstadoPago,
  contarPedidos
};