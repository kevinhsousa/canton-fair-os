/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canton: {
          dark: '#070D1E',
          navy: '#0B142B',
          surface: '#101D3E',
          card: '#14244D',
          border: 'rgba(217, 180, 91, 0.20)',
          borderSoft: 'rgba(217, 180, 91, 0.10)',
          gold: '#D9B45B',
          goldBright: '#EACB82',
          cream: '#F4EDDC',
          body: '#A9B4C9',
          dim: '#7E8AA3'
        }
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      }
    },
  },
  plugins: [],
}
