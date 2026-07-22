"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Github, AlertTriangle, GitBranch, TrendingDown, Sparkles, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/landing/ui/button";

function useParallax(strength = 1) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 150, damping: 20 });
  const sy = useSpring(y, { stiffness: 150, damping: 20 });
  const tx = useTransform(sx, (v) => v * strength);
  const ty = useTransform(sy, (v) => v * strength);
  return { x, y, tx, ty };
}

export function Hero() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const p1 = useParallax(18);
  const p2 = useParallax(-14);
  const p3 = useParallax(22);
  const p4 = useParallax(-20);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    [p1, p2, p3, p4].forEach((p) => {
      p.x.set(relX);
      p.y.set(relY);
    });
  }

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pb-16 pt-40 text-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="glass mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] text-muted"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-good opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-good" />
        </span>
        Now watching production AI traffic in real time
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="text-gradient max-w-4xl text-[44px] font-semibold leading-[1.05] tracking-tight sm:text-[64px] lg:text-[76px]"
      >
        Know your AI system
        <br />
        is failing before
        <br />
        your users do.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="mt-7 max-w-xl text-[17px] leading-relaxed text-muted"
      >
        AgentLens watches every real call your app makes to OpenAI, Anthropic, and Groq —
        and tells you the moment something breaks, why, and what to do about it.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
        className="mt-9 flex flex-wrap items-center justify-center gap-3"
      >
        <Button type="button" size="lg" onClick={() => router.push("/signup")}>
          Start Monitoring
          <ArrowRight size={16} />
        </Button>
        <Button size="lg" variant="secondary">
          <Github size={16} />
          View on GitHub
        </Button>
      </motion.div>

      {/* Composed floating dashboard mockup */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-24 w-full max-w-3xl"
        style={{ perspective: 1200 }}
      >
        {/* Satellite cards */}
        <motion.div
          style={{ x: p1.tx, y: p1.ty }}
          className="glass-strong absolute -left-10 top-6 z-20 hidden w-52 rounded-2xl p-4 text-left shadow-2xl sm:block lg:-left-24"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-accent">
            <Sparkles size={11} /> Investigation prompt
          </div>
          <div className="text-[11px] leading-relaxed text-muted">
            Root cause, impact, and a ready-to-paste prompt for Claude — generated automatically.
          </div>
        </motion.div>

        <motion.div
          style={{ x: p2.tx, y: p2.ty }}
          className="glass-strong absolute -right-8 top-0 z-20 hidden w-48 rounded-2xl p-4 text-left shadow-2xl sm:block lg:-right-20"
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-ink">
            <GitBranch size={11} className="text-muted" /> GitHub issue
          </div>
          <div className="text-[11px] text-muted">#412 opened automatically</div>
        </motion.div>

        <motion.div
          style={{ x: p3.tx, y: p3.ty }}
          className="glass-strong absolute -left-6 bottom-10 z-20 hidden w-44 rounded-2xl p-4 text-left shadow-2xl sm:block lg:-left-16"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-bad">
            <TrendingDown size={11} /> Cost spike
          </div>
          <div className="text-[15px] font-semibold text-ink">+64%</div>
        </motion.div>

        <motion.div
          style={{ x: p4.tx, y: p4.ty }}
          className="glass-strong absolute -right-10 bottom-2 z-20 hidden w-52 rounded-2xl p-4 text-left shadow-2xl sm:block lg:-right-24"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        >
          <div className="mb-1 text-[11px] font-medium text-accent-cyan">Recommendation</div>
          <div className="text-[12px] leading-relaxed text-ink">
            Route to <strong>Claude</strong> — 99.1% success, comparable cost.
          </div>
        </motion.div>

        {/* Main mockup panel */}
        <div className="glass-strong relative z-10 overflow-hidden rounded-[28px] p-6 text-left shadow-[0_40px_120px_-40px_rgba(110,86,207,0.4)] sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] text-muted">
              <Activity size={13} className="text-bad" />
              Incident #412 — OpenAI / gpt-4o
            </div>
            <span className="rounded-full bg-bad/10 px-2.5 py-1 text-[11px] font-medium text-bad">Open</span>
          </div>

          <div className="mb-6 flex items-center gap-2 text-[15px] font-medium text-ink">
            <AlertTriangle size={15} className="text-warn" />
            Success rate dropped from 98.4% to 61.2%
          </div>

          {/* Mini timeline */}
          <div className="mb-6 flex items-center gap-0">
            {["Deploy", "Latency spike", "Retries", "Alert fired", "Investigating"].map((label, i, arr) => (
              <div key={label} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.15, type: "spring" }}
                    className={`h-2 w-2 rounded-full ${i === arr.length - 1 ? "bg-accent" : "bg-white/25"}`}
                  />
                  <span className="hidden text-[9px] text-subtle sm:block">{label}</span>
                </div>
                {i < arr.length - 1 && <div className="h-px flex-1 bg-white/10" />}
              </div>
            ))}
          </div>

          {/* Provider health mini rings */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: "OpenAI", score: 61, color: "#F87171" },
              { name: "Claude", score: 99, color: "#34D399" },
              { name: "Groq", score: 100, color: "#34D399" },
            ].map((p) => (
              <div key={p.name} className="rounded-xl bg-white/[0.03] p-3">
                <div className="mb-1 text-[11px] text-muted">{p.name}</div>
                <div className="text-[18px] font-semibold tabular-nums" style={{ color: p.color }}>
                  {p.score}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
