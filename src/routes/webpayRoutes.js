const express = require('express');
const router = express.Router();
const webpayController = require('../controllers/webpayController');

router.post('/iniciar', webpayController.iniciarTransaccion);

router.post('/confirmar', webpayController.confirmarTransaccion);

router.post('/abortada', webpayController.manejarTransaccionAbortada);

router.post('/timeout', webpayController.manejarTimeout);

module.exports = router; 