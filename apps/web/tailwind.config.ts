import type { Config } from 'tailwindcss'

const config: Config = {
  content": [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  "theme": {
    "extend": {
      "colors": {
        "primary": "#00ff9d",
        "primary-dark": "#00cc7d",
        "bg": "#0a0a0a",
        "bg-light": "#111"
      }
    }
  },
  "plugins": []
}

export default config
