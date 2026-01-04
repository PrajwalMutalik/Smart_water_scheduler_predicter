/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode manually if needed, but we default to dark styles
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        // Eco-Futurism Palette
        obsidian: {
          800: '#1e293b', // Slate 800
          900: '#0f172a', // Slate 900
          950: '#020617', // Slate 950 (Main BG)
        },
        neon: {
          green: '#10b981', // Emerald 500
          blue: '#0ea5e9', // Sky 500
          amber: '#f59e0b', // Amber 500
          rose: '#f43f5e',  // Rose 500
        },
        glass: {
          10: 'rgba(255, 255, 255, 0.05)',
          20: 'rgba(255, 255, 255, 0.1)',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #0ea5e9 0deg, #10b981 180deg, #0ea5e9 360deg)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
