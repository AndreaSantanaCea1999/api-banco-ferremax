
// src/models/cliente.model.js
const pool = require('../config/database');

/**
 * Obtiene todos los clientes con filtros opcionales
 * @param {Object} filtros - Filtros a aplicar (nombre, email, rut, tipo)
 * @param {Object} opciones - Opciones de paginación (limit, offset)
 * @returns {Promise<Array>} - Lista de clientes
 */
async function obtenerTodos(filtros = {}, opciones = { limit: 10, offset: 0 }) {
  try {
    // Construir la consulta base
    let query = 'SELECT * FROM CLIENTES WHERE 1=1';
    let params = [];
    
    // Aplicar filtros si existen
    if (filtros.nombre) {
      query += ' AND Nombre LIKE ?';
      params.push(`%${filtros.nombre}%`);
    }
    
    if (filtros.email) {
      query += ' AND Email LIKE ?';
      params.push(`%${filtros.email}%`);
    }
    
    if (filtros.rut) {
      query += ' AND RUT LIKE ?';
      params.push(`%${filtros.rut}%`);
    }
    
    if (filtros.tipo) {
      query += ' AND Tipo_Cliente = ?';
      params.push(filtros.tipo);
    }
    
    // Aplicar ordenamiento y paginación
    query += ' ORDER BY Nombre';
    
    if (opciones.limit) {
      query += ' LIMIT ?';
      params.push(Number(opciones.limit));
      
      if (opciones.offset !== undefined) {
        query += ' OFFSET ?';
        params.push(Number(opciones.offset));
      }
    }
    
    // Ejecutar la consulta
    const [clientes] = await pool.execute(query, params);
    return clientes;
  } catch (error) {
    console.error('Error en modelo cliente.obtenerTodos:', error);
    throw error;
  }
}

/**
 * Obtiene un cliente por su ID
 * @param {number} id - ID del cliente
 * @returns {Promise<Object|null>} - Cliente encontrado o null
 */
async function obtenerPorId(id) {
  try {
    const [clientes] = await pool.execute(
      'SELECT * FROM CLIENTES WHERE ID_Cliente = ?',
      [id]
    );
    
    return clientes.length > 0 ? clientes[0] : null;
  } catch (error) {
    console.error(`Error en modelo cliente.obtenerPorId (${id}):`, error);
    throw error;
  }
}

/**
 * Busca un cliente por su RUT
 * @param {string} rut - RUT del cliente
 * @returns {Promise<Object|null>} - Cliente encontrado o null
 */
async function obtenerPorRUT(rut) {
  try {
    const [clientes] = await pool.execute(
      'SELECT * FROM CLIENTES WHERE RUT = ?',
      [rut]
    );
    
    return clientes.length > 0 ? clientes[0] : null;
  } catch (error) {
    console.error(`Error en modelo cliente.obtenerPorRUT (${rut}):`, error);
    throw error;
  }
}

/**
 * Busca un cliente por su Email
 * @param {string} email - Email del cliente
 * @returns {Promise<Object|null>} - Cliente encontrado o null
 */
async function obtenerPorEmail(email) {
  try {
    const [clientes] = await pool.execute(
      'SELECT * FROM CLIENTES WHERE Email = ?',
      [email]
    );
    
    return clientes.length > 0 ? clientes[0] : null;
  } catch (error) {
    console.error(`Error en modelo cliente.obtenerPorEmail (${email}):`, error);
    throw error;
  }
}

/**
 * Crea un nuevo cliente
 * @param {Object} datosCliente - Datos del cliente a crear
 * @returns {Promise<Object>} - Cliente creado
 */
async function crear(datosCliente) {
  try {
    // Verificar si ya existe el RUT o Email
    const clienteExistente = await obtenerPorRUT(datosCliente.RUT);
    if (clienteExistente) {
      throw new Error(`Ya existe un cliente con el RUT ${datosCliente.RUT}`);
    }
    
    const emailExistente = await obtenerPorEmail(datosCliente.Email);
    if (emailExistente) {
      throw new Error(`Ya existe un cliente con el Email ${datosCliente.Email}`);
    }
    
    // Preparar campos y valores para la inserción
    const campos = Object.keys(datosCliente);
    const valores = Object.values(datosCliente);
    
    // Construir la consulta dinámica
    const placeholders = campos.map(() => '?').join(', ');
    const query = `INSERT INTO CLIENTES (${campos.join(', ')}) VALUES (${placeholders})`;
    
    // Ejecutar la inserción
    const [result] = await pool.execute(query, valores);
    
    // Obtener el cliente creado
    return obtenerPorId(result.insertId);
  } catch (error) {
    console.error('Error en modelo cliente.crear:', error);
    throw error;
  }
}

/**
 * Actualiza un cliente existente
 * @param {number} id - ID del cliente a actualizar
 * @param {Object} datosActualizacion - Datos a actualizar
 * @returns {Promise<Object|null>} - Cliente actualizado o null
 */
async function actualizar(id, datosActualizacion) {
  try {
    // Verificar que el cliente existe
    const clienteExistente = await obtenerPorId(id);
    if (!clienteExistente) {
      return null;
    }
    
    // Verificar RUT duplicado si se está actualizando
    if (datosActualizacion.RUT && datosActualizacion.RUT !== clienteExistente.RUT) {
      const rutExistente = await obtenerPorRUT(datosActualizacion.RUT);
      if (rutExistente && rutExistente.ID_Cliente !== Number(id)) {
        throw new Error(`Ya existe otro cliente con el RUT ${datosActualizacion.RUT}`);
      }
    }
    
    // Verificar Email duplicado si se está actualizando
    if (datosActualizacion.Email && datosActualizacion.Email !== clienteExistente.Email) {
      const emailExistente = await obtenerPorEmail(datosActualizacion.Email);
      if (emailExistente && emailExistente.ID_Cliente !== Number(id)) {
        throw new Error(`Ya existe otro cliente con el Email ${datosActualizacion.Email}`);
      }
    }
    
    // Preparar campos y valores para la actualización
    const actualizaciones = Object.entries(datosActualizacion)
      .map(([campo, valor]) => `${campo} = ?`)
      .join(', ');
    
    if (!actualizaciones) {
      throw new Error('No se proporcionaron campos para actualizar');
    }
    
    // Construir y ejecutar la consulta
    const query = `UPDATE CLIENTES SET ${actualizaciones}, Ultima_Actualizacion = NOW() WHERE ID_Cliente = ?`;
    const valores = [...Object.values(datosActualizacion), id];
    
    await pool.execute(query, valores);
    
    // Obtener el cliente actualizado
    return obtenerPorId(id);
  } catch (error) {
    console.error(`Error en modelo cliente.actualizar (${id}):`, error);
    throw error;
  }
}

/**
 * Elimina un cliente por su ID
 * @param {number} id - ID del cliente a eliminar
 * @returns {Promise<boolean>} - true si se eliminó, false si no se encontró
 */
async function eliminar(id) {
  try {
    const clienteExistente = await obtenerPorId(id);
    if (!clienteExistente) {
      return false;
    }
    
    // Verificar si tiene pedidos asociados
    const [pedidos] = await pool.execute(
      'SELECT COUNT(*) as total FROM PEDIDOS WHERE ID_Cliente = ?',
      [id]
    );
    
    if (pedidos[0].total > 0) {
      throw new Error(`No se puede eliminar el cliente porque tiene ${pedidos[0].total} pedidos asociados`);
    }
    
    // Eliminar el cliente
    await pool.execute(
      'DELETE FROM CLIENTES WHERE ID_Cliente = ?',
      [id]
    );
    
    return true;
  } catch (error) {
    console.error(`Error en modelo cliente.eliminar (${id}):`, error);
    throw error;
  }
}

/**
 * Obtiene los pedidos de un cliente
 * @param {number} id - ID del cliente
 * @param {Object} opciones - Opciones de paginación (limit, offset)
 * @returns {Promise<Array>} - Lista de pedidos del cliente
 */
async function obtenerPedidosCliente(id, opciones = { limit: 10, offset: 0 }) {
  try {
    // Verificar que el cliente existe
    const clienteExistente = await obtenerPorId(id);
    if (!clienteExistente) {
      throw new Error(`No existe un cliente con el ID ${id}`);
    }
    
    // Construir la consulta
    const query = `
      SELECT p.*, d.Codigo as DivisaCodigo 
      FROM PEDIDOS p
      JOIN DIVISAS d ON p.ID_Divisa = d.ID_Divisa
      WHERE p.ID_Cliente = ?
      ORDER BY p.Fecha_Pedido DESC
      LIMIT ? OFFSET ?
    `;
    
    const [pedidos] = await pool.execute(
      query,
      [id, Number(opciones.limit), Number(opciones.offset)]
    );
    
    return pedidos;
  } catch (error) {
    console.error(`Error en modelo cliente.obtenerPedidosCliente (${id}):`, error);
    throw error;
  }
}

module.exports = {
  obtenerTodos,
  obtenerPorId,
  obtenerPorRUT,
  obtenerPorEmail,
  crear,
  actualizar,
  eliminar,
  obtenerPedidosCliente
};
Claude
