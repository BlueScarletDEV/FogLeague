/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fog: {
          orange: '#FF5500',
          'orange-glow': '#FF7733',
          dark: '#121214',
          card: '#1B1B1E',
          border: '#2A2A2E',
          subtle: '#888890',
        },
        faceit: {
          orange: '#FF5500',
          'orange-glow': '#FF7733',
          dark: '#121214',
          card: '#1B1B1E',
          border: '#2A2A2E',
          subtle: '#888890',
        },
        dbd: {
          blood: '#B21818',
          fog: '#232931',
          bone: '#E2DCD5',
          gold: '#FFD700',
          red: '#E53E3E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'fog-glow': '0 0 25px -5px rgba(255, 85, 0, 0.45)',
        'faceit-glow': '0 0 25px -5px rgba(255, 85, 0, 0.45)',
        'blood-glow': '0 0 25px -5px rgba(178, 24, 24, 0.55)',
      }
    },
  },
  plugins: [],
}
