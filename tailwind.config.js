/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nueva paleta profesional azul
        'runt-light': '#E9F1FA',
        'runt-primary': '#00ABE4',
        'runt-primary-dark': '#0095C5',
        'runt-primary-light': '#33BDEE',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 15px -3px rgba(0, 171, 228, 0.08), 0 10px 20px -2px rgba(0, 171, 228, 0.04)',
        'card-hover': '0 10px 40px -10px rgba(0, 171, 228, 0.15), 0 20px 25px -5px rgba(0, 171, 228, 0.1)',
        'btn': '0 4px 14px -2px rgba(0, 171, 228, 0.4)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      animation: {
        'modal-in': 'modalIn 0.2s ease-out forwards',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
      },
      keyframes: {
        modalIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}