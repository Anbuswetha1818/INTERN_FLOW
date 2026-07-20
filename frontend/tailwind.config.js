/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    screens: {
      xs: '375px',   // small phones
      sm: '640px',   // large phones
      md: '768px',   // tablets
      lg: '1024px',  // small laptops
      xl: '1280px',  // laptops/desktops
      '2xl': '1536px', // large monitors
    },
    extend: {
      colors: {
        brand: {
          light: '#378ADD',
          DEFAULT: '#185FA5',
          dark: '#0C447C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
