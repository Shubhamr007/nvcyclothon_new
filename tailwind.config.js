/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { ink: '#20342d', cream: '#f7f0df', rust: '#b94d25', gold: '#e0b04a' },
      fontFamily: { display: ['"Playfair Display"', 'serif'], sans: ['"DM Sans"', 'sans-serif'] },
    },
  },
  plugins: [],
};
