/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: '#F5F7FA',
        ink: '#18283B',
        muted: '#536276',
        brand: '#235C4B',
        line: '#DCE3EA',
      },
    },
  },
  plugins: [],
};
