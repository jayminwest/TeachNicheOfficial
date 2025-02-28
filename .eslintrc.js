module.exports = {
  extends: 'next/core-web-vitals',
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
