require('jest-fetch-mock').enableMocks();

// Polyfill globalThis.crypto for Node 18 (available natively in Node 20+)
if (typeof globalThis.crypto === 'undefined') {
  const { webcrypto } = require('node:crypto');
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
}
