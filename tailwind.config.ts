import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#6C5CE7',
        secondary: '#00C2A8',
        accent: '#FFB020',
        success: '#22C55E',
        danger: '#FF5A6E',
        bg: '#F7F5FF',
        surface: '#FFFFFF',
        ink: '#1E1B4B',
        muted: '#6B6B8D',
        cat: {
          ilimler: '#6C5CE7',
          siyer: '#FF8A3D',
          tarih: '#3D8BFF',
          sahabe: '#00C2A8',
          kuran: '#22B573',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        arabic: ['Amiri', 'serif'],
      },
      borderRadius: { card: '20px', btn: '14px' },
      boxShadow: { card: '0 6px 24px rgba(108, 92, 231, 0.12)' },
    },
  },
  plugins: [],
} satisfies Config
