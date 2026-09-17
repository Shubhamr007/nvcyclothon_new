/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    // Keep rendered type and shape choices deliberately small across public pages.
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.25rem', { lineHeight: '1.75rem' }],
      xl: ['1.5rem', { lineHeight: '2rem' }],
      '2xl': ['2rem', { lineHeight: '2.25rem' }],
      '3xl': ['2rem', { lineHeight: '2.25rem' }],
      '4xl': ['3rem', { lineHeight: '1' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['4rem', { lineHeight: '1' }],
      '7xl': ['4rem', { lineHeight: '1' }],
    },
    borderRadius: {
      none: '0px', sm: '0.25rem', DEFAULT: '0.5rem', md: '0.5rem',
      lg: '0.75rem', xl: '1rem', '2xl': '1.5rem', '3xl': '1.5rem', full: '9999px',
    },
    extend: {
      colors: { ink: '#20342d', cream: '#f7f0df', rust: '#b94d25', gold: '#e0b04a' },
      fontFamily: { display: ['"Playfair Display"', 'serif'], sans: ['"DM Sans"', 'sans-serif'] },
    },
  },
  plugins: [],
};
