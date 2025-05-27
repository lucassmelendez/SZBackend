const { WebpayPlus, Options, Environment } = require('transbank-sdk');

const WEBPAY_INTEGRATION_URL = 'https://webpay3gint.transbank.cl';
const WEBPAY_PRODUCTION_URL = 'https://webpay3g.transbank.cl';

const INTEGRATION_COMMERCE_CODE = '597055555532';
const INTEGRATION_API_KEY = '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C';

const shouldForceIntegration = () => {
    return process.env.WEBPAY_FORCE_INTEGRATION === 'true';
};

const configureWebpay = () => {
    const env = process.env.NODE_ENV || 'development';
    console.log(`Configurando WebpayPlus en entorno: ${env}`);
    
    console.log('WebpayPlus configurado para usar instancias individuales');
};

const getTransactionInstance = () => {
    const env = process.env.NODE_ENV || 'development';
    
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