/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff4ef',
          100: '#ffe3d6',
          500: '#ee4d2d',
          600: '#dc3d1f',
          700: '#bd2f18'
        }
      }
    }
  },
  plugins: []
};
