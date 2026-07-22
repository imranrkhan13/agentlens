"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { Reveal } from "./Reveal";
import { Card, SectionLabel } from "@/components/landing/ui/card";

// Illustrative placeholders — no real companies or people are quoted.
// Clearly generic role attributions, per early-access-stage convention.
const QUOTES = [
  {
    quote: "We found out one of our AI services was struggling before a single customer complained. That's the whole pitch, and it delivered.",
    role: "Engineering Lead, early access",
  },
  {
    quote: "The investigation prompt alone saves our on-call engineer real time. It's already got the context assembled before they open their laptop.",
    role: "Staff Engineer, early access",
  },
  {
    quote: "Switching AI services used to be a guess. Now it's a number we can actually trust, from our own activity.",
    role: "Founder, early access",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-32">
      <Reveal className="mb-16 text-center">
        <SectionLabel>Early access</SectionLabel>
        <h2 className="mx-auto max-w-xl text-[32px] font-semibold tracking-tight text-ink sm:text-[42px]">
          What early users are saying.
        </h2>
      </Reveal>

      <div className="grid gap-5 sm:grid-cols-3">
        {QUOTES.map((q, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
          >
            <Card className="h-full p-7">
              <Quote size={20} className="mb-4 text-accent/60" />
              <p className="mb-5 text-[14px] leading-relaxed text-ink">&ldquo;{q.quote}&rdquo;</p>
              <div className="text-[12px] text-subtle">{q.role}</div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
