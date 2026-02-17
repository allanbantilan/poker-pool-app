/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        felt: "#0D2B1A",
        feltAlt: "#103322",
        gold: "#C9A84C",
        chalk: "#F1EFE7",
        leather: "#4B2E20",
      },
    },
  },
  plugins: [],
};
