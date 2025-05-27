const supabase = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

console.log('JWT_SECRET definido:', !!process.env.JWT_SECRET);

class AuthController {
  async register(req, res) {
    try {
      const { correo, contrasena, nombre, apellido, telefono, direccion, rut } = req.body;

      console.log('Datos recibidos en register:', req.body);

      if (!correo || !contrasena || !nombre || !apellido || !telefono || !direccion || !rut) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren correo, contrasena, nombre, apellido, telefono, direccion y rut'
        });
      }

      const { data: existingClient } = await supabase
        .from('cliente')
        .select('*')
        .eq('correo', correo)
        .single();

      if (existingClient) {
        return res.status(400).json({
          success: false,
          message: 'El correo electrónico ya está registrado'
        });
      }

      const { data: newClient, error: insertError } = await supabase
        .from('cliente')
        .insert([
          {
            nombre,
            apellido,
            correo,
            contrasena,
            telefono: parseInt(telefono, 10),
            direccion,
            rut
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Error al insertar cliente:', insertError);
        return res.status(500).json({
          success: false,
          message: 'Error al crear el cliente',
          error: insertError.message
        });
      }

      if (!newClient) {
        return res.status(500).json({
          success: false,
          message: 'Error: No se pudo crear el cliente'
        });
      }

      if (!process.env.JWT_SECRET) {
        console.error('ERROR: JWT_SECRET no está definido.');
        return res.status(500).json({
          success: false,
          message: 'Error en la configuración del servidor'
        });
      }

      const token = jwt.sign(
        { userId: newClient.id_cliente, correo: newClient.correo },
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        data: {
          user: newClient,
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
      const { correo, contrasena } = req.body;

      const { data: client, error } = await supabase
        .from('cliente')
        .select('*')
        .eq('correo', correo)
        .single();

      if (error || !client) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      if (client.contrasena !== contrasena) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      const token = jwt.sign(
        { userId: client.id_cliente, correo: client.correo },
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '24h' }
      );

      res.status(200).json({
        success: true,
        data: {
          user: client,
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
      const { userId } = req.user;
      const { nombre, apellido, correo, telefono, direccion } = req.body;

      const { error } = await supabase
        .from('cliente')
        .update({
          nombre,
          apellido,
          correo,
          telefono: telefono ? parseInt(telefono, 10) : undefined,
          direccion
        })
        .eq('id_cliente', userId);

      if (error) throw error;

      const { data: updatedClient } = await supabase
        .from('cliente')
        .select('*')
        .eq('id_cliente', userId)
        .single();

      res.status(200).json({
        success: true,
        data: updatedClient
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
      const { userId } = req.user;

      const { data: client, error } = await supabase
        .from('cliente')
        .select('*')
        .eq('id_cliente', userId)
        .single();

      if (error) throw error;

      res.status(200).json({
        success: true,
        data: client
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async logout(req, res) {
    try {
      res.status(200).json({
        success: true,
        message: 'Sesión cerrada correctamente',
        data: null
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