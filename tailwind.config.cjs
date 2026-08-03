/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Tailwind v4 recommends enabling some optimizations such as
  // `optimizeUniversalDefaults` for faster builds and smaller output.
  experimental: {
    optimizeUniversalDefaults: true,
  },
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1rem',
        lg: '2rem',
      },
    },
    extend: {},
  },
  plugins: [],
};
