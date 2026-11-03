/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // DevMatch Pink + Yellow system
        brand: {
          50: '#fff5f8',
          100: '#ffe4ed',
          200: '#fbcfe2',
          300: '#f9a8cb',
          400: '#f472ab',
          500: '#ec4899', // primary vivid pink
          600: '#db2777',
          700: '#be185d',
        },
        sun: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15', // electric sunny yellow
          500: '#eab308', // rich golden yellow
          600: '#ca8a04',
          700: '#a16207',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px -5px rgba(236, 72, 153, 0.12), 0 4px 12px -2px rgba(245, 158, 11, 0.12)',
        'card-hover': '0 20px 35px -5px rgba(236, 72, 153, 0.18), 0 10px 18px -3px rgba(245, 158, 11, 0.16)',
        soft: '0 2px 10px rgba(234, 179, 8, 0.08)',
        glow: '0 0 25px rgba(250, 204, 21, 0.4)',
        'pink-glow': '0 0 25px rgba(236, 72, 153, 0.35)',
      },
      backgroundImage: {
        'pink-gradient': 'linear-gradient(135deg, #fff5f8 0%, #fffbeb 50%, #fef9c3 100%)',
        'brand-gradient': 'linear-gradient(135deg, #ec4899 0%, #f43f5e 45%, #f59e0b 100%)',
        'sun-gradient': 'linear-gradient(135deg, #fde047 0%, #f59e0b 100%)',
        'pink-yellow-subtle': 'linear-gradient(135deg, #fff1f2 0%, #fefce8 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        pop: 'pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        pulse_slow: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
