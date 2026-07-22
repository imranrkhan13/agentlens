"use client";

import { motion } from "framer-motion";
import {
  Terminal, GitBranch, Slack, TrendingUp, FileText, Sparkles, Activity, Wand2,
} from "lucide-react";
import { Reveal } from "./Reveal";
import { SectionLabel } from "@/components/landing/ui/card";

const FEATURES = [
  { icon: Terminal, title: "Connect in one step", body: "A short guided setup keeps your normal AI calls unchanged." },
  { icon: Activity, title: "Incident timeline", body: "First seen, last seen, resolution — the full story of every anomaly." },
  { icon: Sparkles, title: "Root cause analysis", body: "Not just 'it broke' — why, and what's different from normal." },
  { icon: GitBranch, title: "GitHub issues", body: "Auto-filed with full context, the moment something real happens." },
  { icon: Slack, title: "Slack alerts", body: "You find out in your team channel, not by scrolling logs." },
  { icon: TrendingUp, title: "AI service guidance", body: "See which service is working best for your app today." },
  { icon: FileText, title: "Weekly reports", body: "Reliability, cost, and regressions — something worth forwarding." },
  { icon: Wand2, title: "Investigation prompts", body: "A dense, real-data prompt ready to paste into Claude or ChatGPT." },
];

export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-32">
      <Reveal className="mb-16 text-center">
        <SectionLabel>Everything you need</SectionLabel>
        <h2 className="mx-auto max-w-xl text-[32px] font-semibold tracking-tight text-ink sm:text-[42px]">
          Built for the moment things go wrong.
        </h2>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: (i % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6 }}
            className="glass group relative overflow-hidden rounded-2xl p-6"
          >
            <motion.div
              className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-accent/0 blur-2xl transition-colors duration-500 group-hover:bg-accent/20"
            />
            <div className="relative mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <f.icon size={18} />
            </div>
            <div className="relative mb-1.5 text-[14.5px] font-semibold text-ink">{f.title}</div>
            <div className="relative text-[13px] leading-relaxed text-muted">{f.body}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
