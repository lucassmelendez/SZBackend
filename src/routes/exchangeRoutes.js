const express = require('express');
const router = express.Router();
const { getDollarRate, convertCLPtoUSD } = require('../services/bcchService');

/**
 * @route GET /api/exchange/dollar
 * @desc Obtiene el valor actual del dólar
 * @access Public
 */
router.get('/dollar', async (req, res) => {
  try {
    const result = await getDollarRate();
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error en ruta /dollar:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener el valor del dólar'
    });
  }
});

/**
 * @route POST /api/exchange/convert
 * @desc Convierte un valor de CLP a USD
 * @access Public
 */
router.post('/convert', async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Se requiere el monto en CLP para la conversión' 
      });
    }
    
    const result = await convertCLPtoUSD(amount);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error en ruta /convert:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al convertir de CLP a USD'
    });
  }
});

module.exports = router; 