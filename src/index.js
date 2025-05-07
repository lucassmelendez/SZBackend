const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar rutas
const productoRoutes = require('./routes/productoRoutes');
const authRoutes = require('./routes/authRoutes');

// Crear aplicación Express
const app = express();
const port = process.env.PORT || 3000;

// Configuración de CORS
const corsOptions = {
  origin: function(origin, callback) {
    // Permitir cualquier origen durante desarrollo
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
  optionsSuccessStatus: 204
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Rutas
app.use('/api/productos', productoRoutes);
app.use('/api/auth', authRoutes);

// Ruta por defecto
app.get('/', (req, res) => {
  res.json({
    message: 'API de SpinZone - Bienvenido',
    endpoints: {
      auth: '/api/auth',
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