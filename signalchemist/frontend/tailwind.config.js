import daisyui from "daisyui";

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Dark mode support
  theme: { extend: {} },
  plugins: [daisyui],
  daisyui: {
    themes: ["light", "dark"],
  },
};
