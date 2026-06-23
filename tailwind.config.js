/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        priority: {
          high: '#fca5a5',
          medium: '#fde68a',
          low: '#bbf7d0'
        }
      }
    },
  },
  plugins: [],
}