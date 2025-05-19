// src/models/sucursal.model.js
const pool = require('../config/database');

/**
 * Obtiene todas las sucursales
 * @param {Object} filtros - Filtros a aplicar (nombre, ciudad, region, estado)
 * @returns {Promise<Array>} - Lista de sucursales
 */
async function obtenerTodas(filtros = {}) {
  try {
    // Construir la consulta base
    let query = 'SELECT * FROM SUCURSALES WHERE 1=1';
    let params = [];
    
    // Aplicar filtros si existen
    if (filtros.nombre) {
      query += ' AND Nombre LIKE ?';
      params.push(`%${filtros.nombre}%`);
    }
    
    if (filtros.ciudad) {
      query += ' AND Ciudad LIKE ?';
      params.push(`%${filtros.ciudad}%`);
    }
    
    if (filtros.region) {
      query += ' AND Region LIKE ?';
      params.push(`%${filtros.region}%`);
    }
    
    if (filtros.estado) {
      query += ' AND Estado = ?';
      params.push(filtros.estado);
    }
    
    // Solo incluir sucursales activas si no se especifica un filtro de estado
    if (!filtros.estado) {
      query += ' AND Estado != "Inactiva"';
    }
    
    // Aplicar ordenamiento
    query += ' ORDER BY Nombre';
    
    // Ejecutar la consulta
    const [sucursales] = await pool.execute(query, params);
    return sucursales;
  } catch (error) {
    console.error('Error en modelo sucursal.obtenerTodas:', error);
    throw error;
  }
}

/**
 * Obtiene una sucursal por su ID
 * @param {number} id - ID de la sucursal
 * @returns {Promise<Object|null>} - Sucursal encontrada o null
 */
async function obtenerPorId(id) {
  try {
    const [sucursales] = await pool.execute(
      'SELECT * FROM SUCURSALES WHERE ID_Sucursal = ?',
      [id]
    );
    
    return sucursales.length > 0 ? sucursales[0] : null;
  } catch (error) {
    console.error(`Error en modelo sucursal.obtenerPorId (${id}):`, error);
    throw error;
  }
}

/**
 * Obtiene una sucursal por su nombre
 * @param {string} nombre - Nombre de la sucursal
 * @returns {Promise<Object|null>} - Sucursal encontrada o null
 */
async function obtenerPorNombre(nombre) {
  try {
    const [sucursales] = await pool.execute(
      'SELECT * FROM SUCURSALES WHERE Nombre = ?',
      [nombre]
    );
    
    return sucursales.length > 0 ? sucursales[0] : null;
  } catch (error) {
    console.error(`Error en modelo sucursal.obtenerPorNombre (${nombre}):`, error);
    throw error;
  }
}

/**
 * Crea una nueva sucursal
 * @param {Object} datosSucursal - Datos de la sucursal a crear
 * @returns {Promise<Object>} - Sucursal creada
 */
async function crear(datosSucursal) {
  try {
    // Verificar si ya existe el nombre
    const sucursalExistente = await obtenerPorNombre(datosSucursal.Nombre);
    if (sucursalExistente) {
      throw new Error(`Ya existe una sucursal con el nombre ${datosSucursal.Nombre}`);
    }
    
    // Validar campos obligatorios
    if (!datosSucursal.Nombre || !datosSucursal.Direccion || !datosSucursal.Ciudad || !datosSucursal.Region) {
      throw new Error('Los campos Nombre, Direccion, Ciudad y Region son obligatorios');
    }
    
    // Preparar campos y valores para la inserción
    const campos = Object.keys(datosSucursal);
    const valores = Object.values(datosSucursal);
    
    // Construir la consulta dinámica
    const placeholders = campos.map(() => '?').join(', ');
    const query = `INSERT INTO SUCURSALES (${campos.join(', ')}) VALUES (${placeholders})`;
    
    // Ejecutar la inserción
    const [result] = await pool.execute(query, valores);
    
    // Obtener la sucursal creada
    return obtenerPorId(result.insertId);
  } catch (error) {
    console.error('Error en modelo sucursal.crear:', error);
    throw error;
  }
}

/**
 * Actualiza una sucursal existente
 * @param {number} id - ID de la sucursal a actualizar
 * @param {Object} datosActualizacion - Datos a actualizar
 * @returns {Promise<Object|null>} - Sucursal actualizada o null
 */
async function actualizar(id, datosActualizacion) {
  try {
    // Verificar que la sucursal existe
    const sucursalExistente = await obtenerPorId(id);
    if (!sucursalExistente) {
      return null;
    }
    
    // Verificar nombre duplicado si se está actualizando
    if (datosActualizacion.Nombre && datosActualizacion.Nombre !== sucursalExistente.Nombre) {
      const nombreExistente = await obtenerPorNombre(datosActualizacion.Nombre);
      if (nombreExistente) {
        throw new Error(`Ya existe otra sucursal con el nombre ${datosActualizacion.Nombre}`);
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
    const query = `UPDATE SUCURSALES SET ${actualizaciones} WHERE ID_Sucursal = ?`;
    const valores = [...Object.values(datosActualizacion), id];
    
    await pool.execute(query, valores);
    
    // Obtener la sucursal actualizada
    return obtenerPorId(id);
  } catch (error) {
    console.error(`Error en modelo sucursal.actualizar (${id}):`, error);
    throw error;
  }
}

/**
 * Elimina una sucursal por su ID
 * @param {number} id - ID de la sucursal a eliminar
 * @returns {Promise<boolean>} - true si se eliminó, false si no se encontró
 */
async function eliminar(id) {
  try {
    // Verificar que la sucursal existe
    const sucursalExistente = await obtenerPorId(id);
    if (!sucursalExistente) {
      return false;
    }
    
    // Verificar si tiene pedidos asociados
    const [pedidos] = await pool.execute(
      'SELECT COUNT(*) as total FROM PEDIDOS WHERE ID_Sucursal = ?',
      [id]
    );
    
    if (pedidos[0].total > 0) {
      throw new Error(`No se puede eliminar la sucursal porque tiene ${pedidos[0].total} pedidos asociados`);
    }
    
    // Verificar si tiene inventario asociado
    const [inventario] = await pool.execute(
      'SELECT COUNT(*) as total FROM INVENTARIO WHERE ID_Sucursal = ?',
      [id]
    );
    
    if (inventario[0].total > 0) {
      throw new Error(`No se puede eliminar la sucursal porque tiene ${inventario[0].total} registros de inventario asociados`);
    }
    
    // Eliminar la sucursal
    await pool.execute(
      'DELETE FROM SUCURSALES WHERE ID_Sucursal = ?',
      [id]
    );
    
    return true;
  } catch (error) {
    console.error(`Error en modelo sucursal.eliminar (${id}):`, error);
    throw error;
  }
}

/**
 * Inactiva una sucursal en lugar de eliminarla
 * @param {number} id - ID de la sucursal a inactivar
 * @returns {Promise<Object|null>} - Sucursal inactivada o null
 */
async function inactivar(id) {
  try {
    // Verificar que la sucursal existe
    const sucursalExistente = await obtenerPorId(id);
    if (!sucursalExistente) {
      return null;
    }
    
    // Inactivar la sucursal
    await pool.execute(
      'UPDATE SUCURSALES SET Estado = "Inactiva" WHERE ID_Sucursal = ?',
      [id]
    );
    
    return obtenerPorId(id);
  } catch (error) {
    console.error(`Error en modelo sucursal.inactivar (${id}):`, error);
    throw error;
  }
}

module.exports = {
  obtenerTodas,
  obtenerPorId,
  obtenerPorNombre,
  crear,
  actualizar,
  eliminar,
  inactivar
};