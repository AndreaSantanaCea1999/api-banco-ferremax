// models/User.js - Modelo de Usuario con MySQL
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

class User {
  constructor() {
    this.connection = null;
  }

  // Crear conexión a la base de datos
  async getConnection() {
    if (!this.connection) {
      this.connection = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'administrador',
        password: process.env.DB_PASSWORD || 'yR!9uL2@pX',
        database: process.env.DB_NAME || 'ferremas_complete',
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4'
      });
    }
    return this.connection;
  }

  // Buscar usuario por email
  async findByEmail(email) {
    try {
      const connection = await this.getConnection();
      const [rows] = await connection.execute(
        'SELECT * FROM usuarios WHERE email = ? AND activo = 1',
        [email.toLowerCase()]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error buscando usuario por email:', error);
      throw error;
    }
  }

  // Buscar usuario por ID
  async findById(id) {
  try {
    const connection = await this.getConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM usuarios WHERE id = ? AND activo = 1',
      [id]
    );
    
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error buscando usuario por ID:', error);
    throw error;
  }
}

  // Crear nuevo usuario
  async create(userData) {
    try {
      const connection = await this.getConnection();
      
      // Validar datos requeridos
      const { email, password, nombre, apellido, telefono, role = 'cliente' } = userData;
      
      if (!email || !password || !nombre) {
        throw new Error('Email, contraseña y nombre son requeridos');
      }

      // Verificar si el email ya existe
      const existingUser = await this.findByEmail(email);
      if (existingUser) {
        throw new Error('El email ya está registrado');
      }

      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(password, 12);

      // Insertar usuario
      const [result] = await connection.execute(
        `INSERT INTO usuarios (email, password, nombre, apellido, telefono, role, activo, fecha_registro) 
         VALUES (?, ?, ?, ?, ?, ?, TRUE, NOW())`,
        [email.toLowerCase(), hashedPassword, nombre, apellido || null, telefono || null, role]
      );

      // Obtener el usuario creado
      const newUser = await this.findById(result.insertId);
      
      // Remover password del objeto retornado
      const { password: _, ...userWithoutPassword } = newUser;
      
      return {
        success: true,
        user: userWithoutPassword,
        message: 'Usuario creado exitosamente'
      };

    } catch (error) {
      console.error('Error creando usuario:', error);
      throw error;
    }
  }

  // Verificar credenciales de login
  async verifyCredentials(email, password) {
    try {
      const user = await this.findByEmail(email);
      if (!user) {
        return { success: false, message: 'Credenciales inválidas' };
      }

      // Verificar contraseña
      const validPassword = (password === user.password) || await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return { success: false, message: 'Credenciales inválidas' };
      }

      // Actualizar fecha de última sesión
      await this.updateLastLogin(user.id);

      // Remover password del objeto retornado
      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        user: userWithoutPassword,
        message: 'Login exitoso'
      };

    } catch (error) {
      console.error('Error verificando credenciales:', error);
      throw error;
    }
  }

  // Actualizar fecha de última sesión
  async updateLastLogin(userId) {
    try {
      const connection = await this.getConnection();
      await connection.execute(
        'UPDATE usuarios SET fecha_ultima_sesion = NOW() WHERE id = ?',
        [userId]
      );
    } catch (error) {
      console.error('Error actualizando última sesión:', error);
    }
  }

  // Actualizar perfil de usuario
  async updateProfile(userId, updateData) {
    try {
      const connection = await this.getConnection();
      
      const allowedFields = ['nombre', 'apellido', 'telefono', 'direccion'];
      const updateFields = [];
      const updateValues = [];

      // Construir query dinámico solo con campos permitidos
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No hay campos válidos para actualizar');
      }

      updateValues.push(userId);

      await connection.execute(
        `UPDATE usuarios SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
        updateValues
      );

      return await this.findById(userId);

    } catch (error) {
      console.error('Error actualizando perfil:', error);
      throw error;
    }
  }

  // Cambiar contraseña
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar contraseña actual
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        throw new Error('Contraseña actual incorrecta');
      }

      // Hashear nueva contraseña
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      const connection = await this.getConnection();
      await connection.execute(
        'UPDATE usuarios SET password = ?, updated_at = NOW() WHERE id = ?',
        [hashedNewPassword, userId]
      );

      return { success: true, message: 'Contraseña actualizada exitosamente' };

    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      throw error;
    }
  }

  // Desactivar usuario (soft delete)
  async deactivate(userId) {
    try {
      const connection = await this.getConnection();
      await connection.execute(
        'UPDATE usuarios SET activo = FALSE, updated_at = NOW() WHERE id = ?',
        [userId]
      );

      return { success: true, message: 'Usuario desactivado exitosamente' };

    } catch (error) {
      console.error('Error desactivando usuario:', error);
      throw error;
    }
  }

  // Listar usuarios (para admin)
  async getAll(filters = {}) {
    try {
      const connection = await this.getConnection();
      
      let query = 'SELECT id, email, nombre, apellido, telefono, role, activo, fecha_registro, fecha_ultima_sesion FROM usuarios';
      let queryParams = [];
      let conditions = [];

      // Aplicar filtros
      if (filters.role) {
        conditions.push('role = ?');
        queryParams.push(filters.role);
      }

      if (filters.activo !== undefined) {
        conditions.push('activo = ?');
        queryParams.push(filters.activo);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY fecha_registro DESC';

      // Aplicar limit si se especifica
      if (filters.limit) {
        query += ' LIMIT ?';
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await connection.execute(query, queryParams);
      return rows;

    } catch (error) {
      console.error('Error obteniendo lista de usuarios:', error);
      throw error;
    }
  }

  // Crear hash de password (utilidad)
  async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  // Verificar si es admin
  async isAdmin(userId) {
    try {
      const user = await this.findById(userId);
      return user && user.role === 'admin';
    } catch (error) {
      return false;
    }
  }

  // Cerrar conexión
  async closeConnection() {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }
}

module.exports = new User();