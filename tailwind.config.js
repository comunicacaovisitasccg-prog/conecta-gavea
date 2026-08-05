/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef2f7',
          100: '#d6e0ec',
          200: '#adc1d9',
          300: '#7f9ec2',
          400: '#4f7aa8',
          500: '#2e5a89',
          600: '#1f4269',
          700: '#152f4d',
          800: '#0f2238',
          900: '#0a1826',
        },
        lime: {
          400: '#c8e84a',
          500: '#b4d92f',
          600: '#98bd1e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
