import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],

  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      colors: {
        background: "#070b14",
        foreground: "#f8fafc",

        card: "#111827",
        border: "#1f2937",

        primary: "#3b82f6",
        secondary: "#172033",

        muted: "#94a3b8",
      },

      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
    },
  },

  plugins: [],
};

export default config;