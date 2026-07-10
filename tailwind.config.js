/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        'quest-gold': '#D4AF37',
        'quest-dark': '#0f0f0f',
        'quest-green': '#2d5a3d',
        'quest-blue-dark': '#1a3a5c',
        'quest-purple': '#3d2d5a',
        'quest-teal': '#2d5a5a',
        'quest-brown': '#5a4a3a',
        'quest-card-border': '#8B7355',
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
        'quest-title': ['Georgia', 'serif'],
      },
      borderRadius: {
        'quest-lg': '16px',
      },
      boxShadow: {
        'quest-card': '0 0 20px rgba(212, 175, 55, 0.3)',
      },
    },
  },
  plugins: [],
};
