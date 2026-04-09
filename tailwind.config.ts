import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f4f7fb",
        ink: "#0f172a",
        panel: "#ffffff",
        line: "#d7dee8",
        accent: "#0f766e",
        accentSoft: "#d9f3ef"
      },
      boxShadow: {
        panel: "0 12px 32px rgba(15, 23, 42, 0.08)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
