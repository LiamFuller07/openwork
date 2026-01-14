/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm cream theme matching Cowork reference
        cream: {
          50: '#FEFDFB',
          100: '#FBF9F5',
          200: '#F5F3EE',
          300: '#EDE9E0',
          400: '#DED8CA',
          500: '#C9C1AF',
        },
        // Terracotta accent (CTA button)
        terracotta: {
          400: '#D4826A',
          500: '#C4644A',
          600: '#A8533C',
        },
        // Dark text
        ink: {
          100: '#6B6B6B',
          200: '#4A4A4A',
          300: '#2D2D2D',
          400: '#1A1A1A',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      backgroundImage: {
        'grid-pattern': `
          radial-gradient(circle, #D5D0C4 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'grid': '24px 24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
