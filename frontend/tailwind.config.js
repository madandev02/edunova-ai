/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0e1f2f',
        muted: '#3b5166',
        line: '#dbe5ef',
        brand: '#0f6cbd',
        weak: '#b42318',
        strong: '#067647',
      },
      boxShadow: {
        soft: '0 18px 40px rgba(20, 49, 86, 0.1)',
      },
      borderRadius: {
        xl: '1rem',
      },
    },
  },
  plugins: [],
}

