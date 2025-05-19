// src/controllers/cliente.controller.js
const pool = require('../config/database');

/**
 * Obtiene todos los clientes con filtrado opcional
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerClientes = async (req, res) => {
  try {
    const { nombre, email, rut, tipo } = req.query;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    
    // Construir la consulta base
    let query = 'SELECT ID_Cliente, RUT, Nombre, Email, Telefono, Ciudad, Region, Tipo_Cliente FROM CLIENTES WHERE 1=1';
    let params = [];
    
    // Añadir filtros si existen
    if (nombre) {
      query += ' AND Nombre LIKE ?';
      params.push(`%${nombre}%`);
    }
    
    if (email) {
      query += ' AND Email LIKE ?';
      params.push(`%${email}%`);
    }
    
    if (rut) {
      query += ' AND RUT LIKE ?';
      params.push(`%${rut}%`);
    }
    
    if (tipo) {
      query += ' AND Tipo_Cliente = ?';
      params.push(tipo);
    }
    
    // Añadir paginación
    query += ' ORDER BY Nombre LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    // Ejecutar la consulta
    const [clientes] = await pool.execute(query, params);
    
    // Contar total de registros para paginación
    let queryCount = 'SELECT COUNT(*) as total FROM CLIENTES WHERE 1=1';
    let paramsCount = [];
    
    // Añadir los mismos filtros a la consulta de conteo
    if (nombre) {
      queryCount += ' AND Nombre LIKE ?';
      paramsCount.push(`%${nombre}%`);
    }
    
    if (email) {
      queryCount += ' AND Email LIKE ?';
      paramsCount.push(`%${email}%`);
    }
    
    if (rut) {
      queryCount += ' AND RUT LIKE ?';
      paramsCount.push(`%${rut}%`);
    }
    
    if (tipo) {
      queryCount += ' AND Tipo_Cliente = ?';
      paramsCount.push(tipo);
    }
    
    const [countResult] = await pool.execute(queryCount, paramsCount);
    const totalRegistros = countResult[0].total;
    
    res.status(200).json({
      total: totalRegistros,
      paginaActual: page,
      totalPaginas: Math.ceil(totalRegistros / limit),
      registrosPorPagina: limit,
      clientes
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({
      error: 'Error al obtener clientes',
      message: error.message
    });
  }
};

/**
 * Obtiene un cliente específico por su ID
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerClientePorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el ID sea un número válido
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'ID no válido',
        message: 'El ID del cliente debe ser un número'
      });
    }
    
    // Obtener cliente por ID
    const [clientes] = await pool.execute(
      'SELECT * FROM CLIENTES WHERE ID_Cliente = ?',
      [id]
    );
    
    if (clientes.length === 0) {
      return res.status(404).json({
        error: 'Cliente no encontrado',
        message: `No se encontró un cliente con el ID ${id}`
      });
    }
    
    const cliente = clientes[0];
    
    // Opcional: Obtener los pedidos del cliente
    const [pedidos] = await pool.execute(
      `SELECT ID_Pedido, Codigo_Pedido, Fecha_Pedido, Estado, Total 
       FROM PEDIDOS WHERE ID_Cliente = ? 
       ORDER BY Fecha_Pedido DESC 
       LIMIT 5`,
      [id]
    );
    
    // Incluir los pedidos en la respuesta
    cliente.pedidosRecientes = pedidos;
    
    res.status(200).json(cliente);
  } catch (error) {
    console.error(`Error al obtener cliente ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Error al obtener cliente',
      message: error.message
    });
  }
};

/**
 * Crea un nuevo cliente
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.crearCliente = async (req, res) => {
  try {
    const { RUT, Nombre, Email, Telefono, Direccion, Ciudad, Region, Tipo_Cliente, Suscrito_Newsletter } = req.body;
    
    // Validar campos obligatorios
    if (!RUT || !Nombre || !Email) {
      return res.status(400).json({
        error: 'Campos obligatorios faltantes',
        message: 'RUT, Nombre y Email son campos obligatorios'
      });
    }
    
    // Verificar si ya existe un cliente con el mismo RUT o Email
    const [clientesExistentes] = await pool.execute(
      'SELECT ID_Cliente, RUT, Email FROM CLIENTES WHERE RUT = ? OR Email = ?',
      [RUT, Email]
    );
    
    if (clientesExistentes.length > 0) {
      // Determinar cuál campo está duplicado
      const clienteExistente = clientesExistentes[0];
      if (clienteExistente.RUT === RUT) {
        return res.status(409).json({
          error: 'RUT duplicado',
          message: `Ya existe un cliente con el RUT ${RUT}`
        });
      } else {
        return res.status(409).json({
          error: 'Email duplicado',
          message: `Ya existe un cliente con el Email ${Email}`
        });
      }
    }
    
    // Insertar nuevo cliente
    const [result] = await pool.execute(
      `INSERT INTO CLIENTES (RUT, Nombre, Email, Telefono, Direccion, Ciudad, Region, Tipo_Cliente, Suscrito_Newsletter)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        RUT,
        Nombre,
        Email,
        Telefono || null,
        Direccion || null,
        Ciudad || null,
        Region || null,
        Tipo_Cliente || 'Regular',
        Suscrito_Newsletter || 0
      ]
    );
    
    // Obtener el cliente recién creado
    const [nuevoCliente] = await pool.execute(
      'SELECT * FROM CLIENTES WHERE ID_Cliente = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      mensaje: 'Cliente creado exitosamente',
      cliente: nuevoCliente[0]
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({
      error: 'Error al crear cliente',
      message: error.message
    });
  }
};

/**
 * Actualiza un cliente existente
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { RUT, Nombre, Email, Telefono, Direccion, Ciudad, Region, Tipo_Cliente, Suscrito_Newsletter } = req.body;
    
    // Verificar que el ID sea un número válido
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'ID no válido',
        message: 'El ID del cliente debe ser un número'
      });
    }
    
    // Verificar si el cliente existe
    const [clientes] = await pool.execute(
      'SELECT ID_Cliente FROM CLIENTES WHERE ID_Cliente = ?',
      [id]
    );
    
    if (clientes.length === 0) {
      return res.status(404).json({
        error: 'Cliente no encontrado',
        message: `No se encontró un cliente con el ID ${id}`
      });
    }
    
    // Si se está actualizando RUT o Email, verificar que no estén duplicados
    if (RUT || Email) {
      const [clientesExistentes] = await pool.execute(
        'SELECT ID_Cliente, RUT, Email FROM CLIENTES WHERE (RUT = ? OR Email = ?) AND ID_Cliente != ?',
        [RUT || '', Email || '', id]
      );
      
      if (clientesExistentes.length > 0) {
        // Determinar cuál campo está duplicado
        const clienteExistente = clientesExistentes[0];
        if (RUT && clienteExistente.RUT === RUT) {
          return res.status(409).json({
            error: 'RUT duplicado',
            message: `Ya existe otro cliente con el RUT ${RUT}`
          });
        } else if (Email && clienteExistente.Email === Email) {
          return res.status(409).json({
            error: 'Email duplicado',
            message: `Ya existe otro cliente con el Email ${Email}`
          });
        }
      }
    }
    
    // Construir la consulta de actualización
    let updateFields = [];
    let updateParams = [];
    
    if (RUT) {
      updateFields.push('RUT = ?');
      updateParams.push(RUT);
    }
    
    if (Nombre) {
      updateFields.push('Nombre = ?');
      updateParams.push(Nombre);
    }
    
    if (Email) {
      updateFields.push('Email = ?');
      updateParams.push(Email);
    }
    
    // Validar y agregar campos opcionales
    if (Telefono !== undefined) {
      updateFields.push('Telefono = ?');
      updateParams.push(Telefono || null);
    }
    
    if (Direccion !== undefined) {
      updateFields.push('Direccion = ?');
      updateParams.push(Direccion || null);
    }
    
    if (Ciudad !== undefined) {
      updateFields.push('Ciudad = ?');
      updateParams.push(Ciudad || null);
    }
    
    if (Region !== undefined) {
      updateFields.push('Region = ?');
      updateParams.push(Region || null);
    }
    
    if (Tipo_Cliente !== undefined) {
      updateFields.push('Tipo_Cliente = ?');
      updateParams.push(Tipo_Cliente || 'Regular');
    }
    
    if (Suscrito_Newsletter !== undefined) {
      updateFields.push('Suscrito_Newsletter = ?');
      updateParams.push(Suscrito_Newsletter ? 1 : 0);
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
    const query = `UPDATE CLIENTES SET ${updateFields.join(', ')} WHERE ID_Cliente = ?`;
    updateParams.push(id);
    
    await pool.execute(query, updateParams);
    
    // Obtener el cliente actualizado
    const [clienteActualizado] = await pool.execute(
      'SELECT * FROM CLIENTES WHERE ID_Cliente = ?',
      [id]
    );
    
    res.status(200).json({
      mensaje: 'Cliente actualizado exitosamente',
      cliente: clienteActualizado[0]
    });
  } catch (error) {
    console.error(`Error al actualizar cliente ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Error al actualizar cliente',
      message: error.message
    });
  }
};

/**
 * Elimina un cliente
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.eliminarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el ID sea un número válido
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'ID no válido',
        message: 'El ID del cliente debe ser un número'
      });
    }
    
    // Verificar si el cliente existe
    const [clientes] = await pool.execute(
      'SELECT ID_Cliente FROM CLIENTES WHERE ID_Cliente = ?',
      [id]
    );
    
    if (clientes.length === 0) {
      return res.status(404).json({
        error: 'Cliente no encontrado',
        message: `No se encontró un cliente con el ID ${id}`
      });
    }
    
    // Verificar si el cliente tiene pedidos
    const [pedidos] = await pool.execute(
      'SELECT COUNT(*) as total FROM PEDIDOS WHERE ID_Cliente = ?',
      [id]
    );
    
    if (pedidos[0].total > 0) {
      return res.status(409).json({
        error: 'Cliente con pedidos',
        message: `No se puede eliminar el cliente porque tiene ${pedidos[0].total} pedidos asociados`
      });
    }
    
    // Eliminar el cliente
    await pool.execute(
      'DELETE FROM CLIENTES WHERE ID_Cliente = ?',
      [id]
    );
    
    res.status(200).json({
      mensaje: `Cliente con ID ${id} eliminado exitosamente`
    });
  } catch (error) {
    console.error(`Error al eliminar cliente ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Error al eliminar cliente',
      message: error.message
    });
  }
};

/**
 * Obtiene los pedidos de un cliente
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerPedidosCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    
    // Verificar que el ID sea un número válido
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'ID no válido',
        message: 'El ID del cliente debe ser un número'
      });
    }
    
    // Verificar si el cliente existe
    const [clientes] = await pool.execute(
      'SELECT ID_Cliente, Nombre FROM CLIENTES WHERE ID_Cliente = ?',
      [id]
    );
    
    if (clientes.length === 0) {
      return res.status(404).json({
        error: 'Cliente no encontrado',
        message: `No se encontró un cliente con el ID ${id}`
      });
    }
    
    // Obtener pedidos del cliente
    const [pedidos] = await pool.execute(
      `SELECT p.ID_Pedido, p.Codigo_Pedido, p.Fecha_Pedido, p.Estado, p.Total, p.Metodo_Entrega,
              d.Codigo as DivisaCodigo 
       FROM PEDIDOS p
       JOIN DIVISAS d ON p.ID_Divisa = d.ID_Divisa
       WHERE p.ID_Cliente = ?
       ORDER BY p.Fecha_Pedido DESC
       LIMIT ? OFFSET ?`,
      [id, limit, offset]
    );
    
    // Contar total de pedidos
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM PEDIDOS WHERE ID_Cliente = ?',
      [id]
    );
    
    res.status(200).json({
      cliente: clientes[0],
      total: countResult[0].total,
      paginaActual: page,
      totalPaginas: Math.ceil(countResult[0].total / limit),
      registrosPorPagina: limit,
      pedidos
    });
  } catch (error) {
    console.error(`Error al obtener pedidos del cliente ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Error al obtener pedidos del cliente',
      message: error.message
    });
  }
};

module.exports = {
  obtenerClientes,
  obtenerClientePorId,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
  obtenerPedidosCliente
};