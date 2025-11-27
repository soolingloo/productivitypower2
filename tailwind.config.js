/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-blue-200',
    'bg-purple-200',
    'bg-green-200',
    'bg-orange-200',
    'bg-pink-200',
    'bg-teal-200',
    'bg-indigo-200',
    'bg-rose-200',
    'bg-amber-200',
    'bg-cyan-200',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
