export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EAFBF1',
          100: '#D3F5E2',
          200: '#A7E8C4',
          300: '#7AD9A4',
          400: '#58C98D',
          500: '#3FB979',
          600: '#2F9B63',
          700: '#257D4E',
          800: '#1B5B3A',
          900: '#113D27',
        },
      },
      boxShadow: {
        soft: '0 10px 32px rgba(14, 20, 30, 0.18)',
      },
    },
  },
  plugins: [],
};
