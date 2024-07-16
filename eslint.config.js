const tsEslint = require('typescript-eslint');
const sonarjs = require('eslint-plugin-sonarjs');
const sourceTsFiles = ['src/**/*.ts'];

/**
 * @type {import('eslint').Linter.FlatConfig[]}
 */
module.exports = [
  ...tsEslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: sourceTsFiles,
  })),
  {
    files: sourceTsFiles,
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },

    plugins: {
      sonarjs,
    },

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
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
];
