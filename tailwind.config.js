/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cartel: {
          void: '#05070a',
          bg: '#080A0F',
          midnight: '#111827',
          charcoal: '#17191E',
          pumpkin: '#F27A1A',
          amber: '#F6A63A',
          silver: '#C8D1DA',
          ghost: '#E8E6DF',
          purple: '#35243F',
          cyan: '#7FE5D9',
          bone: '#E2E8F0',
          frostBorder: 'rgba(127, 229, 217, 0.18)',
          amberBorder: 'rgba(246, 166, 58, 0.3)',
          pumpkinBorder: 'rgba(242, 122, 26, 0.35)'
        }
      },
      fontFamily: {
        gothic: ['"Cinzel Decorative"', 'Cinzel', 'Georgia', 'serif'],
        cinzel: ['Cinzel', 'Georgia', 'serif'],
        cormorant: ['"Cormorant Garamond"', 'Cinzel', 'Georgia', 'serif'],
        garamond: ['"EB Garamond"', 'Georgia', 'serif'],
        manuscript: ['"IM Fell English"', '"EB Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Courier New"', 'Courier', 'monospace']
      },
      boxShadow: {
        pumpkinGlow: '0 0 25px rgba(242, 122, 26, 0.45), 0 0 50px rgba(246, 166, 58, 0.2)',
        pumpkinGlowLg: '0 0 35px rgba(242, 122, 26, 0.6), 0 0 70px rgba(246, 166, 58, 0.3)',
        frostGlow: '0 0 25px rgba(127, 229, 217, 0.35), 0 0 60px rgba(127, 229, 217, 0.15)',
        runicCard: '0 10px 30px -5px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(200, 209, 218, 0.1)'
      },
      keyframes: {
        'rune-spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' }
        },
        'subtle-pulse': {
          '0%, 100%': { opacity: '0.92', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.015)' }
        }
      },
      animation: {
        'spin-slow': 'rune-spin 48s linear infinite',
        'spin-slow-reverse': 'rune-spin 64s linear infinite reverse',
        'subtle-pulse': 'subtle-pulse 8s ease-in-out infinite'
      }
    },
  },
  plugins: [],
}

