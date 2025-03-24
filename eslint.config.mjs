// eslint.config.mjs
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  {
    // Configurazione globale per tutti i file
    ignores: ['node_modules/**', '.next/**', 'dist/**'],
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin
    },
    rules: {
      // Disattiva o rendi warning alcune regole problematiche
      '@typescript-eslint/no-explicit-any': 'warn', // Abbassa a warning invece di error
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_', 
        caughtErrorsIgnorePattern: '^_'
      }],
      'prefer-const': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    }
  },
  {
    // Configurazione specifica per i file React
    files: ['**/*.tsx', '**/*.jsx'],
    rules: {
      'react/no-unescaped-entities': 'warn'
    }
  },
  {
    // Configurazione specifica per le API routes
    files: ['**/api/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  }
];