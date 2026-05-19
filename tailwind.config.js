/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        himgiri: {
          primary: '#2563eb',
          'primary-light': '#dbeafe',
          'primary-dark': '#1e40af',
          success: '#10b981',
          'success-light': '#ecfdf5',
          'success-dark': '#065f46',
          danger: '#ef4444',
          'danger-light': '#fef2f2',
          'danger-dark': '#991b1b',
          warning: '#f59e0b',
          'warning-light': '#fffbeb',
          'warning-dark': '#92400e',
          secondary: '#64748b',
          'secondary-light': '#f1f5f9',
          'secondary-dark': '#334155',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
