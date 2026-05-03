/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#e14eca", // Pink: Critical
        info: "#1d8cf8",    // Blue: Reliability
        success: "#00f2c3", // Green: Stable
        warning: "#ff8d72", // Orange: Warning
        "bg-dark": "#1e1e2f",
      },
    },
  },
  plugins: [],
}