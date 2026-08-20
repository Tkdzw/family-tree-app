import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#181f19",
        panel: "#212b21",
        panelLine: "#3a4638",
        bone: "#f1e9d8",
        boneDim: "#c9c2ae",
        gold: "#c9a24a",
        goldDim: "#8f7638",
        rust: "#b0562f",
        line: "#4d5b46",
        spouse: "#7c98b3", // dusty blue — reserved for married-in people, distinct from gold (blood lineage) and rust (data-quality flags)
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
