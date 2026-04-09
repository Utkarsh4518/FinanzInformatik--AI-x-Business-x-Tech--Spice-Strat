import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f0f2f6",
        ink: "#182434",
        panel: "#ffffff",
        line: "#dde1e7",
        accent: "#2b4f73",
        accentSoft: "#edf3f8",
        accentMuted: "#677f98",
        panelSoft: "#f4f6f9"
      },
      boxShadow: {
        panel: "0 8px 24px rgba(17, 24, 39, 0.04)",
        panelSoft: "0 2px 10px rgba(17, 24, 39, 0.028)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
