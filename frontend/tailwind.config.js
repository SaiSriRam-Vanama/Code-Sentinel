/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a', // slate-900
        surface: '#1e293b', // slate-800
        primary: '#3b82f6', // blue-500
        secondary: '#8b5cf6', // violet-500
        accent: '#f43f5e', // rose-500
        textMain: '#f8fafc', // slate-50
        textMuted: '#94a3b8', // slate-400
        success: '#10b981', // emerald-500
        warning: '#f59e0b', // amber-500
        danger: '#ef4444', // red-500
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
