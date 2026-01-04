import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background colors - improved contrast
        background: '#0a0a0a',
        surface: '#171717',
        'surface-elevated': '#1f1f1f', // Darker for better contrast
        'surface-hover': '#232323', // Darker hover state

        // Border colors - improved contrast
        border: '#4a4a4a', // Lighter for better visibility
        'border-strong': '#666666', // For important borders

        // Text colors - improved contrast ratios
        'text-primary': '#ffffff', // White for best contrast
        'text-secondary': '#d1d1d1', // Lighter gray for better contrast
        'text-tertiary': '#a1a1a1', // Improved contrast vs background
        'text-quaternary': '#717171', // For subtle text

        // Trading colors - improved contrast
        long: '#34d399', // Lighter green for better contrast
        'long-muted': '#22c55e',
        'long-strong': '#10b981', // Darker for text on light backgrounds
        short: '#ef4444',
        'short-muted': '#dc2626',
        'short-strong': '#b91c1c', // Darker for text on light backgrounds

        // Accent colors - improved contrast
        accent: '#60a5fa', // Lighter blue for better contrast
        'accent-strong': '#2563eb', // Darker for text
        warning: '#f59e0b',
        'warning-strong': '#d97706', // Darker for text

        // New accessibility-focused colors
        'focus-ring': '#93c5fd', // Light blue for focus indicators
        'success': '#22c55e',
        'error': '#ef4444',
        'info': '#3b82f6',
        'warning-bg': '#fff3cd', // Light yellow for warnings
        'error-bg': '#f8d7da', // Light red for errors
        'success-bg': '#d1fae5', // Light green for success

        // Alias for buy/sell
        buy: '#34d399',
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
