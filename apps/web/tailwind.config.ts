import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        background: '#0a0a0a',
        surface: '#171717',
        'surface-elevated': '#262626',

        // Border colors
        border: '#404040',

        // Text colors
        'text-primary': '#f5f5f5',
        'text-secondary': '#a3a3a3',
        'text-tertiary': '#737373',

        // Trading colors
        long: '#22c55e',
        'long-muted': '#16a34a',
        short: '#ef4444',
        'short-muted': '#dc2626',

        // Accent colors
        accent: '#3b82f6',
        warning: '#f59e0b',

        // Alias for buy/sell
        buy: '#22c55e',
        sell: '#ef4444',
        profit: '#22c55e',
        loss: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        'data-xs': ['0.6875rem', { lineHeight: '1.25rem' }], // 11px
        'data-sm': ['0.75rem', { lineHeight: '1.25rem' }], // 12px
        'data-base': ['0.8125rem', { lineHeight: '1.5rem' }], // 13px
      },
      animation: {
        'fade-in': 'fadeIn 150ms ease-out',
        'slide-in': 'slideIn 200ms ease-out',
        'flash-green': 'flashGreen 300ms ease-out',
        'flash-red': 'flashRed 300ms ease-out',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        flashGreen: {
          '0%': { backgroundColor: 'rgba(34, 197, 94, 0.3)' },
          '100%': { backgroundColor: 'transparent' },
        },
        flashRed: {
          '0%': { backgroundColor: 'rgba(239, 68, 68, 0.3)' },
          '100%': { backgroundColor: 'transparent' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
