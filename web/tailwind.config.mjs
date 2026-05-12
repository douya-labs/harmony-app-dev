import starlightPlugin from '@astrojs/starlight-tailwind';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcd9ff',
          300: '#8ec0ff',
          400: '#599cff',
          500: '#3478f6',
          600: '#1f5ee0',
          700: '#194bb4',
          800: '#173f8e',
          900: '#152f63',
        },
      },
    },
  },
  plugins: [starlightPlugin()],
};
