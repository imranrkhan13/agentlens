/* eslint-disable @next/next/no-page-custom-font */

import type { Metadata } from "next";
import "./globals.css";
import { BackgroundScene } from "@/components/landing/BackgroundScene";
import { Providers } from "./providers";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: {
    default: siteConfig.title,
    template: "%s | AgentLens",
  },
  description: siteConfig.description,
  keywords: [
    "AI observability",
    "LLM monitoring",
    "AI monitoring platform",
    "LLM observability",
    "OpenAI monitoring",
    "Anthropic monitoring",
    "Gemini monitoring",
    "AI provider comparison",
    "production AI reliability",
    "LLM latency monitoring",
    "LLM cost monitoring",
  ],
  authors: [{ name: "AgentLens", url: siteConfig.url }],
  creator: "AgentLens",
  publisher: "AgentLens",
  category: "Developer Tools",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.shortDescription,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "AgentLens AI observability and LLM monitoring" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.shortDescription,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/icon", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  other: {
    "theme-color": "#f7f4eb",
    "msapplication-TileColor": "#f7f4eb",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="home" href={absoluteUrl("/")} />
      </head>
      <body className="font-sans antialiased">
        <BackgroundScene />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
