/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 24px 60px rgba(15, 23, 42, 0.12)',
        glow: '0 0 45px rgba(56, 189, 248, 0.18)',
      },
      colors: {
        surface: {
          900: '#08101f',
          800: '#111f35',
          700: '#172843',
          500: '#26355c',
          200: '#dce7ff',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          300: '#a5b4fc',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        accent: {
          500: '#22d3ee',
          600: '#06b6d4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-glow': 'radial-gradient(circle at top, rgba(56, 189, 248, 0.18), transparent 40%)',
      },
    },
  },
  plugins: [],
}
