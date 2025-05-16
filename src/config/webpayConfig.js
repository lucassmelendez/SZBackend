const { WebpayPlus, Options, Environment } = require('transbank-sdk');

// URLs de WebPay
const WEBPAY_INTEGRATION_URL = 'https://webpay3gint.transbank.cl';
const WEBPAY_PRODUCTION_URL = 'https://webpay3g.transbank.cl';

// Credenciales de integración
const INTEGRATION_COMMERCE_CODE = '597055555532';
const INTEGRATION_API_KEY = '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C';

// Determinar si debemos forzar el modo de integración
const shouldForceIntegration = () => {
    return process.env.WEBPAY_FORCE_INTEGRATION === 'true';
};

// Configurar WebPay basado en el entorno
const configureWebpay = () => {
    const env = process.env.NODE_ENV || 'development';
    console.log(`Configurando WebpayPlus en entorno: ${env}`);
    
    // No necesitamos configurar WebpayPlus globalmente ya que usaremos instancias
    // con opciones específicas en cada controlador
    console.log('WebpayPlus configurado para usar instancias individuales');
};

// Función para obtener una instancia configurada de WebpayPlus.Transaction
const getTransactionInstance = () => {
    const env = process.env.NODE_ENV || 'development';
    
    // Si estamos en desarrollo o si se fuerza el modo integración
    if (env !== 'production' || shouldForceIntegration()) {
        console.log('Creando instancia de WebpayPlus para integración');
        return new WebpayPlus.Transaction(
            new Options(
                INTEGRATION_COMMERCE_CODE,
                INTEGRATION_API_KEY,
                Environment.Integration
            )
        );
    } else {
        // En producción
        const commerceCode = process.env.WEBPAY_COMMERCE_CODE;
        const apiKey = process.env.WEBPAY_API_KEY;
        
        if (!commerceCode || !apiKey) {
            console.error('Faltan las credenciales de producción. Usando credenciales de integración como fallback');
            return new WebpayPlus.Transaction(
                new Options(
                    INTEGRATION_COMMERCE_CODE,
                    INTEGRATION_API_KEY,
                    Environment.Integration
                )
            );
        }
        
        console.log('Creando instancia de WebpayPlus para producción');
        return new WebpayPlus.Transaction(
            new Options(
                commerceCode,
                apiKey,
                Environment.Production
            )
        );
    }
};

module.exports = {
    configureWebpay,
    getTransactionInstance,
    WEBPAY_INTEGRATION_URL,
    WEBPAY_PRODUCTION_URL,
    INTEGRATION_COMMERCE_CODE,
    INTEGRATION_API_KEY,
    shouldForceIntegration
}; 