// @ts-check

const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const sonarjs = require('eslint-plugin-sonarjs');
const prettier = require('eslint-config-prettier');

module.exports = tseslint.config({
  extends: [
    sonarjs.configs.recommended,
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
      ignores: ['**/*.js', 'eslint.config.js', 'jest.config.js', 'dist/*', 'tmp/*', 'node_modules/*', 'examples/*'],
    },
  ],
  rules: {
    semi: 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/prefer-regexp-exec': 'off',
    '@typescript-eslint/no-empty-object-type': 'off',
    //"import/no-cycle": "error",
    '@typescript-eslint/no-unsafe-argument': 'off',
    //"prettier/prettier": "warn"
  },
});
