import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        'foil-shimmer': 'foil-shimmer 3s linear infinite',
      },
      keyframes: {
        'foil-shimmer': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}

export default config