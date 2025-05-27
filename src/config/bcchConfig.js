require('dotenv').config();

// Configuración para la API del Banco Central de Chile
const BCCH_CONFIG = {
  user: process.env.BCCH_API_USER || 'lucas.mb6@gmail.com',
  pass: process.env.BCCH_API_PASS || '@Lucas123',
  baseUrl: 'https://si3.bcentral.cl/SieteRestWS/SieteRestWS.ashx',
  dollarSeriesId: 'F073.TCO.PRE.Z.D' 
};

// Registrar las credenciales actuales para diagnóstico
console.log('Usuario BCCH configurado:', BCCH_CONFIG.user);
// No imprimir la contraseña completa por seguridad
console.log('Contraseña BCCH configurada:', BCCH_CONFIG.pass ? 'Sí (configurada)' : 'No (no configurada)');

module.exports = { BCCH_CONFIG }; 