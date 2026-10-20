/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf3f6',
          100: '#fbe8ef',
          200: '#f6d3e0',
          300: '#f0afc5',
          400: '#e77ca3',
          500: '#d94e73',
          600: '#c5345a',
          700: '#a52545',
          800: '#89223c',
          900: '#722035',
        },
        background: '#fdf4f7',
        surface: '#ffffff',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(217, 78, 115, 0.1)',
        'neumorphic': '6px 6px 12px #f0e6e9, -6px -6px 12px #ffffff',
        'neumorphic-inset': 'inset 6px 6px 12px #f0e6e9, inset -6px -6px 12px #ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
