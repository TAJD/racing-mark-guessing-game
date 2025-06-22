/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: "475px",
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
      },
      maxWidth: {
        "8xl": "88rem",
      },
      minHeight: {
        12: "3rem",
      },
      fontSize: {
        "2xs": "0.625rem",
      },
    },
  },
  plugins: [
    // Add line-clamp support for text truncation
    function ({ addUtilities }) {
      addUtilities({
        ".line-clamp-1": {
          overflow: "hidden",
          display: "-webkit-box",
          "-webkit-box-orient": "vertical",
          "-webkit-line-clamp": "1",
        },
        ".line-clamp-2": {
          overflow: "hidden",
          display: "-webkit-box",
          "-webkit-box-orient": "vertical",
          "-webkit-line-clamp": "2",
        },
        ".line-clamp-3": {
          overflow: "hidden",
          display: "-webkit-box",
          "-webkit-box-orient": "vertical",
          "-webkit-line-clamp": "3",
        },
        ".touch-manipulation": {
          "touch-action": "manipulation",
        },
      });
    },
  ],
};
