/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { match } = require('path-to-regexp');
console.log('1: ', match('/api/books{/*path}')('/api/books'));
console.log('2: ', match('/api/books{/*path}')('/api/books/123'));
