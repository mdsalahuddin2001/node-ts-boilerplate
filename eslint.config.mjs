import js from '@eslint/js'
import typescript from 'typescript-eslint'
import security from 'eslint-plugin-security'
import sonarjs from 'eslint-plugin-sonarjs'
import jest from 'eslint-plugin-jest'

export default [
  js.configs.recommended,
  ...typescript.configs.recommended,
  // Security + SonarJS recommended already include plugin registration
  security.configs.recommended,
  sonarjs.configs.recommended,
  {
    files: ['**/*.{ts,js}'],
    plugins: {
      '@typescript-eslint': typescript.plugin,
      // ❌ remove security & sonarjs here, already included above
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

      // Security rules
      'security/detect-object-injection': 'error',
      'security/detect-non-literal-regexp': 'error',

      // SonarJS rules (must use object format)
      'sonarjs/cognitive-complexity': ['error', 15], // just number
      'sonarjs/no-duplicate-string': ['error', { threshold: 3 }], // object
    },
  },
  {
    files: ['**/*.test.{ts,js}', '**/*.spec.{ts,js}'],
    ...jest.configs.recommended, // ✅ includes plugin & rules
    rules: {
      ...jest.configs.recommended.rules,
      'max-lines-per-function': 'off',
    },
  },
]
