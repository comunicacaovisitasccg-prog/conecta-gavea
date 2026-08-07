/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#12213a',
        green: '#6f8a3f',
        greenfill: '#8bc53f',
        cream: '#f4f3f0',
        mint: '#f6f9f0',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        poppins: ['Poppins', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
