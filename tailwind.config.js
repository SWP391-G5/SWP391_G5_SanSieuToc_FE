/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#00E536',
        secondary: '#166534',
        accent: '#FDE047',
        'background-light': '#F0FDF4',
        'background-dark': '#052e16',
        'surface-light': '#FFFFFF',
        'surface-dark': '#14532d',
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        body: ['Montserrat', 'sans-serif'],
        headline: ['Lexend', 'sans-serif'],
        label: ['Lexend', 'sans-serif'],
        ui: ['Manrope', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'neon': '0 0 10px rgba(0, 229, 54, 0.5)',
      },
    },
  },
  plugins: [],
}

