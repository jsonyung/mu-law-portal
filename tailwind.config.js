/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Literata', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          navy: 'hsl(222 47% 11%)',
          'navy-soft': 'hsl(222 35% 18%)',
          indigo: 'hsl(239 58% 52%)',
        },
      },
      maxWidth: {
        content: 'var(--content-max)',
      },
    },
  },
  plugins: [],
};
