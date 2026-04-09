import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f3f6f8",
        ink: "#132032",
        panel: "#fcfdff",
        line: "#d8e0e8",
        accent: "#245f5b",
        accentSoft: "#e8f1ef"
      },
      boxShadow: {
        panel: "0 16px 40px rgba(15, 23, 42, 0.06)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
