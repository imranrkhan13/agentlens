import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AgentLens — AI Observability & LLM Monitoring",
    short_name: "AgentLens",
    description: "Privacy-first monitoring and provider comparison for production AI applications.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4eb",
    theme_color: "#f7f4eb",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
