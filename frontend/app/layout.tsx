/* eslint-disable @next/next/no-page-custom-font */

import type { Metadata } from "next";
import "./globals.css";
import { BackgroundScene } from "@/components/landing/BackgroundScene";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "AgentLens — Know your AI system is failing before your users do",
  description: "AgentLens watches your real production AI traffic and makes it understandable.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">
        <BackgroundScene />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
