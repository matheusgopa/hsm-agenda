/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        hsmBlue: "#2E3C8B",
        hsmCyan: "#30B4C0",
        hsmGray: "#F6F8FB",
      },
    },
  },
  plugins: [],
};
