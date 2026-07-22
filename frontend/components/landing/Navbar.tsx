"use client";

import { motion } from "framer-motion";
import { Radar, Github } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/landing/ui/button";

const LINKS = ["Product", "How it works", "Pricing", "Docs"];

export function Navbar() {
  const router = useRouter();

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-4 z-50 w-full px-4"
    >
      <div className="glass mx-auto flex max-w-5xl items-center justify-between rounded-full px-5 py-2.5">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-ink">
          <Radar size={16} className="text-accent" />
          AgentLens
        </div>
        <nav className="hidden items-center gap-6 sm:flex">
          {LINKS.map((l) => (
            <a key={l} href="#" className="text-[13px] text-muted transition-colors hover:text-ink">
              {l}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="default" className="hidden sm:inline-flex">
            <Github size={14} />
            GitHub
          </Button>
          <Button type="button" size="default" onClick={() => router.push("/signup")}>Start Monitoring</Button>
        </div>
      </div>
    </motion.header>
  );
}
