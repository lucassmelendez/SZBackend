const express = require('express');
const router = express.Router();
const webpayController = require('../controllers/webpayController');

// Ruta para iniciar transacción
router.post('/iniciar', webpayController.iniciarTransaccion);

// Ruta para confirmar transacción
router.post('/confirmar', webpayController.confirmarTransaccion);

// Ruta para transacción abortada
router.post('/abortada', webpayController.manejarTransaccionAbortada);

// Ruta para timeout
router.post('/timeout', webpayController.manejarTimeout);

module.exports = router; 