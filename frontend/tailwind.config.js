/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Odoo-inspired color system
        'primary': '#875A7B',
        'primary-hover': '#A6789C',
        'bg': '#FFFFFF',
        'bg-soft': '#F6F6F6',
        'text-primary': '#2E2E2E',
        'text-secondary': '#6B6B6B',
        'accent-light': '#EADBE7',
        
        // Legacy support - mapped to new colors
        'primary-dark': '#875A7B',
        'secondary-dark': '#875A7B',
        'muted-blue': '#6B6B6B',
        'teal-blue': '#A6789C',
        'soft-blue': '#A6789C',
        'light-accent': '#EADBE7',
        'background-light': '#F6F6F6',
      },
      fontFamily: {
        heading: ['Gabarito', 'sans-serif'],
        body: ['Quicksand', 'sans-serif'],
      },
      boxShadow: {
        'ios-sm': '0 1px 3px 0 rgba(46, 46, 46, 0.08), 0 1px 2px 0 rgba(46, 46, 46, 0.04)',
        'ios-md': '0 4px 6px -1px rgba(46, 46, 46, 0.08), 0 2px 4px -1px rgba(46, 46, 46, 0.04)',
        'ios-lg': '0 10px 15px -3px rgba(46, 46, 46, 0.08), 0 4px 6px -2px rgba(46, 46, 46, 0.04)',
        'ios-xl': '0 20px 25px -5px rgba(46, 46, 46, 0.08), 0 10px 10px -5px rgba(46, 46, 46, 0.03)',
      },
      backdropBlur: {
        'ios': '20px',
      },
      transitionDuration: {
        '250': '250ms',
      },
    },
  },
  plugins: [],
}
