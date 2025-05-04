const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar rutas
const productoRoutes = require('./routes/productoRoutes');

// Crear aplicación Express
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/productos', productoRoutes);

// Ruta por defecto
app.get('/', (req, res) => {
  res.json({
    message: 'API de SpinZone - Bienvenido',
    endpoints: {
      productos: '/api/productos'
    }
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
}); 