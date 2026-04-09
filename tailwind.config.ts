import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-dark": "var(--color-primary-dark)",
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        "muted-surface": "var(--color-muted-surface)",
        border: "var(--color-border)",
        text: "var(--color-text)",
        "text-muted": "var(--color-text-muted)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)"
      },
      boxShadow: {
        panel: "0 12px 24px rgba(17, 24, 39, 0.06)",
        card: "0 8px 18px rgba(17, 24, 39, 0.04)"
      },
      borderRadius: {
        bank: "1rem"
      },
      fontFamily: {
        sans: [
          "var(--font-brand)",
          "Inter",
          "\"Source Sans 3\"",
          "system-ui",
          "Arial",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
};

export default config;
