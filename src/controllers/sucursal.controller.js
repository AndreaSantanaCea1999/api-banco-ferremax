// src/controllers/sucursal.controller.js
const pool = require('../config/database');

/**
 * Obtiene todas las sucursales con filtrado opcional
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerSucursales = async (req, res) => {
  try {
    const { nombre, ciudad, region, estado } = req.query;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    
    // Construir la consulta base
    let query = 'SELECT * FROM SUCURSALES WHERE 1=1';
    let params = [];
    
    // Añadir filtros si existen
    if (nombre) {
      query += ' AND Nombre LIKE ?';
      params.push(`%${nombre}%`);
    }
    
    if (ciudad) {
      query += ' AND Ciudad LIKE ?';
      params.push(`%${ciudad}%`);
    }
    
    if (region) {
      query += ' AND Region LIKE ?';
      params.push(`%${region}%`);
    }
    
    if (estado) {
      query += ' AND Estado = ?';
      params.push(estado);
    } else {
      // Por defecto, solo sucursales activas
      query += ' AND Estado != "Inactiva"';
    }
    
    // Añadir paginación
    query += ' ORDER BY Nombre LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    // Ejecutar la consulta
    const [sucursales] = await pool.execute(query, params);
    
    // Contar total de registros para paginación
    let queryCount = 'SELECT COUNT(*) as total FROM SUCURSALES WHERE 1=1';
    let paramsCount = [];
    
    // Añadir los mismos filtros a la consulta de conteo
    if (nombre) {
      queryCount += ' AND Nombre LIKE ?';
      paramsCount.push(`%${nombre}%`);
    }
    
    if (ciudad) {
      queryCount += ' AND Ciudad LIKE ?';
      paramsCount.push(`%${ciudad}%`);
    }
    
    if (region) {
      queryCount += ' AND Region LIKE ?';
      paramsCount.push(`%${region}%`);
    }
    
    if (estado) {
      queryCount += ' AND Estado = ?';
      paramsCount.push(estado);
    } else {
      queryCount += ' AND Estado != "Inactiva"';
    }
    
    const [countResult] = await pool.execute(queryCount, paramsCount);
    const totalRegistros = countResult[0].total;
    
    res.status(200).json({
      total: totalRegistros,
      paginaActual: page,
      totalPaginas: Math.ceil(totalRegistros / limit),
      registrosPorPagina: limit,
      sucursales
    });
  } catch (error) {
    console.error('Error al obtener sucursales:', error);
    res.status(500).json({
      error: 'Error al obtener sucursales',
      message: error.message
    });
  }
};

/**
 * Obtiene una sucursal específica por su ID
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerSucursalPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el ID sea un número válido
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'ID no válido',
        message: 'El ID de la sucursal debe ser un número'
      });
    }
    
    // Obtener sucursal por ID
    const [sucursales] = await pool.execute(
      'SELECT * FROM SUCURSALES WHERE ID_Sucursal = ?',
      [id]
    );
    
    if (sucursales.length === 0) {
      return res.status(404).json({
        error: 'Sucursal no encontrada',
        message: `No se encontró una sucursal con el ID ${id}`
      });
    }
    
    const sucursal = sucursales[0];
    
    // Obtener métricas de la sucursal (pedidos y stock)
    const [pedidos] = await pool.execute(
      `SELECT COUNT(*) as totalPedidos, SUM(Total) as montoTotal
       FROM PEDIDOS WHERE ID_Sucursal = ?`,
      [id]
    );
    
    // Intentar obtener datos de inventario desde la API de inventario
    let inventario = null;
    try {
      const inventarioApiUrl = process.env.API_INVENTARIO_URL;
      if (inventarioApiUrl) {
        const response = await axios.get(`${inventarioApiUrl}/inventario/sucursal/${id}`);
        if (response.data && response.data.success) {
          inventario = response.data.data;
        }
      }
    } catch (inventarioError) {
      console.warn(`No se pudo obtener inventario de la sucursal ${id}:`, inventarioError.message);
    }
    
    // Incluir métricas e inventario en la respuesta
    sucursal.metricas = {
      totalPedidos: pedidos[0].totalPedidos || 0,
      montoTotal: pedidos[0].montoTotal || 0
    };
    
    if (inventario) {
      sucursal.inventario = inventario;
    }
    
    res.status(200).json(sucursal);
  } catch (error) {
    console.error(`Error al obtener sucursal ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Error al obtener sucursal',
      message: error.message
    });
  }
};

/**
 * Crea una nueva sucursal
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.crearSucursal = async (req, res) => {
  try {
    const { Nombre, Direccion, Ciudad, Region, Telefono, Email, Horario, Estado } = req.body;
    
    // Validar campos obligatorios
    if (!Nombre || !Direccion || !Ciudad || !Region) {
      return res.status(400).json({
        error: 'Campos obligatorios faltantes',
        message: 'Nombre, Direccion, Ciudad y Region son campos obligatorios'
      });
    }
    
    // Verificar si ya existe una sucursal con el mismo nombre
    const [sucursalesExistentes] = await pool.execute(
      'SELECT ID_Sucursal, Nombre FROM SUCURSALES WHERE Nombre = ?',
      [Nombre]
    );
    
    if (sucursalesExistentes.length > 0) {
      return res.status(409).json({
        error: 'Nombre duplicado',
        message: `Ya existe una sucursal con el nombre ${Nombre}`
      });
    }
    
    // Insertar nueva sucursal
    const [result] = await pool.execute(
      `INSERT INTO SUCURSALES (Nombre, Direccion, Ciudad, Region, Telefono, Email, Horario, Estado, Fecha_Creacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        Nombre,
        Direccion,
        Ciudad,
        Region,
        Telefono || null,
        Email || null,
        Horario || null,
        Estado || 'Activa'
      ]
    );
    
    // Obtener la sucursal recién creada
    const [nuevaSucursal] = await pool.execute(
      'SELECT * FROM SUCURSALES WHERE ID_Sucursal = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      mensaje: 'Sucursal creada exitosamente',
      sucursal: nuevaSucursal[0]
    });
  } catch (error) {
    console.error('Error al crear sucursal:', error);
    res.status(500).json({
      error: 'Error al crear sucursal',
      message: error.message
    });
  }
};

/**
 * Actualiza una sucursal existente
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.actualizarSucursal = async (req, res) => {
  try {
    const { id } = req.params;
    const { Nombre, Direccion, Ciudad, Region, Telefono, Email, Horario, Estado } = req.body;
    
    // Verificar que el ID sea un número válido
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'ID no válido',
        message: 'El ID de la sucursal debe ser un número'
      });
    }
    
    // Verificar si la sucursal existe
    const [sucursales] = await pool.execute(
      'SELECT ID_Sucursal FROM SUCURSALES WHERE ID_Sucursal = ?',
      [id]
    );
    
    if (sucursales.length === 0) {
      return res.status(404).json({
        error: 'Sucursal no encontrada',
        message: `No se encontró una sucursal con el ID ${id}`
      });
    }
    
    // Si se está actualizando el nombre, verificar que no esté duplicado
    if (Nombre) {
      const [sucursalesExistentes] = await pool.execute(
        'SELECT ID_Sucursal, Nombre FROM SUCURSALES WHERE Nombre = ? AND ID_Sucursal != ?',
        [Nombre, id]
      );
      
      if (sucursalesExistentes.length > 0) {
        return res.status(409).json({
          error: 'Nombre duplicado',
          message: `Ya existe otra sucursal con el nombre ${Nombre}`
        });
      }
    }
    
    // Construir la consulta de actualización
    let updateFields = [];
    let updateParams = [];
    
    if (Nombre) {
      updateFields.push('Nombre = ?');
      updateParams.push(Nombre);
    }
    
    if (Direccion !== undefined) {
      updateFields.push('Direccion = ?');
      updateParams.push(Direccion);
    }
    
    if (Ciudad !== undefined) {
      updateFields.push('Ciudad = ?');
      updateParams.push(Ciudad);
    }
    
    if (Region !== undefined) {
      updateFields.push('Region = ?');
      updateParams.push(Region);
    }
    
    if (Telefono !== undefined) {
      updateFields.push('Telefono = ?');
      updateParams.push(Telefono);
    }
    
    if (Email !== undefined) {
      updateFields.push('Email = ?');
      updateParams.push(Email);
    }
    
    if (Horario !== undefined) {
      updateFields.push('Horario = ?');
      updateParams.push(Horario);
    }
    
    if (Estado !== undefined) {
      updateFields.push('Estado = ?');
      updateParams.push(Estado);
    }
    
    // Verificar si hay campos para actualizar
    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'Sin cambios',
        message: 'No se proporcionaron campos para actualizar'
      });
    }
    
    // Agregar campo de actualización
    updateFields.push('Ultima_Actualizacion = NOW()');
    
    // Construir y ejecutar la consulta
    const query = `UPDATE SUCURSALES SET ${updateFields.join(', ')} WHERE ID_Sucursal = ?`;
    updateParams.push(id);
    
    await pool.execute(query, updateParams);
    
    // Obtener la sucursal actualizada
    const [sucursalActualizada] = await pool.execute(
      'SELECT * FROM SUCURSALES WHERE ID_Sucursal = ?',
      [id]
    );
    
    res.status(200).json({
      mensaje: 'Sucursal actualizada exitosamente',
      sucursal: sucursalActualizada[0]
    });
  } catch (error) {
    console.error(`Error al actualizar sucursal ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Error al actualizar sucursal',
      message: error.message
    });
  }
};

/**
 * Elimina una sucursal (marcado como inactiva)
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.eliminarSucursal = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el ID sea un número válido
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'ID no válido',
        message: 'El ID de la sucursal debe ser un número'
      });
    }
    
    // Verificar si la sucursal existe
    const [sucursales] = await pool.execute(
      'SELECT ID_Sucursal, Estado FROM SUCURSALES WHERE ID_Sucursal = ?',
      [id]
    );
    
    if (sucursales.length === 0) {
      return res.status(404).json({
        error: 'Sucursal no encontrada',
        message: `No se encontró una sucursal con el ID ${id}`
      });
    }
    
    if (sucursales[0].Estado === 'Inactiva') {
      return res.status(400).json({
        error: 'Sucursal ya inactiva',
        message: `La sucursal con ID ${id} ya está marcada como inactiva`
      });
    }
    
    const [pedidosActivos] = await pool.execute(
      `SELECT COUNT(*) as total FROM PEDIDOS 
       WHERE ID_Sucursal = ? AND Estado NOT IN ('Completado', 'Cancelado', 'Devuelto')`,
      [id]
    );
    
    if (pedidosActivos[0].total > 0) {
      return res.status(409).json({
        error: 'Sucursal con pedidos activos',
        message: `No se puede eliminar la sucursal porque tiene ${pedidosActivos[0].total} pedidos activos`
      });
    }
    
    await pool.execute(
      'UPDATE SUCURSALES SET Estado = "Inactiva", Ultima_Actualizacion = NOW() WHERE ID_Sucursal = ?',
      [id]
    );
    
    res.status(200).json({
      mensaje: `Sucursal con ID ${id} marcada como inactiva exitosamente`
    });
  } catch (error) {
    console.error(`Error al eliminar sucursal ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Error al eliminar sucursal',
      message: error.message
    });
  }
};

/**
 * Obtiene las estadísticas de venta por sucursal
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerEstadisticasSucursal = async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaInicio, fechaFin } = req.query;
    
    // Verificar que el ID sea un número válido
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'ID no válido',
        message: 'El ID de la sucursal debe ser un número'
      });
    }
    
    // Verificar si la sucursal existe
    const [sucursales] = await pool.execute(
      'SELECT ID_Sucursal, Nombre FROM SUCURSALES WHERE ID_Sucursal = ?',
      [id]
    );
    
    if (sucursales.length === 0) {
      return res.status(404).json({
        error: 'Sucursal no encontrada',
        message: `No se encontró una sucursal con el ID ${id}`
      });
    }
    
    // Preparar fechas para filtrado
    let filtroFecha = '';
    let params = [id];
    
    if (fechaInicio && fechaFin) {
      filtroFecha = ' AND Fecha_Pedido BETWEEN ? AND ?';
      params.push(fechaInicio, fechaFin);
    }
    
    // Obtener estadísticas de ventas
    const [estadisticas] = await pool.execute(
      `SELECT 
         COUNT(*) as totalPedidos,
         SUM(Total) as montoTotal,
         COUNT(CASE WHEN Estado = 'Completado' THEN 1 END) as pedidosCompletados,
         COUNT(CASE WHEN Estado = 'Pendiente' THEN 1 END) as pedidosPendientes,
         COUNT(CASE WHEN Estado = 'Cancelado' THEN 1 END) as pedidosCancelados,
         AVG(Total) as promedioVenta
       FROM PEDIDOS
       WHERE ID_Sucursal = ?${filtroFecha}`,
      params
    );
    
    // Obtener productos más vendidos
    const [productosMasVendidos] = await pool.execute(
      `SELECT 
         dp.ID_Producto,
         SUM(dp.Cantidad) as cantidadVendida,
         SUM(dp.Subtotal) as montoVendido
       FROM PEDIDOS p
       JOIN DETALLES_PEDIDO dp ON p.ID_Pedido = dp.ID_Pedido
       WHERE p.ID_Sucursal = ?${filtroFecha}
       GROUP BY dp.ID_Producto
       ORDER BY cantidadVendida DESC
       LIMIT 5`,
      params
    );
    
    // Obtener estadísticas por método de pago
    const [metodosPago] = await pool.execute(
      `SELECT 
         pg.Metodo_Pago,
         COUNT(*) as cantidadPedidos,
         SUM(pg.Monto) as montoTotal
       FROM PEDIDOS p
       JOIN PAGOS pg ON p.ID_Pedido = pg.ID_Pedido
       WHERE p.ID_Sucursal = ?${filtroFecha}
       GROUP BY pg.Metodo_Pago
       ORDER BY montoTotal DESC`,
      params
    );
    
    // Retornar estadísticas combinadas
    res.status(200).json({
      sucursal: sucursales[0],
      estadisticas: estadisticas[0],
      productosMasVendidos,
      metodosPago,
      periodoConsultado: {
        fechaInicio: fechaInicio || 'inicio de operaciones',
        fechaFin: fechaFin || 'presente'
      }
    });
  } catch (error) {
    console.error(`Error al obtener estadísticas de sucursal ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Error al obtener estadísticas de sucursal',
      message: error.message
    });
  }
};

module.exports = {
  obtenerSucursales,
  obtenerSucursalPorId,
  crearSucursal,
  actualizarSucursal,
  eliminarSucursal,
  obtenerEstadisticasSucursal
};