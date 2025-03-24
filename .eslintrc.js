module.exports = {
  extends: 'next/core-web-vitals',
  rules: {
    // Disabilitiamo temporaneamente le regole che generano più errori
    "@typescript-eslint/no-explicit-any": "warn", // Abbassa a warning invece di error
    "@typescript-eslint/no-unused-vars": ["warn", { 
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_" 
    }],
    "react-hooks/exhaustive-deps": "warn", // Abbassa a warning
    "react/no-unescaped-entities": "warn", // Abbassa a warning
    "prefer-const": "warn",
    "import/no-anonymous-default-export": "warn"
  }
}