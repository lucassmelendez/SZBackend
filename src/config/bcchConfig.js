require('dotenv').config();

const BCCH_CONFIG = {
  user: process.env.BCCH_API_USER,
  pass: process.env.BCCH_API_PASS,
  baseUrl: 'https://si3.bcentral.cl/SieteRestWS/SieteRestWS.ashx',
  dollarSeriesId: 'F073.TCO.PRE.Z.D' 
};

module.exports = { BCCH_CONFIG }; 