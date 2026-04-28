import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        arabic: ["var(--font-arabic)", "serif"],
        persian: ["var(--font-persian)", "sans-serif"],
        hebrew: ["var(--font-hebrew)", "serif"],
        urdu: ["var(--font-urdu)", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
