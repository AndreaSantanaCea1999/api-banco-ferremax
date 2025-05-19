// src/controllers/pagos.controller.js
const pool = require('../config/database');
const { config } = require('../config/config');
const axios = require('axios');

/**
 * Obtiene todos los pagos con filtrado opcional
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerPagos = async (req, res) => {
  try {
    const { metodoPago, estado, pedidoId, fechaInicio, fechaFin } = req.query;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    
    // Construir la consulta base
    let query = `
      SELECT p.*, pe.Codigo_Pedido, c.Nombre as NombreCliente, d.Codigo as CodigoDivisa
      FROM PAGOS p
      LEFT JOIN PEDIDOS pe ON p.ID_Pedido = pe.ID_Pedido
      LEFT JOIN CLIENTES c ON pe.ID_Cliente = c.ID_Cliente
      LEFT JOIN DIVISAS d ON p.ID_Divisa = d.ID_Divisa
      WHERE 1=1
    `;
    let params = [];
    
    // Añadir filtros si existen
    if (metodoPago) {
      query += ' AND p.Metodo_Pago = ?';
      params.push(metodoPago);
    }
    
    if (estado) {
      query += ' AND p.Estado = ?';
      params.push(estado);
    }
    
    if (pedidoId) {
      query += ' AND p.ID_Pedido = ?';
      params.push(pedidoId);
    }
    
    if (fechaInicio && fechaFin) {
      query += ' AND p.Fecha_Pago BETWEEN ? AND ?';
      params.push(fechaInicio, fechaFin);
    } else if (fechaInicio) {
      query += ' AND p.Fecha_Pago >= ?';
      params.push(fechaInicio);
    } else if (fechaFin) {
      query += ' AND p.Fecha_Pago <= ?';
      params.push(fechaFin);
    }
    
    // Añadir ordenamiento y paginación
    query += ' ORDER BY p.Fecha_Pago DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    // Ejecutar la consulta
    const [pagos] = await pool.execute(query, params);
    
    // Contar total de registros para paginación
    let queryCount = `
      SELECT COUNT(*) as total 
      FROM PAGOS p
      LEFT JOIN PEDIDOS pe ON p.ID_Pedido = pe.ID_Pedido
      WHERE 1=1
    `;
    let paramsCount = [];
    
    if (metodoPago) {
      queryCount += ' AND p.Metodo_Pago = ?';
      paramsCount.push(metodoPago);
    }
    
    if (estado) {
      queryCount += ' AND p.Estado = ?';
      paramsCount.push(estado);
    }
    
    if (pedidoId) {
      queryCount += ' AND p.ID_Pedido = ?';
      paramsCount.push(pedidoId);
    }
    
    if (fechaInicio && fechaFin) {
      queryCount += ' AND p.Fecha_Pago BETWEEN ? AND ?';
      paramsCount.push(fechaInicio, fechaFin);
    } else if (fechaInicio) {
      queryCount += ' AND p.Fecha_Pago >= ?';
      paramsCount.push(fechaInicio);
    } else if (fechaFin) {
      queryCount += ' AND p.Fecha_Pago <= ?';
      paramsCount.push(fechaFin);
    }
    
    const [countResult] = await pool.execute(queryCount, paramsCount);
    const totalRegistros = countResult[0].total;
    
    res.status(200).json({
      total: totalRegistros,
      paginaActual: page,
      totalPaginas: Math.ceil(totalRegistros / limit),
      registrosPorPagina: limit,
      pagos
    });
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({
      error: 'Error al obtener pagos',
      message: error.message
    });
  }
};

/**
 * Obtiene un pago específico por su ID
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerPagoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el ID sea un número válido
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'ID no válido',
        message: 'El ID del pago debe ser un número'
      });
    }
    
    // Obtener pago por ID con información relacionada
    const [pagos] = await pool.execute(
      `SELECT p.*, pe.Codigo_Pedido, pe.Estado as EstadoPedido, 
              c.Nombre as NombreCliente, c.Email as EmailCliente,
              d.Codigo as CodigoDivisa, d.Nombre as NombreDivisa
       FROM PAGOS p
       LEFT JOIN PEDIDOS pe ON p.ID_Pedido = pe.ID_Pedido
       LEFT JOIN CLIENTES c ON pe.ID_Cliente = c.ID_Cliente
       LEFT JOIN DIVISAS d ON p.ID_Divisa = d.ID_Divisa
       WHERE p.ID_Pago = ?`,
      [id]
    );
    
    if (pagos.length === 0) {
      return res.status(404).json({
        error: 'Pago no encontrado',
        message: `No se encontró un pago con el ID ${id}`
      });
    }
    
    const pago = pagos[0];
    
    // Si es un pago con Webpay, obtener detalles de la transacción
    if (pago.Metodo_Pago === 'Webpay') {
      const [transaccionesWebpay] = await pool.execute(
        `SELECT * FROM WEBPAY_TRANSACCIONES WHERE ID_Pago = ?`,
        [id]
      );
      
      if (transaccionesWebpay.length > 0) {
        pago.detallesWebpay = transaccionesWebpay[0];
        // Parsear JSON_Respuesta si existe
        if (pago.detallesWebpay.JSON_Respuesta) {
          try {
            pago.detallesWebpay.JSON_Respuesta = JSON.parse(pago.detallesWebpay.JSON_Respuesta);
          } catch (e) {
            console.warn(`No se pudo parsear JSON_Respuesta para ID_Pago ${id}`);
          }
        }
      }
    }
    
    res.status(200).json(pago);
  } catch (error) {
    console.error(`Error al obtener pago ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Error al obtener pago',
      message: error.message
    });
  }
};

/**
 * Crea un nuevo pago
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.crearPago = async (req, res) => {
  try {
    const { ID_Pedido, Metodo_Pago, Monto, ID_Divisa, Estado } = req.body;
    
    // Validar campos obligatorios
    if (!ID_Pedido || !Metodo_Pago || !Monto || !ID_Divisa) {
      return res.status(400).json({
        error: 'Campos obligatorios faltantes',
        message: 'ID_Pedido, Metodo_Pago, Monto y ID_Divisa son campos obligatorios'
      });
    }
    
    // Verificar que el pedido existe
    const [pedidos] = await pool.execute(
      'SELECT * FROM PEDIDOS WHERE ID_Pedido = ?',
      [ID_Pedido]
    );
    
    if (pedidos.length === 0) {
      return res.status(404).json({
        error: 'Pedido no encontrado',
        message: `No se encontró un pedido con el ID ${ID_Pedido}`
      });
    }
    
    // Verificar que la divisa existe
    const [divisas] = await pool.execute(
      'SELECT * FROM DIVISAS WHERE ID_Divisa = ?',
      [ID_Divisa]
    );
    
    if (divisas.length === 0) {
      return res.status(404).json({
        error: 'Divisa no encontrada',
        message: `No se encontró una divisa con el ID ${ID_Divisa}`
      });
    }
    
    // Insertar nuevo pago
    const [result] = await pool.execute(
      `INSERT INTO PAGOS (ID_Pedido, Fecha_Pago, Metodo_Pago, Monto, ID_Divisa, Estado)
       VALUES (?, NOW(), ?, ?, ?, ?)`,
      [
        ID_Pedido,
        Metodo_Pago,
        Monto,
        ID_Divisa,
        Estado || 'Pendiente'
      ]
    );
    
    // Obtener el pago recién creado
    const [nuevoPago] = await pool.execute(
      `SELECT p.*, pe.Codigo_Pedido, d.Codigo as CodigoDivisa
       FROM PAGOS p
       LEFT JOIN PEDIDOS pe ON p.ID_Pedido = pe.ID_Pedido
       LEFT JOIN DIVISAS d ON p.ID_Divisa = d.ID_Divisa
       WHERE p.ID_Pago = ?`,
      [result.insertId]
    );
    
    res.status(201).json({
      mensaje: 'Pago creado exitosamente',
      pago: nuevoPago[0]
    });
  } catch (error) {
    console.error('Error al crear pago:', error);
    res.status(500).json({
      error: 'Error al crear pago',
      message: error.message
    });
  }
};

/**
 * Actualiza el estado de un pago
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.actualizarEstadoPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { Estado, Comentario } = req.body;
    
    // Verificar que el ID sea un número válido
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'ID no válido',
        message: 'El ID del pago debe ser un número'
      });
    }
    
    // Verificar que el estado sea válido
    const estadosValidos = ['Pendiente', 'Completado', 'Rechazado', 'Anulado'];
    if (!estadosValidos.includes(Estado)) {
      return res.status(400).json({
        error: 'Estado no válido',
        message: `El estado debe ser uno de: ${estadosValidos.join(', ')}`
      });
    }
    
    // Verificar si el pago existe
    const [pagos] = await pool.execute(
      'SELECT * FROM PAGOS WHERE ID_Pago = ?',
      [id]
    );
    
    if (pagos.length === 0) {
      return res.status(404).json({
        error: 'Pago no encontrado',
        message: `No se encontró un pago con el ID ${id}`
      });
    }
    
    const pagoActual = pagos[0];
    
    // No permitir actualizar pagos ya completados o anulados
    if (pagoActual.Estado === 'Completado' || pagoActual.Estado === 'Anulado') {
      return res.status(400).json({
        error: 'Pago no modificable',
        message: `No se puede modificar un pago en estado ${pagoActual.Estado}`
      });
    }
    
    // Actualizar estado del pago
    await pool.execute(
      'UPDATE PAGOS SET Estado = ?, Ultima_Actualizacion = NOW() WHERE ID_Pago = ?',
      [Estado, id]
    );
    
    // Si el pago se ha completado, actualizar el pedido correspondiente
    if (Estado === 'Completado' && pagoActual.ID_Pedido) {
      // Obtener total del pedido
      const [pedidos] = await pool.execute(
        'SELECT Total FROM PEDIDOS WHERE ID_Pedido = ?',
        [pagoActual.ID_Pedido]
      );
      
      if (pedidos.length > 0) {
        const totalPedido = parseFloat(pedidos[0].Total);
        
        // Obtener suma de pagos completados para el pedido
        const [pagosCompletados] = await pool.execute(
          `SELECT SUM(Monto) as totalPagado
           FROM PAGOS 
           WHERE ID_Pedido = ? AND Estado = 'Completado'`,
          [pagoActual.ID_Pedido]
        );
        
        const totalPagado = parseFloat(pagosCompletados[0].totalPagado || 0);
        
        // Determinar nuevo estado del pedido según pagos
        let nuevoPedidoEstado = null;
        
        if (totalPagado >= totalPedido) {
          nuevoPedidoEstado = 'Pagado';
        } else if (totalPagado > 0) {
          nuevoPedidoEstado = 'Pago Parcial';
        }
        
        // Actualizar estado del pedido si corresponde
        if (nuevoPedidoEstado) {
          await pool.execute(
            'UPDATE PEDIDOS SET Estado = ? WHERE ID_Pedido = ?',
            [nuevoPedidoEstado, pagoActual.ID_Pedido]
          );
          
          // Registrar cambio en historial
          await pool.execute(
            `INSERT INTO HISTORICO_ESTADOS_PEDIDO 
             (ID_Pedido, Estado_Anterior, Estado_Nuevo, Fecha_Cambio, Comentario)
             VALUES (?, ?, ?, NOW(), ?)`,
            [
              pagoActual.ID_Pedido,
              pedidos[0].Estado,
              nuevoPedidoEstado,
              `Actualización automática por pago ID ${id} completado`
            ]
          );
        }
      }
    }
    
    // Registrar comentario si se proporciona
    if (Comentario) {
      await pool.execute(
        `INSERT INTO HISTORICO_PAGOS 
         (ID_Pago, Estado_Anterior, Estado_Nuevo, Fecha_Cambio, Comentario)
         VALUES (?, ?, ?, NOW(), ?)`,
        [id, pagoActual.Estado, Estado, Comentario]
      );
    }
    
    // Obtener el pago actualizado
    const [pagoActualizado] = await pool.execute(
      `SELECT p.*, pe.Codigo_Pedido, pe.Estado as EstadoPedido,
              c.Nombre as NombreCliente, d.Codigo as CodigoDivisa
       FROM PAGOS p
       LEFT JOIN PEDIDOS pe ON p.ID_Pedido = pe.ID_Pedido
       LEFT JOIN CLIENTES c ON pe.ID_Cliente = c.ID_Cliente
       LEFT JOIN DIVISAS d ON p.ID_Divisa = d.ID_Divisa
       WHERE p.ID_Pago = ?`,
      [id]
    );
    
    res.status(200).json({
      mensaje: `Estado del pago actualizado a ${Estado}`,
      pago: pagoActualizado[0]
    });
  } catch (error) {
    console.error(`Error al actualizar estado del pago ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Error al actualizar estado del pago',
      message: error.message
    });
  }
};

/**
 * Procesa un pago con Webpay
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.procesarPagoWebpay = async (req, res) => {
  try {
    const { ID_Pedido, returnUrl, sessionId } = req.body;
    
    // Validar campos obligatorios
    if (!ID_Pedido || !returnUrl) {
      return res.status(400).json({
        error: 'Campos obligatorios faltantes',
        message: 'ID_Pedido y returnUrl son campos obligatorios'
      });
    }
    
    // Verificar que el pedido existe
    const [pedidos] = await pool.execute(
      'SELECT p.*, d.Codigo as CodigoDivisa FROM PEDIDOS p JOIN DIVISAS d ON p.ID_Divisa = d.ID_Divisa WHERE p.ID_Pedido = ?',
      [ID_Pedido]
    );
    
    if (pedidos.length === 0) {
      return res.status(404).json({
        error: 'Pedido no encontrado',
        message: `No se encontró un pedido con el ID ${ID_Pedido}`
      });
    }
    
    const pedido = pedidos[0];
    
    // Verificar que el pedido esté en un estado válido para procesar pago
    const estadosValidosPago = ['Pendiente', 'Pago Parcial'];
    if (!estadosValidosPago.includes(pedido.Estado)) {
      return res.status(400).json({
        error: 'Estado de pedido no válido para pago',
        message: `No se puede procesar pago para un pedido en estado ${pedido.Estado}`
      });
    }
    
    // Crear registro de pago pendiente
    const [resultPago] = await pool.execute(
      `INSERT INTO PAGOS (ID_Pedido, Fecha_Pago, Metodo_Pago, Monto, ID_Divisa, Estado)
       VALUES (?, NOW(), 'Webpay', ?, ?, 'Pendiente')`,
      [ID_Pedido, pedido.Total, pedido.ID_Divisa]
    );
    
    const idPago = resultPago.insertId;
    
    // Generar session_id único si no se proporcionó
    const sessionIdFinal = sessionId || `SESSION_${ID_Pedido}_${Date.now()}`;
    
    // Configurar conexión con Webpay
    const webpayConfig = {
      commerceCode: config.webpay.commerceCode,
      apiKey: config.webpay.apiKey
    };
    
    // ADVERTENCIA: Este es un ejemplo de integración, no incluye la implementación real de Webpay
    // En una implementación real, aquí se llamaría a la API de Webpay para iniciar una transacción
    
    // Simulamos una respuesta exitosa de Webpay
    const respuestaWebpay = {
      token: `SIMULACION_TOKEN_${Date.now()}`,
      url: `${returnUrl}?token_ws=SIMULACION_TOKEN_${Date.now()}`
    };
    
    // Registrar la transacción en la tabla WEBPAY_TRANSACCIONES
    await pool.execute(
      `INSERT INTO WEBPAY_TRANSACCIONES 
       (ID_Pago, Token_Webpay, Orden_Compra, Fecha_Transaccion)
       VALUES (?, ?, ?, NOW())`,
      [idPago, respuestaWebpay.token, pedido.Codigo_Pedido]
    );
    
    res.status(200).json({
      mensaje: 'Proceso de pago Webpay iniciado correctamente',
      idPago,
      token: respuestaWebpay.token,
      url: respuestaWebpay.url
    });
  } catch (error) {
    console.error('Error al procesar pago con Webpay:', error);
    res.status(500).json({
      error: 'Error al procesar pago con Webpay',
      message: error.message
    });
  }
};

/**
 * Genera informe de pagos por período
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.generarInformePagos = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, metodoPago, sucursalId } = req.query;
    
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        error: 'Parámetros incompletos',
        message: 'Se requieren fechaInicio y fechaFin para generar el informe'
      });
    }
    
    // Construir consulta base
    let query = `
      SELECT 
        p.ID_Pago, p.Fecha_Pago, p.Metodo_Pago, p.Monto, p.Estado,
        pe.Codigo_Pedido, pe.ID_Sucursal,
        s.Nombre as NombreSucursal,
        c.Nombre as NombreCliente,
        d.Codigo as CodigoDivisa
      FROM PAGOS p
      JOIN PEDIDOS pe ON p.ID_Pedido = pe.ID_Pedido
      JOIN CLIENTES c ON pe.ID_Cliente = c.ID_Cliente
      JOIN DIVISAS d ON p.ID_Divisa = d.ID_Divisa
      LEFT JOIN SUCURSALES s ON pe.ID_Sucursal = s.ID_Sucursal
      WHERE p.Fecha_Pago BETWEEN ? AND ?
    `;
    
    let params = [fechaInicio, fechaFin];
    
    // Añadir filtros adicionales
    if (metodoPago) {
      query += ' AND p.Metodo_Pago = ?';
      params.push(metodoPago);
    }
    
    if (sucursalId) {
      query += ' AND pe.ID_Sucursal = ?';
      params.push(sucursalId);
    }
    
    // Ordenar por fecha
    query += ' ORDER BY p.Fecha_Pago DESC';
    
    // Ejecutar consulta
    const [pagos] = await pool.execute(query, params);
    
    // Generar estadísticas
    const totalPagos = pagos.length;
    let montoTotal = 0;
    
    const estadoPagos = {
      Completado: 0,
      Pendiente: 0,
      Rechazado: 0,
      Anulado: 0
    };
    
    const metodoPagos = {};
    const sucursales = {};
    const pagosPorDia = {};
    
    pagos.forEach(pago => {
      // Sumar monto total
      montoTotal += parseFloat(pago.Monto);
      
      // Contar por estado
      if (estadoPagos[pago.Estado] !== undefined) {
        estadoPagos[pago.Estado]++;
      }
      
      // Contar por método de pago
      if (!metodoPagos[pago.Metodo_Pago]) {
        metodoPagos[pago.Metodo_Pago] = {
          cantidad: 0,
          monto: 0
        };
      }
      metodoPagos[pago.Metodo_Pago].cantidad++;
      metodoPagos[pago.Metodo_Pago].monto += parseFloat(pago.Monto);
      
      // Contar por sucursal
      if (pago.ID_Sucursal) {
        const sucursalKey = `${pago.ID_Sucursal} - ${pago.NombreSucursal || 'Desconocido'}`;
        if (!sucursales[sucursalKey]) {
          sucursales[sucursalKey] = {
            cantidad: 0,
            monto: 0
          };
        }
        sucursales[sucursalKey].cantidad++;
        sucursales[sucursalKey].monto += parseFloat(pago.Monto);
      }
      
      // Agrupar por día
      const fechaPago = new Date(pago.Fecha_Pago);
      const fechaKey = fechaPago.toISOString().split('T')[0];
      if (!pagosPorDia[fechaKey]) {
        pagosPorDia[fechaKey] = {
          cantidad: 0,
          monto: 0
        };
      }
      pagosPorDia[fechaKey].cantidad++;
      pagosPorDia[fechaKey].monto += parseFloat(pago.Monto);
    });
    
    res.status(200).json({
      periodo: {
        fechaInicio,
        fechaFin,
        metodoPago: metodoPago || 'Todos',
        sucursalId: sucursalId || 'Todas'
      },
      resumen: {
        totalPagos,
        montoTotal: montoTotal.toFixed(2),
        promedioPorPago: totalPagos > 0 ? (montoTotal / totalPagos).toFixed(2) : 0
      },
      estadisticas: {
        porEstado: estadoPagos,
        porMetodoPago: metodoPagos,
        porSucursal: sucursales,
        porDia: pagosPorDia
      },
      detalle: pagos
    });
  } catch (error) {
    console.error('Error al generar informe de pagos:', error);
    res.status(500).json({
      error: 'Error al generar informe de pagos',
      message: error.message
    });
  }
};

module.exports = {
  obtenerPagos,
  obtenerPagoPorId,
  crearPago,
  actualizarEstadoPago,
  procesarPagoWebpay,
  generarInformePagos
};