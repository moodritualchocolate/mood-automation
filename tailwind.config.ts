import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        editorial: ['var(--font-editorial)', 'Georgia', 'serif'],
        display: ['var(--font-display)', 'Helvetica Neue', 'sans-serif'],
        hebrew: ['var(--font-hebrew)', 'Heebo', 'Arial', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        ink: {
          900: '#0A0A0A',
          800: '#111111',
          700: '#1A1A1A',
          600: '#222222',
        },
        bone: {
          50: '#F7F5F2',
          100: '#EFEBE5',
          200: '#D8D2C8',
        },
        signal: {
          warning: '#FF4D2D',
          quiet: '#5C5C5C',
        },
      },
      letterSpacing: {
        editorial: '-0.02em',
        tight: '-0.04em',
      },
    },
  },
  plugins: [],
};

export default config;
