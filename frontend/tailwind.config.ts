import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#08090C",
        elevated: "#0E0F14",
        canvas: "#08090c",
        ink: "#f4f3ff",
        muted: "#9493a6",
        subtle: "#5C5F6E",
        line: "rgba(255,255,255,0.08)",
        accent: {
          DEFAULT: "#6E56CF",
          cyan: "#22D3EE",
          soft: "rgba(110,86,207,0.12)",
        },
        good: "#34D399",
        warn: "#FBBF24",
        bad: "#F87171",
        panel: "#111217",
        violet: "#8d72ff",
        cyan: "#29d2d0",
        success: "#2dd4a3",
        warning: "#f2c94c",
        danger: "#f26a6a",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(141,114,255,.12), 0 15px 45px rgba(72,51,160,.16)",
        soft: "0 16px 48px rgba(0,0,0,.28)",
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
