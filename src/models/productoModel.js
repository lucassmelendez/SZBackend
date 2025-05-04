const supabase = require('../config/db');

class ProductoModel {
  // Obtener todos los productos
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('producto')
        .select('*');
        
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error al obtener productos: ${error.message}`);
    }
  }

  // Obtener un producto por ID
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('producto')
        .select('*')
        .eq('id_producto', id)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error al obtener producto por ID: ${error.message}`);
    }
  }

  // Crear un nuevo producto
  async create(producto) {
    try {
      const { nombre, descripcion, precio, marca, peso, stock, categoria_id } = producto;
      
      const { data, error } = await supabase
        .from('producto')
        .insert([{ 
          nombre, 
          descripcion, 
          precio, 
          marca, 
          peso, 
          stock, 
          categoria_id 
        }])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error al crear producto: ${error.message}`);
    }
  }

  // Actualizar un producto
  async update(id, producto) {
    try {
      const { nombre, descripcion, precio, marca, peso, stock, categoria_id } = producto;
      
      const { data, error } = await supabase
        .from('producto')
        .update({ 
          nombre, 
          descripcion, 
          precio, 
          marca, 
          peso, 
          stock, 
          categoria_id 
        })
        .eq('id_producto', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error al actualizar producto: ${error.message}`);
    }
  }

  // Actualizar parcialmente un producto
  async partialUpdate(id, fieldsToUpdate) {
    try {
      const { data, error } = await supabase
        .from('producto')
        .update(fieldsToUpdate)
        .eq('id_producto', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error al actualizar parcialmente el producto: ${error.message}`);
    }
  }

  // Eliminar un producto
  async delete(id) {
    try {
      const { data, error } = await supabase
        .from('producto')
        .delete()
        .eq('id_producto', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error al eliminar producto: ${error.message}`);
    }
  }

  // Buscar productos por nombre o descripción
  async search(term) {
    try {
      const { data, error } = await supabase
        .from('producto')
        .select('*')
        .or(`nombre.ilike.%${term}%,descripcion.ilike.%${term}%`);
        
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error al buscar productos: ${error.message}`);
    }
  }

  // Obtener productos por categoría
  async getByCategoria(categoriaId) {
    try {
      const { data, error } = await supabase
        .from('producto')
        .select('*')
        .eq('categoria_id', categoriaId);
        
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error al obtener productos por categoría: ${error.message}`);
    }
  }
}

module.exports = new ProductoModel(); 