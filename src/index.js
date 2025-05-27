const express = require('express');
const cors = require('cors');
require('dotenv').config();
 
const productoRoutes = require('./routes/productoRoutes');
const authRoutes = require('./routes/authRoutes');
const webpayRoutes = require('./routes/webpayRoutes');
const exchangeRoutes = require('./routes/exchangeRoutes');

const { configureWebpay } = require('./config/webpayConfig');

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8000',
      'https://szfast-api.vercel.app',
      'https://sz-frontend.vercel.app',
      'https://sz-frontend-git-main-lucassmelendez.vercel.app',
      'https://sz-frontend-lucassmelendez.vercel.app',
    ];
    
    if (!origin) return callback(null, true);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('CORS: Permitiendo origen en desarrollo:', origin);
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('CORS: Origen permitido:', origin);
      return callback(null, true);
    } else {
      console.log('CORS: Origen rechazado:', origin);
      return callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 204,
  preflightContinue: false,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`Protocolo: ${req.protocol}, Headers: ${req.headers['x-forwarded-proto']}`);
  
  if (process.env.NODE_ENV === 'production' && 
      !req.secure && 
      req.headers['x-forwarded-proto'] !== 'https') {
    console.log('Redirigiendo a HTTPS');
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

configureWebpay();

app.use('/api/productos', productoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/webpay', webpayRoutes);
app.use('/api/exchange', exchangeRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'API de SpinZone - Bienvenido',
    endpoints: {
      auth: '/api/auth',
      productos: '/api/productos',
      webpay: '/api/webpay',
      exchange: '/api/exchange'
    }
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});