import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      fontSize: {
        xxs: "0.65rem",
      },
      colors: {
        light: {
          "primary-color": "#615ef0",
          "primary-hover-color": "#605ef0cc",
          "secondary-color": "#e9edff",
          "secondary-dark-color": "#cfd6f5",
          "tertiary-color": "#b6c3ff",
          "quaternary-color": "#dcd8fd",
          "quaternary-hover-color": "#c7c3f0",
          "quaternary-accent-color": "#b5b1e3",
          "quaternary-focus-color": "#9f9bd1",
          "font-light-color": "#4b5563",
          "selection-color": "#a9b9ff3e",
          "default-borlder-color": "rgb(209 213 219)",
        },
        dark: {
          "primary-color": "#030712",
          "primary-hover-color": "#a9b9ffcc",
          "quaternary-color": "#111827",
          "quaternary-hover-color": "#1f2937",
          "quaternary-dark-base": "#3b356e",
          "quaternary-dark-accent": "#2d2757",
          "secondary-color": "#6c7289",
          "tertiary-color": "#4b5563",
          "font-light-color": "#f7fafc",
          "selection-color": "#7d84a6",
          "default-borlder-color": "rgb(75, 85, 99)",
        },
      },
      transitionProperty: {
        all: "all",
      },
      transitionDuration: {
        "400": "0.4s",
      },
      transitionTimingFunction: {
        "in-out": "ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
