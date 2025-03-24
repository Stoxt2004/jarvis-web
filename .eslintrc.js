// .eslintrc.js
module.exports = {
  // La tua configurazione esistente
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended'
  ],
  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  rules: {
    // Modifica regole per gli errori più frequenti
    
    // Consenti l'uso di underscore per variabili non utilizzate
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_'
    }],
    
    // Cambia il livello di severità per any da error a warning
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // Disabilita l'avviso per le entità non escaped in JSX
    'react/no-unescaped-entities': 'off',
    
    // Configura i warning per le dipendenze mancanti negli hooks
    'react-hooks/exhaustive-deps': 'warn',
    
    // Altre regole comuni che potrebbero essere utili
    'prefer-const': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    
    // Disabilita temporaneamente alcune regole durante lo sviluppo
    // '@typescript-eslint/ban-ts-comment': 'off',
    // '@typescript-eslint/no-non-null-assertion': 'off'
  }
};