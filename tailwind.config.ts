import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.5rem',
        sm: '2rem',
        lg: '2.5rem',
        xl: '2.5rem',
        '2xl': '2.5rem',
      },
      screens: {
        sm:  '640px',
        md:  '768px',
        lg:  '1024px',
        xl:  '1280px',
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        brand: {
          primary: '#302161',
          bg: '#ffffff',
          'bg-alt': '#f8f7ff',
        },
      },
      fontFamily: {
        heading: ['PolySans Median', '-apple-system', 'system-ui', 'sans-serif'],
        body:    ['PolySans Neutral', '-apple-system', 'system-ui', 'sans-serif'],
        display: ['PolySans Median', '-apple-system', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        btn:  '12px',
        pill: '32px',
      },
    },
  },
  plugins: [],
}
export default config
