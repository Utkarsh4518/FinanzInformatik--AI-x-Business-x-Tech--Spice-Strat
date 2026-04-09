import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f6f8fb",
        ink: "#162233",
        panel: "#ffffff",
        line: "#d7dee7",
        accent: "#264d73",
        accentSoft: "#ebf2f8",
        accentMuted: "#6b88a8",
        panelSoft: "#f8fafc"
      },
      boxShadow: {
        panel: "0 12px 28px rgba(15, 23, 42, 0.05)",
        panelSoft: "0 4px 14px rgba(15, 23, 42, 0.04)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
