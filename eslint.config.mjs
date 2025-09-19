import js from '@eslint/js';
import typescript from 'typescript-eslint';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import jest from 'eslint-plugin-jest';

export default [
  js.configs.recommended,
  ...typescript.configs.recommended,
  security.configs.recommended,
  sonarjs.configs.recommended,
  {
    files: ['**/*.{ts,js}'],
    plugins: {
      '@typescript-eslint': typescript.plugin,
      security,
      sonarjs
    },
    rules: {
      // TypeScript specific
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',

      // Code quality
      complexity: ['error', { max: 10 }],
      'max-depth': ['error', 4],
      'max-lines-per-function': ['error', { max: 50 }],
      'no-console': 'warn',
      'prefer-const': 'error',

      // Security
      'security/detect-object-injection': 'error',
      'security/detect-non-literal-regexp': 'error',

      // SonarJS rules
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-duplicate-string': ['error', 3]
    }
  },
  {
    files: ['**/*.test.{ts,js}', '**/*.spec.{ts,js}'],
    plugins: {
      jest
    },
    rules: {
      ...jest.configs.recommended.rules,
      'max-lines-per-function': 'off'
    }
  }
];
