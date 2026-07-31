/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#161A23",
        paper: "#F6F4EF",
        brand: {
          DEFAULT: "#2E3192",
          light: "#4548B8",
          dark: "#1F2166",
        },
        signal: {
          DEFAULT: "#F2A93B",
          dark: "#D9902A",
        },
        success: "#2FA876",
        danger: "#D64545",
        team: {
          core: "#2E3192",
          documentation: "#7A5CFA",
          website: "#2FA876",
          promotion: "#F2A93B",
          social: "#E85D75",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
