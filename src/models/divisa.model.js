// src/models/divisa.model.js
const pool = require('../config/database');

/**
 * Obtiene todas las divisas
 * @returns {Promise<Array>} - Lista de divisas
 */
async function obtenerTodas() {
  try {
    const [divisas] = await pool.execute(
      'SELECT * FROM DIVISAS ORDER BY Divisa_Base DESC, Codigo'
    );
    return divisas;
  } catch (error) {
    console.error('Error en modelo divisa.obtenerTodas:', error);
    throw error;
  }
}

/**
 * Obtiene una divisa por su ID
 * @param {number} id - ID de la divisa
 * @returns {Promise<Object|null>} - Divisa encontrada o null
 */
async function obtenerPorId(id) {
  try {
    const [divisas] = await pool.execute(
      'SELECT * FROM DIVISAS WHERE ID_Divisa = ?',
      [id]
    );
    return divisas.length > 0 ? divisas[0] : null;
  } catch (error) {
    console.error(`Error en modelo divisa.obtenerPorId (${id}):`, error);
    throw error;
  }
}

/**
 * Obtiene una divisa por su código
 * @param {string} codigo - Código de la divisa (ej: USD, EUR)
 * @returns {Promise<Object|null>} - Divisa encontrada o null
 */
async function obtenerPorCodigo(codigo) {
  try {
    const [divisas] = await pool.execute(
      'SELECT * FROM DIVISAS WHERE Codigo = ?',
      [codigo]
    );
    return divisas.length > 0 ? divisas[0] : null;
  } catch (error) {
    console.error(`Error en modelo divisa.obtenerPorCodigo (${codigo}):`, error);
    throw error;
  }
}

/**
 * Crea una nueva divisa
 * @param {Object} datosDivisa - Datos de la divisa a crear
 * @returns {Promise<Object>} - Divisa creada
 */
async function crear(datosDivisa) {
  try {
    // Verificar si ya existe el código
    const divisaExistente = await obtenerPorCodigo(datosDivisa.Codigo);
    if (divisaExistente) {
      throw new Error(`Ya existe una divisa con el código ${datosDivisa.Codigo}`);
    }
    
    // Validar campos obligatorios
    if (!datosDivisa.Codigo || !datosDivisa.Nombre || !datosDivisa.Tasa_Conversion) {
      throw new Error('Los campos Codigo, Nombre y Tasa_Conversion son obligatorios');
    }
    
    // Insertar divisa
    const [result] = await pool.execute(
      `INSERT INTO DIVISAS (Codigo, Nombre, Tasa_Conversion, Fecha_Actualizacion, Divisa_Base)
       VALUES (?, ?, ?, NOW(), ?)`,
      [
        datosDivisa.Codigo,
        datosDivisa.Nombre,
        datosDivisa.Tasa_Conversion,
        datosDivisa.Divisa_Base || 0
      ]
    );
    
    return obtenerPorId(result.insertId);
  } catch (error) {
    console.error('Error en modelo divisa.crear:', error);
    throw error;
  }
}

/**
 * Actualiza la tasa de conversión de una divisa
 * @param {string} codigo - Código de la divisa a actualizar
 * @param {number} tasa - Nueva tasa de conversión
 * @returns {Promise<Object|null>} - Divisa actualizada o null
 */
async function actualizarTasa(codigo, tasa) {
  try {
    // Verificar que la divisa existe
    const divisaExistente = await obtenerPorCodigo(codigo);
    if (!divisaExistente) {
      return null;
    }
    
    // Validar tasa
    if (!tasa || isNaN(tasa) || tasa <= 0) {
      throw new Error('La tasa debe ser un número positivo');
    }
    
    // Actualizar tasa
    await pool.execute(
      'UPDATE DIVISAS SET Tasa_Conversion = ?, Fecha_Actualizacion = NOW() WHERE Codigo = ?',
      [tasa, codigo]
    );
    
    return obtenerPorCodigo(codigo);
  } catch (error) {
    console.error(`Error en modelo divisa.actualizarTasa (${codigo}):`, error);
    throw error;
  }
}

/**
 * Actualiza una divisa existente
 * @param {number} id - ID de la divisa a actualizar
 * @param {Object} datosActualizacion - Datos a actualizar
 * @returns {Promise<Object|null>} - Divisa actualizada o null
 */
async function actualizar(id, datosActualizacion) {
  try {
    // Verificar que la divisa existe
    const divisaExistente = await obtenerPorId(id);
    if (!divisaExistente) {
      return null;
    }
    
    // Verificar código duplicado si se está actualizando
    if (datosActualizacion.Codigo && datosActualizacion.Codigo !== divisaExistente.Codigo) {
      const codigoExistente = await obtenerPorCodigo(datosActualizacion.Codigo);
      if (codigoExistente) {
        throw new Error(`Ya existe otra divisa con el código ${datosActualizacion.Codigo}`);
      }
    }
    
    // Preparar campos y valores para la actualización
    const actualizaciones = [];
    const valores = [];
    
    if (datosActualizacion.Codigo !== undefined) {
      actualizaciones.push('Codigo = ?');
      valores.push(datosActualizacion.Codigo);
    }
    
    if (datosActualizacion.Nombre !== undefined) {
      actualizaciones.push('Nombre = ?');
      valores.push(datosActualizacion.Nombre);
    }
    
    if (datosActualizacion.Tasa_Conversion !== undefined) {
      actualizaciones.push('Tasa_Conversion = ?');
      valores.push(datosActualizacion.Tasa_Conversion);
      actualizaciones.push('Fecha_Actualizacion = NOW()');
    }
    
    if (datosActualizacion.Divisa_Base !== undefined) {
      actualizaciones.push('Divisa_Base = ?');
      valores.push(datosActualizacion.Divisa_Base);
    }
    
    if (actualizaciones.length === 0) {
      throw new Error('No se proporcionaron campos para actualizar');
    }
    
    // Construir y ejecutar la consulta
    const query = `UPDATE DIVISAS SET ${actualizaciones.join(', ')} WHERE ID_Divisa = ?`;
    valores.push(id);
    
    await pool.execute(query, valores);
    
    return obtenerPorId(id);
  } catch (error) {
    console.error(`Error en modelo divisa.actualizar (${id}):`, error);
    throw error;
  }
}

/**
 * Elimina una divisa por su ID
 * @param {number} id - ID de la divisa a eliminar
 * @returns {Promise<boolean>} - true si se eliminó, false si no se encontró
 */
async function eliminar(id) {
  try {
    // Verificar que la divisa existe
    const divisaExistente = await obtenerPorId(id);
    if (!divisaExistente) {
      return false;
    }
    
    // Verificar si es divisa base
    if (divisaExistente.Divisa_Base === 1) {
      throw new Error('No se puede eliminar la divisa base');
    }
    
    // Verificar referencias en PEDIDOS
    const [pedidos] = await pool.execute(
      'SELECT COUNT(*) as total FROM PEDIDOS WHERE ID_Divisa = ?',
      [id]
    );
    
    if (pedidos[0].total > 0) {
      throw new Error(`No se puede eliminar la divisa porque está siendo utilizada en ${pedidos[0].total} pedidos`);
    }
    
    // Eliminar la divisa
    await pool.execute(
      'DELETE FROM DIVISAS WHERE ID_Divisa = ?',
      [id]
    );
    
    return true;
  } catch (error) {
    console.error(`Error en modelo divisa.eliminar (${id}):`, error);
    throw error;
  }
}

/**
 * Obtiene la divisa base (CLP por defecto)
 * @returns {Promise<Object>} - Divisa base
 */
async function obtenerDivisaBase() {
  try {
    const [divisas] = await pool.execute(
      'SELECT * FROM DIVISAS WHERE Divisa_Base = 1'
    );
    
    if (divisas.length === 0) {
      throw new Error('No se encontró una divisa base en la base de datos');
    }
    
    return divisas[0];
  } catch (error) {
    console.error('Error en modelo divisa.obtenerDivisaBase:', error);
    throw error;
  }
}

/**
 * Convertir un monto entre divisas
 * @param {number} monto - Monto a convertir
 * @param {string} divisaOrigen - Código de divisa origen
 * @param {string} divisaDestino - Código de divisa destino
 * @returns {Promise<Object>} - Resultado de la conversión
 */
async function convertirMonto(monto, divisaOrigen, divisaDestino) {
  try {
    // Validar monto
    if (!monto || isNaN(monto) || monto <= 0) {
      throw new Error('El monto debe ser un número positivo');
    }
    
    // Obtener divisas
    const origen = await obtenerPorCodigo(divisaOrigen);
    if (!origen) {
      throw new Error(`No existe una divisa con el código ${divisaOrigen}`);
    }
    
    const destino = await obtenerPorCodigo(divisaDestino);
    if (!destino) {
      throw new Error(`No existe una divisa con el código ${divisaDestino}`);
    }
    
    // Realizar la conversión
    const montoEnCLP = monto * origen.Tasa_Conversion;
    const montoFinal = montoEnCLP / destino.Tasa_Conversion;
    
    return {
      montoOriginal: parseFloat(monto),
      divisaOrigen: origen.Codigo,
      divisaDestino: destino.Codigo,
      tasaOrigen: parseFloat(origen.Tasa_Conversion),
      tasaDestino: parseFloat(destino.Tasa_Conversion),
      resultado: parseFloat(montoFinal.toFixed(2)),
      fecha: new Date()
    };
  } catch (error) {
    console.error(`Error en modelo divisa.convertirMonto (${monto} ${divisaOrigen} a ${divisaDestino}):`, error);
    throw error;
  }
}

module.exports = {
  obtenerTodas,
  obtenerPorId,
  obtenerPorCodigo,
  crear,
  actualizarTasa,
  actualizar,
  eliminar,
  obtenerDivisaBase,
  convertirMonto
};
Claude
