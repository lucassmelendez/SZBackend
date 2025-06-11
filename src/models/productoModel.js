const supabase = require('../config/db');

// Datos simulados para cuando Supabase no esté disponible
const productosSimulados = [
  {
    id_producto: 1,
    nombre: "Raqueta Profesional X1",
    descripcion: "Raqueta de tenis de mesa profesional con mango ergonómico",
    precio: 89990,
    marca: "SpinMaster",
    peso: "180g",
    stock: 15,
    categoria_id: 1
  },
  {
    id_producto: 2,
    nombre: "Pelota Official Tournament",
    descripcion: "Pelota oficial para torneos, 3 estrellas",
    precio: 5990,
    marca: "TableTech",
    peso: "2.7g",
    stock: 50,
    categoria_id: 2
  },
  {
    id_producto: 3,
    nombre: "Mesa Plegable Pro",
    descripcion: "Mesa de tenis de mesa plegable para competición",
    precio: 299990,
    marca: "SpinZone",
    peso: "45kg",
    stock: 5,
    categoria_id: 3
  },
  {
    id_producto: 4,
    nombre: "Set de Raquetas Inicial",
    descripcion: "Set de 2 raquetas ideales para principiantes",
    precio: 24990,
    marca: "StartSpin",
    peso: "320g",
    stock: 25,
    categoria_id: 1
  },
  {
    id_producto: 5,
    nombre: "Red Profesional",
    descripcion: "Red oficial para mesas de tenis de mesa",
    precio: 15990,
    marca: "NetPro",
    peso: "500g",
    stock: 30,
    categoria_id: 4
  }
];

class ProductoModel {
  async getAll() {
    try {
      console.log('Conectando a Supabase para obtener productos...');
      
      const { data, error } = await supabase
        .from('producto')
        .select('*');
        
      if (error) {
        console.error('Error de Supabase:', error);
        console.log('Usando datos simulados como fallback...');
        return productosSimulados;
      }
      
      console.log(`Supabase devolvió ${data?.length || 0} productos`);
      return data || [];
    } catch (error) {
      console.error('Error en ProductoModel.getAll:', error);
      console.log('Usando datos simulados como fallback...');
      return productosSimulados;
    }
  }

  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('producto')
        .select('*')
        .eq('id_producto', id)
        .single();
        
      if (error) {
        console.error('Error de Supabase:', error);
        const producto = productosSimulados.find(p => p.id_producto === parseInt(id));
        if (!producto) {
          throw new Error(`Producto con ID ${id} no encontrado`);
        }
        return producto;
      }
      return data;
    } catch (error) {
      console.error('Error en ProductoModel.getById:', error);
      const producto = productosSimulados.find(p => p.id_producto === parseInt(id));
      if (!producto) {
        throw new Error(`Producto con ID ${id} no encontrado`);
      }
      return producto;
    }
  }

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

  async search(term) {
    try {
      const { data, error } = await supabase
        .from('producto')
        .select('*')
        .or(`nombre.ilike.%${term}%,descripcion.ilike.%${term}%`);
        
      if (error) {
        console.error('Error de Supabase en search:', error);
        const termLower = term.toLowerCase();
        const resultados = productosSimulados.filter(p => 
          p.nombre.toLowerCase().includes(termLower) ||
          p.descripcion.toLowerCase().includes(termLower)
        );
        return resultados;
      }
      return data;
    } catch (error) {
      console.error('Error en ProductoModel.search:', error);
      const termLower = term.toLowerCase();
      const resultados = productosSimulados.filter(p => 
        p.nombre.toLowerCase().includes(termLower) ||
        p.descripcion.toLowerCase().includes(termLower)
      );
      return resultados;
    }
  }

  async getByCategoria(categoriaId) {
    try {
      const { data, error } = await supabase
        .from('producto')
        .select('*')
        .eq('categoria_id', categoriaId);
        
      if (error) {
        console.error('Error de Supabase en getByCategoria:', error);
        const resultados = productosSimulados.filter(p => 
          p.categoria_id === parseInt(categoriaId)
        );
        return resultados;
      }
      return data;
    } catch (error) {
      console.error('Error en ProductoModel.getByCategoria:', error);
      const resultados = productosSimulados.filter(p => 
        p.categoria_id === parseInt(categoriaId)
      );
      return resultados;
    }
  }
}

module.exports = new ProductoModel(); 