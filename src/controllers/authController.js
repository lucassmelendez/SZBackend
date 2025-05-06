const supabase = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class AuthController {
  async register(req, res) {
    try {
      const { email, password, nombre } = req.body;

      if (!email || !password || !nombre) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren email, password y nombre'
        });
      }

      // Verificar si el usuario ya existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El correo electrónico ya está registrado'
        });
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear el usuario
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            email,
            password: hashedPassword,
            nombre
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Error al insertar usuario:', insertError);
        return res.status(500).json({
          success: false,
          message: 'Error al crear el usuario',
          error: insertError.message
        });
      }

      if (!newUser) {
        return res.status(500).json({
          success: false,
          message: 'Error: No se pudo crear el usuario'
        });
      }

      // Generar token
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Enviar respuesta sin incluir la contraseña
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json({
        success: true,
        data: {
          user: userWithoutPassword,
          token
        }
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Buscar usuario
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar contraseña
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Generar token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Enviar respuesta sin incluir la contraseña
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json({
        success: true,
        data: {
          user: userWithoutPassword,
          token
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const { userId } = req.user; // Obtenido del middleware de autenticación
      const { nombre, email, currentPassword, newPassword } = req.body;

      // Verificar si hay cambio de contraseña
      if (currentPassword && newPassword) {
        // Obtener usuario con contraseña
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        // Verificar contraseña actual
        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
          return res.status(401).json({
            success: false,
            message: 'La contraseña actual es incorrecta'
          });
        }

        // Hash de la nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar usuario con nueva contraseña
        const { error } = await supabase
          .from('users')
          .update({
            nombre,
            email,
            password: hashedPassword
          })
          .eq('id', userId);

        if (error) throw error;
      } else {
        // Actualizar usuario sin cambiar contraseña
        const { error } = await supabase
          .from('users')
          .update({
            nombre,
            email
          })
          .eq('id', userId);

        if (error) throw error;
      }

      // Obtener usuario actualizado
      const { data: updatedUser } = await supabase
        .from('users')
        .select('id, email, nombre')
        .eq('id', userId)
        .single();

      res.status(200).json({
        success: true,
        data: updatedUser
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getProfile(req, res) {
    try {
      const { userId } = req.user; // Obtenido del middleware de autenticación

      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, nombre')
        .eq('id', userId)
        .single();

      if (error) throw error;

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new AuthController();