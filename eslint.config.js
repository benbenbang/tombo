import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts', 'src/**/*.js'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json'
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        NodeJS: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true,
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-extra-semi': 'off',
      'eqeqeq': 'warn',
      'no-case-declarations': 'off',
      'no-console': 'off',
      'no-duplicate-imports': 'error',
      'no-unused-expressions': 'off',
      'no-useless-escape': 'warn',
      'no-var': 'error',
      'prefer-const': 'warn',
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': 'off',
      '@typescript-eslint/semi': ['error', 'always']
    }
  },
  {
    files: ['src/test/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-expressions': 'off'
    }
  },
  {
    ignores: [
      'out/**',
      'dist/**',
      'node_modules/**',
      '**/*.d.ts',
      'bundled/**',
      'webpack.config.js',
      '.prettierrc.js',
      'tmp/**',
      'tests/**/*.toml'
    ]
  }
];
