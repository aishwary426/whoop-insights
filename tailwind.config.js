/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: '#00FF8F',
        'neon-light': '#0066FF', // Darker neon blue for light mode
        bgDark: '#02030A',
        bgDarker: '#000000',
        'neon-primary': '#00FF8F', // Keep for backward compatibility if needed
        'neon-secondary': '#A6FFCB',
      },
      fontFamily: {
        sans: ['var(--font-montserrat)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'sans-serif'],
      },
      boxShadow: {
        'neon-soft': '0 0 20px rgba(0, 255, 143, 0.15)',
        'neon-soft-light': '0 0 20px rgba(0, 102, 255, 0.25)', // Darker blue shadow for light mode
        'neon-card': '0 0 0 1px rgba(255, 255, 255, 0.05), 0 10px 40px rgba(0, 0, 0, 0.5)',
      },
      transitionTimingFunction: {
        apple: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'border-glow': 'border-glow 3s ease-in-out infinite',
      },
      keyframes: {
        'border-glow': {
          '0%': { 
            backgroundPosition: '0% 50%',
            transform: 'rotate(0deg)',
          },
          '50%': { 
            backgroundPosition: '100% 50%',
          },
          '100%': { 
            backgroundPosition: '0% 50%',
            transform: 'rotate(360deg)',
          },
        },
      },
    },
  },
  plugins: [],
}
