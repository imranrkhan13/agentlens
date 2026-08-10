import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#f7f4eb",
        elevated: "#fffdf7",
        canvas: "#f7f4eb",
        ink: "#2f2d22",
        muted: "#756f64",
        subtle: "#9a917f",
        line: "#e4dfd2",
        accent: {
          DEFAULT: "#8e6a22",
          cyan: "#4c9b8f",
          soft: "rgba(244,180,68,0.14)",
        },
        good: "#3b8f68",
        warn: "#c88727",
        bad: "#c45845",
        panel: "#fffdf7",
        violet: "#8065c4",
        cyan: "#4c9b8f",
        success: "#3b8f68",
        warning: "#c88727",
        danger: "#c45845",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(218,159,45,.12), 0 15px 45px rgba(120,90,30,.12)",
        soft: "0 16px 48px rgba(81,67,35,.08)",
      },
      keyframes: {
        "pulse-ring": { "0%,100%": { opacity: "0.45", transform: "scale(1)" }, "50%": { opacity: "1", transform: "scale(1.45)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-5px)" } },
        float1: { "0%, 100%": { transform: "translate(0,0) scale(1)" }, "50%": { transform: "translate(40px,60px) scale(1.08)" } },
        float2: { "0%, 100%": { transform: "translate(0,0) scale(1)" }, "50%": { transform: "translate(-60px,30px) scale(1.05)" } },
        float3: { "0%, 100%": { transform: "translate(0,0) scale(1)" }, "50%": { transform: "translate(30px,-50px) scale(1.1)" } },
        drift: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-14px)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        "pulse-ring": "pulse-ring 2s ease-in-out infinite",
        float: "float 5s ease-in-out infinite",
        float1: "float1 24s ease-in-out infinite",
        float2: "float2 30s ease-in-out infinite",
        float3: "float3 26s ease-in-out infinite",
        drift: "drift 5s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
