// This file helps Playwright handle ES modules properly
// It's used to prevent "require is not defined" errors with ESM packages

const register = require('@swc/register');

register({
  jsc: {
    parser: {
      syntax: 'typescript',
      tsx: true,
    },
    target: 'es2021',
  },
  module: {
    type: 'commonjs',
  },
});
