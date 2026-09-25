/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
        },
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        pulseSoft: 'pulseSoft 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
