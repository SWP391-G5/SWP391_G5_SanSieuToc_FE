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
        // --- Owner Hub Design Tokens ---
        'primary-container': '#2ff801',
        'tertiary': '#88f6ff',
        'on-primary': '#0d6100',
        'on-surface': '#fdfdf6',
        'on-surface-variant': '#abaca5',
        'surface': '#0d0f0b',
        'surface-container-lowest': '#000000',
        'surface-container-low': '#121410',
        'surface-container': '#181a16',
        'surface-container-high': '#1e201b',
        'surface-container-highest': '#242721',
        'surface-variant': '#242721',
        'surface-bright': '#2a2d27',
        'outline-variant': '#474944',
        'error': '#ff7351',
        'error-container': '#b92902',
        // -------------------------------
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

