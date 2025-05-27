const productoModel = require('../models/productoModel');

class ProductoController {
  async getAllProductos(req, res) {
    try {
      const productos = await productoModel.getAll();
      res.status(200).json({
        success: true,
        data: productos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getProductoById(req, res) {
    try {
      const { id } = req.params;
      const producto = await productoModel.getById(id);
      
      if (!producto) {
        return res.status(404).json({
          success: false,
          message: `Producto con ID ${id} no encontrado`
        });
      }
      
      res.status(200).json({
        success: true,
        data: producto
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async createProducto(req, res) {
    try {
      const { nombre, descripcion, precio, marca, peso, stock, categoria_id } = req.body;
      
      if (!nombre || !descripcion || !precio || !marca || !peso || stock === undefined || !categoria_id) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos'
        });
      }
      
      const nuevoProducto = await productoModel.create({
        nombre,
        descripcion,
        precio,
        marca,
        peso,
        stock,
        categoria_id
      });
      
      res.status(201).json({
        success: true,
        data: nuevoProducto,
        message: 'Producto creado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateProducto(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, precio, marca, peso, stock, categoria_id } = req.body;
      
      const productoExistente = await productoModel.getById(id);
      if (!productoExistente) {
        return res.status(404).json({
          success: false,
          message: `Producto con ID ${id} no encontrado`
        });
      }
      
      if (!nombre || !descripcion || !precio || !marca || !peso || stock === undefined || !categoria_id) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos'
        });
      }
      
      const productoActualizado = await productoModel.update(id, {
        nombre,
        descripcion,
        precio,
        marca,
        peso,
        stock,
        categoria_id
      });
      
      res.status(200).json({
        success: true,
        data: productoActualizado,
        message: 'Producto actualizado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async partialUpdateProducto(req, res) {
    try {
      const { id } = req.params;
      const fieldsToUpdate = req.body;
      
      const productoExistente = await productoModel.getById(id);
      if (!productoExistente) {
        return res.status(404).json({
          success: false,
          message: `Producto con ID ${id} no encontrado`
        });
      }
      
      if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No hay datos para actualizar'
        });
      }
      
      const productoActualizado = await productoModel.partialUpdate(id, fieldsToUpdate);
      
      res.status(200).json({
        success: true,
        data: productoActualizado,
        message: 'Producto actualizado parcialmente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteProducto(req, res) {
    try {
      const { id } = req.params;
      
      const productoExistente = await productoModel.getById(id);
      if (!productoExistente) {
        return res.status(404).json({
          success: false,
          message: `Producto con ID ${id} no encontrado`
        });
      }
      
      const productoEliminado = await productoModel.delete(id);
      
      res.status(200).json({
        success: true,
        data: productoEliminado,
        message: 'Producto eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async searchProductos(req, res) {
    try {
      const { term } = req.query;
      
      if (!term) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un término de búsqueda'
        });
      }
      
      const productos = await productoModel.search(term);
      
      res.status(200).json({
        success: true,
        data: productos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getProductosByCategoria(req, res) {
    try {
      const { categoriaId } = req.params;
      
      const productos = await productoModel.getByCategoria(categoriaId);
      
      res.status(200).json({
        success: true,
        data: productos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new ProductoController(); 