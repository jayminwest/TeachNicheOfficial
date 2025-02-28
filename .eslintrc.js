module.exports = {
  extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended'],
  rules: {
    // Disable the no-unused-vars rule for variables prefixed with underscore
    '@typescript-eslint/no-unused-vars': ['off', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_',
      'caughtErrorsIgnorePattern': '^_'
    }],
    // Allow some explicit any usage in specific files
    '@typescript-eslint/no-explicit-any': ['warn', {
      'ignoreRestArgs': true
    }],
    // Additional rules to downgrade errors to warnings during migration
    'react-hooks/exhaustive-deps': 'warn',
    'import/no-unresolved': 'warn',
    'import/named': 'warn'
  },
  overrides: [
    {
      // Disable specific rules for test files
      files: ['**/__tests__/**/*', '**/*.test.*'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off'
      }
    },
    {
      // Disable specific rules for API routes
      files: ['app/api/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off'
      }
    }
  ]
}
