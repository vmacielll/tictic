import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f5ff',
          100: '#e0eaff',
          200: '#c2d5ff',
          300: '#93b4fd',
          400: '#608efb',
          500: '#3b6bf7',
          600: '#274bee',
          700: '#1d3add',
          800: '#1f32b3',
          900: '#1f2f8d',
          950: '#171d54',
        },
      },
    },
  },
  plugins: [],
}
export default config
