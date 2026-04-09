import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f4f7fa",
        ink: "#182434",
        panel: "#ffffff",
        line: "#d6dde5",
        accent: "#2b4f73",
        accentSoft: "#edf3f8",
        accentMuted: "#677f98",
        panelSoft: "#f7f9fb"
      },
      boxShadow: {
        panel: "0 12px 28px rgba(17, 24, 39, 0.045)",
        panelSoft: "0 5px 18px rgba(17, 24, 39, 0.035)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
