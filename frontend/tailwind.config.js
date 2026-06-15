export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0c0e12',
          1: '#11141a',
          2: '#181c24',
          3: '#1e222c',
        },
        accent: {
          DEFAULT: '#5b9aff',
          soft: 'rgba(91, 154, 255, 0.12)',
          hover: '#7db3ff',
          glow: 'rgba(91, 154, 255, 0.08)',
        },
      },
      borderRadius: {
        'xs': '6px',
        'sm': '10px',
        'md': '14px',
        'lg': '20px',
        'xl': '26px',
      },
      transitionDuration: {
        'fast': '120ms',
        'normal': '200ms',
        'smooth': '300ms',
        'spring': '400ms',
      },
    },
  },
  plugins: [],
}
