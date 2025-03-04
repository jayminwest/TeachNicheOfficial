const Mux = require('@mux/mux-node');

console.log('Environment variables:');
console.log('MUX_TOKEN_ID:', process.env.MUX_TOKEN_ID);
console.log('MUX_TOKEN_SECRET:', process.env.MUX_TOKEN_SECRET ? '[REDACTED]' : 'undefined');

// Check if they're defined but empty
console.log('MUX_TOKEN_ID is empty string:', process.env.MUX_TOKEN_ID === '');
console.log('MUX_TOKEN_SECRET is empty string:', process.env.MUX_TOKEN_SECRET === '');

// Check if they're defined but contain only whitespace
console.log('MUX_TOKEN_ID is whitespace:', /^\s*$/.test(process.env.MUX_TOKEN_ID || ''));
console.log('MUX_TOKEN_SECRET is whitespace:', /^\s*$/.test(process.env.MUX_TOKEN_SECRET || ''));
