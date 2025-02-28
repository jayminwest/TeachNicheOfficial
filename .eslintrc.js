module.exports = {
  extends: 'next/core-web-vitals',
  // Remove ignorePatterns as it's ignoring all TypeScript files
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    // Additional rules to downgrade errors to warnings during migration
    'react-hooks/exhaustive-deps': 'warn',
    'import/no-unresolved': 'warn',
    'import/named': 'warn'
  },
  // Add a comment to remind the team to fix these issues later
  // TODO: Remove these rule modifications after GCP migration is complete and fix all linting issues
}
module.exports = {
  extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended'],
  rules: {
    // Disable the no-unused-vars rule for variables prefixed with underscore
    '@typescript-eslint/no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_',
      'caughtErrorsIgnorePattern': '^_'
    }],
    // Allow some explicit any usage in specific files
    '@typescript-eslint/no-explicit-any': ['error', {
      'ignoreRestArgs': true
    }]
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
        '@typescript-eslint/no-unused-vars': ['error', { 
          'argsIgnorePattern': '^_',
          'varsIgnorePattern': '^_',
          'caughtErrorsIgnorePattern': '^_'
        }]
      }
    }
  ]
}
