/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const jwt = require('jsonwebtoken');
const token = jwt.sign({ sub: 'admin_id_here' }, 'lght', { expiresIn: '1h' });
console.log('Generated token:', token);
