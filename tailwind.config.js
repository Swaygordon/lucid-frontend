/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Body / default — Plus Jakarta Sans across the whole UI
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        // Display — Plus Jakarta Sans for headings and brand moments
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      height: {
        '128': '28rem',
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '10px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
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
          DEFAULT: '#c2410c',   // orange-700 — orange-600 (#ea580c) failed WCAG AA contrast with white text
          hover: '#9a3412',
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
        // Softened, slate-tinted, low-alpha multi-layer elevations
        sm:  '0 1px 2px 0 rgb(15 23 42 / 0.04)',
        md:  '0 2px 4px -1px rgb(15 23 42 / 0.06), 0 1px 2px rgb(15 23 42 / 0.04)',
        lg:  '0 8px 20px -4px rgb(15 23 42 / 0.08), 0 2px 6px rgb(15 23 42 / 0.04)',
        xl:  '0 16px 36px -8px rgb(15 23 42 / 0.10), 0 4px 10px rgb(15 23 42 / 0.05)',
        // Colored glow shadows for buttons and stat cards
        'glow-blue':   '0 4px 18px -2px rgba(37,99,235,0.45)',
        'glow-green':  '0 4px 18px -2px rgba(16,185,129,0.45)',
        'glow-orange': '0 4px 18px -2px rgba(234,88,12,0.45)',
        'glow-purple': '0 4px 18px -2px rgba(139,92,246,0.45)',
        'glow-red':    '0 4px 18px -2px rgba(239,68,68,0.45)',
      },
    },
  },

  plugins: [],
}
