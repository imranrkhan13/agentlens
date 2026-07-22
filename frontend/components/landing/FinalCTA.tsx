"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Reveal } from "./Reveal";
import { Button } from "@/components/landing/ui/button";

export function FinalCTA() {
  const router = useRouter();

  return (
    <section className="relative mx-auto max-w-5xl px-6 pb-8 pt-20">
      <Reveal>
        <div className="glass-strong relative overflow-hidden rounded-[32px] px-8 py-20 text-center sm:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(110,86,207,0.25), transparent 60%)" }}
          />
          <h2 className="text-gradient relative mx-auto max-w-2xl text-[32px] font-semibold leading-tight tracking-tight sm:text-[46px]">
            Don&apos;t wait for customers to tell you your AI is broken.
          </h2>
          <p className="relative mx-auto mt-5 max-w-md text-[15px] text-muted">
            One line of code. Real alerts within minutes. No dashboard required to get the value.
          </p>
          <div className="relative mt-9 flex justify-center">
            <Button type="button" size="lg" onClick={() => router.push("/signup")}>
              Start Monitoring
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function GiantWordmarkFooter() {
  return (
    <footer className="relative mx-auto max-w-6xl overflow-hidden px-6 pb-10 pt-24">
      <div className="mb-12 flex flex-col items-start justify-between gap-8 border-b border-line pb-12 sm:flex-row">
        <div className="max-w-xs text-[13px] leading-relaxed text-subtle">
          AgentLens is reliability infrastructure for production AI applications. Built to be honest about what it knows and what it doesn&apos;t.
        </div>
        <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-[13px] text-muted sm:grid-cols-3">
          <a href="#" className="hover:text-ink">Product</a>
          <a href="#" className="hover:text-ink">Docs</a>
          <a href="#" className="hover:text-ink">Pricing</a>
          <a href="#" className="hover:text-ink">GitHub</a>
          <a href="#" className="hover:text-ink">Blog</a>
          <a href="#" className="hover:text-ink">Contact</a>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="select-none text-center"
      >
        <div className="text-gradient text-[64px] font-bold leading-none tracking-tight sm:text-[120px] lg:text-[160px]">
          AgentLens
        </div>
      </motion.div>

      <div className="mt-8 text-center text-[11px] text-subtle">
        © {new Date().getFullYear()} AgentLens. Every number on this page&apos;s product screens is either real or explicitly labeled illustrative.
      </div>
    </footer>
  );
}
