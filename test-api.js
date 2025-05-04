require('dotenv').config();
const supabase = require('./src/config/db');

async function testAPI() {
  console.log('Probando conexión con Supabase...');
  
  try {
    // Verificar que tenemos las variables de entorno correctas
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Configurada' : 'No configurada');
    console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'Configurada' : 'No configurada');
    
    // Probar la conexión a Supabase consultando los productos
    const { data, error } = await supabase
      .from('producto')
      .select('*');
      
    if (error) {
      console.error('Error al consultar la tabla producto:', error);
    } else {
      console.log('Productos encontrados:', data.length);
      console.log('Datos de los productos:', data);
    }
  } catch (error) {
    console.error('Error general:', error);
  }
}

testAPI(); 