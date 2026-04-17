/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 6px 20px rgba(15, 23, 42, 0.08)",
        card: "0 1px 3px rgba(15, 23, 42, 0.12)"
      }
    }
  },
  plugins: []
};
