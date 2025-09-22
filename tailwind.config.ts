import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          dark: '#2c2f33',
          darker: '#23272a',
          blurple: '#5865f2',
          purple: '#7289da',
          green: '#43b581',
          yellow: '#faa61a',
          red: '#f04747',
          gray: '#99aab5',
          'light-gray': '#b9bbbe',
          white: '#ffffff',
        },
      },
    },
  },
  plugins: [],
}
export default config