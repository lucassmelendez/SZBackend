const pool = require('../config/db');

class ProductoModel {
  // Obtener todos los productos
  async getAll() {
    try {
      const query = 'SELECT * FROM producto';
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener productos: ${error.message}`);
    }
  }

  // Obtener un producto por ID
  async getById(id) {
    try {
      const query = 'SELECT * FROM producto WHERE id_producto = $1';
      const { rows } = await pool.query(query, [id]);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener producto por ID: ${error.message}`);
    }
  }

  // Crear un nuevo producto
  async create(producto) {
    try {
      const { nombre, descripcion, precio, marca, peso, stock, categoria_id } = producto;
      const query = `
        INSERT INTO producto (id_producto, nombre, descripcion, precio, marca, peso, stock, categoria_id)
        VALUES (nextval('producto_id_seq'), $1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const values = [nombre, descripcion, precio, marca, peso, stock, categoria_id];
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al crear producto: ${error.message}`);
    }
  }

  // Actualizar un producto
  async update(id, producto) {
    try {
      const { nombre, descripcion, precio, marca, peso, stock, categoria_id } = producto;
      const query = `
        UPDATE producto
        SET nombre = $1, descripcion = $2, precio = $3, marca = $4, 
            peso = $5, stock = $6, categoria_id = $7
        WHERE id_producto = $8
        RETURNING *
      `;
      const values = [nombre, descripcion, precio, marca, peso, stock, categoria_id, id];
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al actualizar producto: ${error.message}`);
    }
  }

  // Actualizar parcialmente un producto
  async partialUpdate(id, fieldsToUpdate) {
    try {
      // Construir la consulta dinámicamente
      const fields = Object.keys(fieldsToUpdate);
      
      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }
      
      const setValues = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
      const values = fields.map(field => fieldsToUpdate[field]);
      
      // Agregar el id al final de los valores
      values.push(id);
      
      const query = `
        UPDATE producto
        SET ${setValues}
        WHERE id_producto = $${values.length}
        RETURNING *
      `;
      
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al actualizar parcialmente el producto: ${error.message}`);
    }
  }

  // Eliminar un producto
  async delete(id) {
    try {
      const query = 'DELETE FROM producto WHERE id_producto = $1 RETURNING *';
      const { rows } = await pool.query(query, [id]);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al eliminar producto: ${error.message}`);
    }
  }

  // Buscar productos por nombre o descripción
  async search(term) {
    try {
      const query = `
        SELECT * FROM producto 
        WHERE nombre ILIKE $1 OR descripcion ILIKE $1
      `;
      const { rows } = await pool.query(query, [`%${term}%`]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar productos: ${error.message}`);
    }
  }

  // Obtener productos por categoría
  async getByCategoria(categoriaId) {
    try {
      const query = 'SELECT * FROM producto WHERE categoria_id = $1';
      const { rows } = await pool.query(query, [categoriaId]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener productos por categoría: ${error.message}`);
    }
  }
}

module.exports = new ProductoModel(); 