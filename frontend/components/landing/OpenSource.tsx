"use client";

import { motion } from "framer-motion";
import { Star, BookOpen, FileCode2 } from "lucide-react";
import { Reveal } from "./Reveal";
import { Card, SectionLabel } from "@/components/landing/ui/card";
import { Button } from "@/components/landing/ui/button";

const TOOLS = [
  { name: "Python", detail: "OpenAI, Anthropic, Groq" },
  { name: "TypeScript", detail: "OpenAI, Anthropic" },
];

export function OpenSource() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-32">
      <Reveal>
        <Card strong className="overflow-hidden p-10 text-center sm:p-14">
          <SectionLabel>Open source</SectionLabel>
          <h2 className="mx-auto mb-6 max-w-lg text-[28px] font-semibold tracking-tight text-ink sm:text-[36px]">
            The tools are open. So is the reasoning behind every alert.
          </h2>
          <p className="mx-auto mb-8 max-w-md text-[14px] text-muted">
            No black-box scoring — every recommendation traces back to real activity you can inspect yourself.
          </p>
          <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
            {TOOLS.map((sdk) => (
              <div key={sdk.name} className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[12.5px]">
                <FileCode2 size={13} className="text-accent" />
                <span className="font-medium text-ink">{sdk.name}</span>
                <span className="text-subtle">— {sdk.detail}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="secondary">
              <Star size={14} />
              Star on GitHub
            </Button>
            <Button variant="ghost">
              <BookOpen size={14} />
              Read the docs
            </Button>
          </div>
        </Card>
      </Reveal>
    </section>
  );
}
