import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        // Sol brand palette
        sol: {
          brown: '#5C3A1E',      // Primary brown
          orange: '#B25C2C',     // Accent orange (CTA)
          paper: '#FFF4EA',      // Background warm paper
          cream: '#FAF4EC',      // Light background
          ink: '#2C2A27',        // Primary text
          ink2: '#5A5650',       // Secondary text
          green: '#16A34A',      // FTND Nhẹ
          amber: '#D97706',      // FTND Vừa
          red: '#DC2626',        // FTND Nặng
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['Georgia', 'serif']
      },
      maxWidth: {
        'content': '720px'
      }
    }
  },
  plugins: []
};

export default config;
