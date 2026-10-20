import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import jsxUsesVars from './eslint-plugins/jsx-uses-vars.js'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'jsx-uses-vars/jsx-uses-vars': 'error',
    },
    plugins: {
      'jsx-uses-vars': jsxUsesVars,
    },
  },
  {
    // Context modules intentionally export provider components alongside hooks.
    files: ['src/contexts/*.jsx', 'src/dev/*.jsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
