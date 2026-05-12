/** @type {import('tailwindcss').Config} */
//
// SOL — Tailwind config (admin). Mirror dashboard/tailwind.config.js để
// đồng bộ design tokens. Khi đổi gì ở đây phải copy sang dashboard + frontend.
//
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'sol-green': '#B25C2C',
        'sol-green-ink': '#6B3318',
        'sol-green-soft': '#F4DDC8',
        'sol-orange': '#B8860B',
        'sol-orange-ink': '#6B5008',
        'sol-orange-soft': '#F0E2B8',
        'sol-blue': '#3A7CA5',
        'sol-blue-ink': '#225573',
        'sol-blue-soft': '#E2EDF4',
        'sol-red': '#C62828',
        'sol-red-ink': '#8B0000',
        'sol-red-soft': '#F5DDD9',
        'sol-earth': '#5C3A1E',
        'sol-earth-ink': '#3A2410',
        'sol-earth-soft': '#E8DCCA',
        'sol-wine': '#8B2D2D',
        'sol-wine-ink': '#5C1A1A',
        'sol-wine-soft': '#F0DADA',
        'sol-bg': '#FBF7F0',
        'sol-soft': '#F0E5D0',
        'sol-paper': '#FFFFFF',
        'sol-line': '#D4C7A8',
        'sol-line-strong': '#A8957A',
        'sol-ink': '#2C2A27',
        'sol-ink-2': '#5A5650',
        'sol-ink-3': '#8A857C',
      },
      fontFamily: {
        sans: [
          '"Be Vietnam Pro"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      fontSize: {
        'meta':     ['14px', { lineHeight: '1.5', fontWeight: '500' }],
        'body':     ['17px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-lg':  ['19px', { lineHeight: '1.6', fontWeight: '400' }],
        'h3':       ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'h2':       ['21px', { lineHeight: '1.35', fontWeight: '600' }],
        'h1':       ['26px', { lineHeight: '1.25', fontWeight: '700' }],
        'display':  ['34px', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.01em' }],
      },
      borderRadius: {
        'lg': '12px',
        '2xl': '20px',
      },
      boxShadow: {
        'card':   '0 1px 2px rgba(60,50,30,0.04), 0 4px 12px rgba(60,50,30,0.06)',
        'pop':    '0 4px 12px rgba(60,50,30,0.08), 0 16px 32px rgba(60,50,30,0.10)',
      },
      minHeight: { 'tap': '48px' },
      minWidth: { 'tap': '48px' },
      animation: {
        'slide-up':   'slideUp 200ms ease-out',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        'fade-in':    'fadeIn 220ms ease-out',
      },
      keyframes: {
        slideUp:   { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        pulseSoft: { '0%, 100%': { opacity: '0.85' }, '50%': { opacity: '1' } },
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
      },
    },
  },
  plugins: [],
};
