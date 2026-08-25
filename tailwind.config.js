/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6b3f2a",
          dark: "#54301f",
          light: "#8a5a3e",
          tint: "#f4ece4",
        },
        espresso: {
          950: "#231610",
          900: "#2b1c14",
          800: "#3a271b",
          700: "#4a3324",
        },
        surface: {
          DEFAULT: "#ffffff",
          warm: "#faf7f2",
          sunken: "#f4ede4",
        },
        ink: {
          DEFAULT: "#2b2118",
          muted: "#6b6155",
          faint: "#9a8f80",
        },
        line: {
          DEFAULT: "#e6ddd1",
          strong: "#d4c7b4",
        },
        state: {
          pending: "#92600d",
          "pending-bg": "#fbf1de",
          confirmed: "#256b45",
          "confirmed-bg": "#e7f4ec",
          seated: "#2c4d85",
          "seated-bg": "#e9eff9",
          done: "#57503f",
          "done-bg": "#eeeae3",
          noshow: "#9c2f24",
          "noshow-bg": "#fbe9e6",
          cancelled: "#6e6255",
          "cancelled-bg": "#f1ede6",
          waitlist: "#6a3f8f",
          "waitlist-bg": "#f1e8f7",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(43,33,24,0.04), 0 4px 16px -4px rgba(43,33,24,0.08)",
        popover: "0 8px 30px -6px rgba(43,33,24,0.22)",
      },
      borderRadius: {
        lg: "10px",
        xl: "14px",
      },
    },
  },
  plugins: [],
};
