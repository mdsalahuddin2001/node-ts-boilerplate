import js from '@eslint/js';
import typescript from 'typescript-eslint';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import jest from 'eslint-plugin-jest';

export default [
  js.configs.recommended,
  ...typescript.configs.recommended,
  security.configs.recommended, // already includes plugin
  sonarjs.configs.recommended, // already includes plugin
  {
    files: ['**/*.{ts,js}'],
    plugins: {
      '@typescript-eslint': typescript.plugin,
    },
    rules: {
      // TypeScript specific
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all', // check all variables
          args: 'all', // check all function params
          ignoreRestSiblings: true, // still allow ...rest without error
          argsIgnorePattern: '^_', // allow _req, _res, _next (optional)
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',

      // Code quality
      complexity: ['error', { max: 15 }],
      'max-depth': ['error', 4],
      'max-lines-per-function': ['error', { max: 500 }],
      'no-console': 'warn',
      'prefer-const': 'error',

      // Security rules
      'security/detect-object-injection': 'error',
      'security/detect-non-literal-regexp': 'error',

      // SonarJS rules
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-duplicate-string': ['error', { threshold: 3 }],
      'sonarjs/no-commented-code': 'off',
      'sonarjs/todo-tag': 'off',
    },
  },
  {
    files: ['**/*.test.{ts,js}', '**/*.spec.{ts,js}'],
    plugins: {
      jest,
    },
    rules: {
      ...jest.configs.recommended.rules,
      'max-lines-per-function': 'off',
    },
  },
];
