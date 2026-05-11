/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
      },
      height: {
        '128': '28rem',
      },
      colors: {
        // Primary brand colors
        primary: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
          light: '#3b82f6',
          dark: '#1e40af',
          50: '#eff6ff',
        },
        // Secondary colors
        secondary: {
          DEFAULT: '#ea580c',
          hover: '#c2410c',
          light: '#f97316',
          dark: '#9a3412',
          50: '#fff7ed',
        },
        // Status colors
        success: '#10b981',
        error: {
          DEFAULT: '#ef4444',
          50: '#fef2f2',
        },
        warning: '#f59e0b',
        info: '#3b82f6',
      },
      boxShadow: {
        sm:  '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md:  '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 1px 3px rgb(0 0 0 / 0.05)',
        lg:  '0 10px 24px -4px rgb(0 0 0 / 0.1), 0 2px 6px rgb(0 0 0 / 0.05)',
        xl:  '0 20px 40px -8px rgb(0 0 0 / 0.12), 0 4px 12px rgb(0 0 0 / 0.06)',
        // Colored glow shadows for buttons and stat cards
        'glow-blue':   '0 4px 18px -2px rgba(37,99,235,0.45)',
        'glow-green':  '0 4px 18px -2px rgba(16,185,129,0.45)',
        'glow-orange': '0 4px 18px -2px rgba(234,88,12,0.45)',
        'glow-purple': '0 4px 18px -2px rgba(139,92,246,0.45)',
        'glow-red':    '0 4px 18px -2px rgba(239,68,68,0.45)',
      },
    },
  },
  
  plugins: [require("daisyui")],
}