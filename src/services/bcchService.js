const axios = require('axios');
const { BCCH_CONFIG } = require('../config/bcchConfig');

/**
 * Obtiene el valor del dólar observado desde la API del Banco Central de Chile
 * @param {string} date - Fecha en formato YYYY-MM-DD (opcional, usa la fecha actual si no se especifica)
 * @returns {Promise<Object>} - Resultado de la consulta con el valor del dólar
 */
const getDollarRate = async (date = null) => {
  try {
    // Si no se especifica fecha, usar la fecha actual
    const currentDate = date || new Date().toISOString().split('T')[0];
    
    // Construir URL para la API
    const url = `${BCCH_CONFIG.baseUrl}?user=${BCCH_CONFIG.user}&pass=${BCCH_CONFIG.pass}&function=GetSeries&timeseries=${BCCH_CONFIG.dollarSeriesId}&firstdate=${currentDate}&lastdate=${currentDate}`;
    
    console.log(`Consultando valor del dólar para la fecha: ${currentDate}`);
    
    const response = await axios.get(url);
    
    // Verificar si la respuesta es exitosa
    if (response.data.Codigo !== 0) {
      throw new Error(`Error en la API del BCCH: ${response.data.Descripcion}`);
    }
    
    // Verificar si hay observaciones
    if (!response.data.Series.Obs || response.data.Series.Obs.length === 0) {
      throw new Error('No hay datos disponibles para la fecha especificada');
    }
    
    // Extraer el valor del dólar
    const dollarValue = {
      date: response.data.Series.Obs[0].indexDateString,
      value: parseFloat(response.data.Series.Obs[0].value),
      description: response.data.Series.descripEsp
    };
    
    return {
      success: true,
      data: dollarValue
    };
  } catch (error) {
    console.error('Error al obtener el valor del dólar:', error);
    
    // Si es un error de que no hay datos para la fecha
    if (error.message === 'No hay datos disponibles para la fecha especificada') {
      // Intentar con el día anterior
      const prevDate = date 
        ? new Date(date)
        : new Date();
      
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = prevDate.toISOString().split('T')[0];
      
      console.log(`Intentando con fecha anterior: ${prevDateStr}`);
      
      // Llamada recursiva con la fecha anterior
      return getDollarRate(prevDateStr);
    }
    
    return {
      success: false,
      error: error.message || 'Error desconocido al consultar el valor del dólar'
    };
  }
};

/**
 * Convierte un valor de CLP a USD
 * @param {number} clpAmount - Monto en pesos chilenos
 * @returns {Promise<Object>} - Resultado de la conversión
 */
const convertCLPtoUSD = async (clpAmount) => {
  try {
    // Validar que el monto sea un número
    const amount = parseFloat(clpAmount);
    if (isNaN(amount)) {
      throw new Error('El monto debe ser un número válido');
    }
    
    // Obtener el valor del dólar
    const dollarRateResult = await getDollarRate();
    
    if (!dollarRateResult.success) {
      throw new Error(dollarRateResult.error);
    }
    
    const dollarRate = dollarRateResult.data.value;
    
    // Realizar la conversión
    const usdAmount = amount / dollarRate;
    
    return {
      success: true,
      data: {
        clpAmount: amount,
        usdAmount: parseFloat(usdAmount.toFixed(2)),
        exchangeRate: dollarRate,
        date: dollarRateResult.data.date
      }
    };
  } catch (error) {
    console.error('Error al convertir CLP a USD:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido en la conversión'
    };
  }
};

module.exports = {
  getDollarRate,
  convertCLPtoUSD
}; 