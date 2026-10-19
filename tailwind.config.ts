import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F7F5F0',
        ink: '#221F1C',
        denim: {
          DEFAULT: '#35566B',
          dark: '#253C4A',
          light: '#5C7F93',
        },
        rust: {
          DEFAULT: '#A8472B',
          light: '#C97154',
        },
        sage: {
          DEFAULT: '#5B7A5E',
          light: '#8AA68C',
        },
        mustard: {
          DEFAULT: '#BD8A3C',
          light: '#D9AE6D',
        },
      },
      fontFamily: {
        display: ['"Big Shoulders Display"', 'sans-serif'],
        body: ['"Work Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
