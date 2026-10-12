/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // CAD app sleek neutral gray/charcoal theme palette
        canvas: {
          bg: '#18181b',      // Zinc-900 dark charcoal canvas background
          grid: '#27272a',    // Zinc-800 clean graphite grid
        },
        panel: {
          bg: '#202024',      // Zinc-850 sleek dark gray panel
          border: '#333338',  // Zinc-750 crisp neutral border
          hover: '#2a2a30',   // Zinc-700 subtle neutral hover
        },
        toolbar: {
          bg: '#18181b',      // Zinc-900 matching toolbar
          active: '#3f3f46',  // Zinc-700 active button
        },
        accent: {
          blue: '#71717a',    // Zinc-500 neutral gray primary accent
          steel: '#a1a1aa',   // Zinc-400 silver/slate accent
          silver: '#e4e4e7',  // Zinc-200 bright silver
          green: '#22c55e',   // Success green for status & dimensions
        }
      }
    },
  },
  plugins: [],
}