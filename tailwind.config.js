/** @type {import('tailwindcss').Config} */
module.exports = {
  // Enable class-based dark mode
  darkMode: 'class',
  
  content: [
    './src/**/*.{js,jsx,ts,tsx}',  // All React files in src
    './public/index.html'          // If you use classes in index.html
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}