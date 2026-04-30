/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // DevMatch palette — soft pink + white system
        brand: {
          50: '#fff5f7',
          100: '#ffe4ec',
          200: '#fbcfe0',
          300: '#f9a8c4',
          400: '#f472a6',
          500: '#ec4899', // primary pink
          600: '#db2777',
          700: '#be185d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 6px 24px rgba(236, 72, 153, 0.12)',
        soft: '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      backgroundImage: {
        'pink-gradient': 'linear-gradient(135deg, #fff5f7 0%, #ffe4ec 100%)',
        'brand-gradient': 'linear-gradient(135deg, #f472a6 0%, #ec4899 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'pop': 'pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
