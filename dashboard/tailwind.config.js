/** @type {import('tailwindcss').Config} */
//
// SOL — Tailwind config (dashboard). Phải GIỐNG HỆT frontend/tailwind.config.js.
// Khi đổi gì ở đây, copy y nguyên sang frontend.
//
// Triết lý:
//  • Palette ấm — phù hợp người trên 45, đang trong giai đoạn cai thuốc (TK nhạy cảm).
//  • Naming flat: bg-sol-green, không phải bg-sol.green (Tailwind dễ autocomplete).
//  • Typography scale semantic (text-h1, text-body) thay vì size-based (text-lg, text-xl).
//  • Min touch target 48px cho mobile (ngón tay người lớn).
//
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand — không đổi vì đã in vào tài liệu, mockup, in ấn workbook
        'sol-green': '#3AA06B',
        'sol-green-ink': '#1F6B43',  // chữ xanh đậm (contrast AAA trên nền kem)
        'sol-green-soft': '#E5F1EA',
        'sol-orange': '#E8812E',
        'sol-orange-ink': '#A95A14',
        'sol-orange-soft': '#FBEBDA',
        'sol-blue': '#3A7CA5',
        'sol-blue-ink': '#225573',
        'sol-blue-soft': '#E2EDF4',
        'sol-red': '#C04331',
        'sol-red-ink': '#8B2D1F',
        'sol-red-soft': '#F5DDD9',

        // Neutrals
        'sol-bg': '#F7F4EF',         // nền chính — giấy ấm, ít phản chiếu blue light
        'sol-soft': '#EEE9E0',        // nền phụ — sidebar, divider band
        'sol-paper': '#FFFFFF',       // card, input — vẫn dùng trắng cho card để có contrast với nền
        'sol-line': '#E5DFD3',        // border tinh tế
        'sol-line-strong': '#CFC8B9', // border đậm hơn

        // Text — fixed alpha, không dùng /40 /50 nữa để contrast nhất quán
        'sol-ink': '#2C2A27',         // chữ chính, contrast 14:1 trên sol-bg
        'sol-ink-2': '#5A5650',       // chữ phụ (label, meta) — contrast 7.8:1
        'sol-ink-3': '#8A857C',       // chữ mờ (placeholder, hint) — contrast 4.6:1
      },

      fontFamily: {
        // Be Vietnam Pro — quốc dân cho sản phẩm Việt cao cấp.
        // System font fallback nếu Google Font load chậm.
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
        // Semantic scale — hợp tuổi 45+ (base 17px thay vì 16px)
        'meta':     ['14px', { lineHeight: '1.5', fontWeight: '500' }],
        'body':     ['17px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-lg':  ['19px', { lineHeight: '1.6', fontWeight: '400' }],
        'h3':       ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'h2':       ['21px', { lineHeight: '1.35', fontWeight: '600' }],
        'h1':       ['26px', { lineHeight: '1.25', fontWeight: '700' }],
        'display':  ['34px', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.01em' }],
      },

      borderRadius: {
        // 3 mức cố định — không 'rounded-md' / 'rounded-xl' lung tung
        'lg': '12px',
        '2xl': '20px',
      },

      boxShadow: {
        'card':   '0 1px 2px rgba(60,50,30,0.04), 0 4px 12px rgba(60,50,30,0.06)',
        'pop':    '0 4px 12px rgba(60,50,30,0.08), 0 16px 32px rgba(60,50,30,0.10)',
        'widget': '0 10px 40px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.05)',
      },

      minHeight: {
        'tap': '48px',     // min touch target
      },
      minWidth: {
        'tap': '48px',
      },

      animation: {
        'slide-up':    'slideUp 200ms ease-out',
        'pulse-soft':  'pulseSoft 2.4s ease-in-out infinite',
        'fade-in':     'fadeIn 220ms ease-out',
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
