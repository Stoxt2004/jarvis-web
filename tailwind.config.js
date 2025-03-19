// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette futuristica in stile Jarvis
        primary: {
          DEFAULT: '#0ea5e9', // Blu acceso
          dark: '#0284c7',
          light: '#38bdf8',
        },
        secondary: {
          DEFAULT: '#10b981', // Verde futuristico
          dark: '#059669',
          light: '#34d399',
        },
        background: {
          DEFAULT: '#0f172a', // Blu scuro
          light: '#1e293b',
          lighter: '#334155',
        },
        surface: {
          DEFAULT: '#1e293b', // Blu slate scuro
          light: '#334155',
          dark: '#0f172a',
        },
        accent: {
          DEFAULT: '#f59e0b', // Arancione/dorato
          dark: '#d97706',
          light: '#fbbf24',
        },
        danger: '#ef4444', // Rosso
        success: '#22c55e', // Verde
        info: '#3b82f6', // Blu
        warning: '#f97316', // Arancione
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-roboto-mono)', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      // Rimosso il boxShadow personalizzato che stava causando problemi
    },
  },
  plugins: [],
}