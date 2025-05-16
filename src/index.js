const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar rutas
const productoRoutes = require('./routes/productoRoutes');
const authRoutes = require('./routes/authRoutes');
const webpayRoutes = require('./routes/webpayRoutes');

// Importar configuración de WebPay
const { configureWebpay } = require('./config/webpayConfig');

// Crear aplicación Express
const app = express();
const port = process.env.PORT || 3000;

// Configuración de CORS
const corsOptions = {
  origin: function(origin, callback) {
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8000',
      'https://szfast-api.vercel.app',
      'https://sz-frontend.vercel.app',
      'https://sz-frontend-git-main-lucassmelendez.vercel.app',
      'https://sz-frontend-lucassmelendez.vercel.app',
      // Añadir aquí otros dominios si es necesario
    ];
    
    // Permitir solicitudes sin origen (como solicitudes de móviles o postman)
    if (!origin) return callback(null, true);
    
    // Permitir cualquier origen en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      console.log('CORS: Permitiendo origen en desarrollo:', origin);
      return callback(null, true);
    }
    
    // En producción, verificar que el origen está en la lista permitida
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('CORS: Origen permitido:', origin);
      return callback(null, true);
    } else {
      console.log('CORS: Origen rechazado:', origin);
      return callback(null, true); // Seguir permitiendo por ahora, cambiar a false para rechazar
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 204,
  preflightContinue: false, // Para evitar problemas con redirecciones en preflight
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Verificar si estamos usando HTTPS
app.use((req, res, next) => {
  // Log del protocolo usado
  console.log(`Protocolo: ${req.protocol}, Headers: ${req.headers['x-forwarded-proto']}`);
  
  // Si estamos en producción y usando HTTP, redirigir a HTTPS
  if (process.env.NODE_ENV === 'production' && 
      !req.secure && 
      req.headers['x-forwarded-proto'] !== 'https') {
    console.log('Redirigiendo a HTTPS');
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

// Configurar WebPay
configureWebpay();

// Rutas
app.use('/api/productos', productoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/webpay', webpayRoutes);

// Ruta por defecto
app.get('/', (req, res) => {
  res.json({
    message: 'API de SpinZone - Bienvenido',
    endpoints: {
      auth: '/api/auth',
      productos: '/api/productos',
      webpay: '/api/webpay'
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