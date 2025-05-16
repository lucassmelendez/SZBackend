const { WebpayPlus } = require('transbank-sdk');

// URLs de WebPay
const WEBPAY_INTEGRATION_URL = 'https://webpay3gint.transbank.cl';
const WEBPAY_PRODUCTION_URL = 'https://webpay3g.transbank.cl';

// Credenciales de integración
const INTEGRATION_COMMERCE_CODE = '597055555532';
const INTEGRATION_API_KEY = '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C';

// Configuración para ambiente de integración
const configureWebpayIntegration = () => {
    try {
        // En la versión actual del SDK, WebpayPlus.configureForTesting() 
        // configura automáticamente las credenciales de integración
        WebpayPlus.configureForTesting();
        
        // También podemos configurar manualmente con los valores de integración
        // Código de comercio de integración
        const commerceCode = INTEGRATION_COMMERCE_CODE;
        const apiKey = INTEGRATION_API_KEY;
        
        // Configurar explícitamente (alternativa a configureForTesting)
        // WebpayPlus.Transaction.configureForIntegration(commerceCode, apiKey);

        console.log(`WebpayPlus configurado correctamente en modo integración. URL: ${WEBPAY_INTEGRATION_URL}`);
    } catch (error) {
        console.error('Error al configurar WebpayPlus para integración:', error);
    }
};

// Configuración para ambiente de producción
const configureWebpayProduction = () => {
    try {
        const commerceCode = process.env.WEBPAY_COMMERCE_CODE;
        const apiKey = process.env.WEBPAY_API_KEY;
        
        if (!commerceCode || !apiKey) {
            throw new Error('Faltan las credenciales de producción. Asegúrate de configurar WEBPAY_COMMERCE_CODE y WEBPAY_API_KEY');
        }
        
        // Verificar si se están usando credenciales de integración en producción (caso de prueba)
        if (commerceCode === INTEGRATION_COMMERCE_CODE && apiKey === INTEGRATION_API_KEY) {
            console.log('⚠️ ADVERTENCIA: Estás usando credenciales de integración en ambiente de producción');
        }
        
        // Configurar WebpayPlus con las credenciales de producción
        // En versiones recientes, WebpayPlus usa Transaction.configureForProduction()
        WebpayPlus.Transaction.configureForProduction(commerceCode, apiKey);
        console.log(`WebpayPlus configurado correctamente en modo producción. URL: ${WEBPAY_PRODUCTION_URL}`);
    } catch (error) {
        console.error('Error al configurar WebpayPlus para producción:', error);
        // Fallback a configuración de integración si hay problemas
        console.log('Fallback: Configurando en modo integración');
        configureWebpayIntegration();
    }
};

// Determinar si debemos forzar el modo de integración
const shouldForceIntegration = () => {
    return process.env.WEBPAY_FORCE_INTEGRATION === 'true';
};

// Configurar WebPay basado en el entorno
const configureWebpay = () => {
    const env = process.env.NODE_ENV || 'development';
    console.log(`Configurando WebpayPlus en entorno: ${env}`);
    
    // Verificar si debemos forzar el modo de integración
    if (shouldForceIntegration()) {
        console.log('🔄 MODO FORZADO: Usando configuración de integración aunque estemos en producción');
        configureWebpayIntegration();
        return;
    }
    
    // Comportamiento normal basado en NODE_ENV
    if (env === 'production') {
        configureWebpayProduction();
    } else {
        configureWebpayIntegration();
    }
};

module.exports = {
    configureWebpay,
    WEBPAY_INTEGRATION_URL,
    WEBPAY_PRODUCTION_URL,
    INTEGRATION_COMMERCE_CODE,
    INTEGRATION_API_KEY,
    shouldForceIntegration
}; 