/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'card-green': '#1a7f37',
        'card-red': '#c41e3a',
        'table-green': '#0d5c2f',
      }
    },
  },
  plugins: [],
}
