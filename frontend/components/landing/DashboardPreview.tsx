"use client";

import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { Reveal } from "./Reveal";
import { Card, SectionLabel } from "@/components/landing/ui/card";

const LATENCY_POINTS = [30, 34, 28, 40, 55, 90, 120, 80, 45, 38, 32, 30];

function Sparkline() {
  const max = Math.max(...LATENCY_POINTS);
  const points = LATENCY_POINTS.map((v, i) => {
    const x = (i / (LATENCY_POINTS.length - 1)) * 100;
    const y = 40 - (v / max) * 36;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 100 40" className="h-16 w-full" preserveAspectRatio="none">
      <motion.polyline
        points={points}
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6E56CF" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function DashboardPreview() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-32">
      <Reveal className="mb-16 text-center">
        <SectionLabel>Preview</SectionLabel>
        <h2 className="mx-auto max-w-xl text-[32px] font-semibold tracking-tight text-ink sm:text-[42px]">
          A dashboard that only shows what&apos;s real.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[14px] text-muted">
          Illustrative data shown below — your dashboard renders your own real traffic, nothing simulated.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <Card strong className="overflow-hidden p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[12px] font-medium text-muted">Latency — last 60 min</span>
                <span className="text-[11px] text-subtle">gpt-4o</span>
              </div>
              <Sparkline />
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: "Requests", value: "12,402" },
                  { label: "Success rate", value: "94.2%" },
                  { label: "P95 latency", value: "410ms" },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl bg-white/[0.03] p-3">
                    <div className="text-[11px] text-subtle">{m.label}</div>
                    <div className="text-[16px] font-semibold tabular-nums text-ink">{m.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="rounded-xl bg-bad/[0.06] p-4">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-bad">
                  <Bell size={11} /> New alert
                </div>
                <div className="text-[12.5px] leading-relaxed text-ink">OpenAI latency up 180% in the last 6 minutes.</div>
              </div>
              {[
                { name: "OpenAI", status: "Degraded", color: "text-warn" },
                { name: "Claude", status: "Healthy", color: "text-good" },
                { name: "Groq", status: "Healthy", color: "text-good" },
              ].map((p) => (
                <div key={p.name} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
                  <span className="text-[13px] text-ink">{p.name}</span>
                  <span className={`text-[12px] font-medium ${p.color}`}>{p.status}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </Reveal>
    </section>
  );
}
