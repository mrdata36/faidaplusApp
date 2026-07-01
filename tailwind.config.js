/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#0D85D8',
          green: '#27AE60',
        },
        brand: {
          picton: '#3ACBE8',
          battery: '#1CA3DE',
          bluecola: '#0D85D8',
          trueblue: '#0160C9',
          absolutezero: '#0041C7',
        },
        accent: {
          blue: '#3ACBE8',
        },
        gray: {
          dark: '#0F172A',
          mid: '#475569',
          light: '#CBD5E1',
          muted: '#94A3B8',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F8FAFC',
          dark: '#0B1223',
        },
        white: '#FFFFFF',
        danger: '#E74C3C',
        warning: '#F39C12',
      },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}