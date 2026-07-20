/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#050505',
        secondaryBg: '#0B0B0B',
        cardBg: '#111111',
        primaryOrange: '#FF6A00',
        orangeHover: '#FF7A1A',
        primaryText: '#FFFFFF',
        mutedText: '#A3A3A3',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        space: ['Space Grotesk', 'sans-serif'],
      },
      borderColor: {
        defaultBorder: 'rgba(255, 255, 255, 0.1)',
        orangeBorder: 'rgba(255, 106, 0, 0.35)',
      },
      backgroundColor: {
        softOrange: 'rgba(255, 106, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
