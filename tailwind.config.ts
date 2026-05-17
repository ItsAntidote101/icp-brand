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
        brand: {
          primary: '#302161',
          bg: '#ffffff',
          'bg-alt': '#f8f7ff',
        },
      },
      fontFamily: {
        display: ['PolySans', 'var(--font-dm-sans)', '-apple-system', 'sans-serif'],
        body: ['-apple-system', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        btn: '12px',
        pill: '32px',
      },
    },
  },
  plugins: [],
}
export default config
