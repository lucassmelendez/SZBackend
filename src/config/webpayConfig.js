const { WebpayPlus, Environment, Options } = require('transbank-sdk');

// Configuración para ambiente de integración
const configureWebpayIntegration = () => {
    const commerceCode = '597055555532';
    const apiKey = '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C';
    
    // Configurar ambiente de integración
    const options = new Options(commerceCode, apiKey, Environment.Integration);
    WebpayPlus.configureForTesting();
};

// Configuración para ambiente de producción
const configureWebpayProduction = () => {
    const commerceCode = process.env.WEBPAY_COMMERCE_CODE;
    const apiKey = process.env.WEBPAY_API_KEY;
    
    // Configurar ambiente de producción
    const options = new Options(commerceCode, apiKey, Environment.Production);
    WebpayPlus.configure(options);
};

// Configurar WebPay basado en el entorno
const configureWebpay = () => {
    if (process.env.NODE_ENV === 'production') {
        configureWebpayProduction();
    } else {
        configureWebpayIntegration();
    }
};

module.exports = {
    configureWebpay
}; 