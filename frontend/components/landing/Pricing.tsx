"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { Reveal } from "./Reveal";
import { Card, SectionLabel } from "@/components/landing/ui/card";
import { Button } from "@/components/landing/ui/button";

const TIERS = [
  {
    name: "Developer",
    price: "Free",
    note: "For side projects and evaluation",
    features: ["1 project", "Community support", "7-day incident history", "Webhook alerts"],
    cta: "Start free",
  },
  {
    name: "Team",
    price: "Contact us",
    note: "For production applications",
    features: ["Unlimited projects", "GitHub issue automation", "90-day incident history", "Slack + webhook alerts", "Weekly reports"],
    cta: "Get in touch",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Contact us",
    note: "For teams with compliance needs",
    features: ["Self-hosted deployment", "SSO", "Custom retention", "Dedicated support"],
    cta: "Contact sales",
  },
];

export function Pricing() {
  const router = useRouter();

  return (
    <section className="mx-auto max-w-6xl px-6 py-32">
      <Reveal className="mb-16 text-center">
        <SectionLabel>Pricing</SectionLabel>
        <h2 className="mx-auto max-w-xl text-[32px] font-semibold tracking-tight text-ink sm:text-[42px]">
          Simple, while we&apos;re early.
        </h2>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-3">
        {TIERS.map((tier, i) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Card strong={tier.highlighted} className={`flex h-full flex-col p-7 ${tier.highlighted ? "ring-1 ring-accent/40" : ""}`}>
              <div className="mb-1 text-[14px] font-medium text-muted">{tier.name}</div>
              <div className="mb-1 text-[28px] font-semibold text-ink">{tier.price}</div>
              <div className="mb-6 text-[12.5px] text-subtle">{tier.note}</div>
              <div className="mb-8 flex flex-1 flex-col gap-2.5">
                {tier.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-[13px] text-ink">
                    <Check size={14} className="text-good" />
                    {f}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant={tier.highlighted ? "primary" : "secondary"}
                className="w-full justify-center"
                onClick={() => tier.name === "Developer" ? router.push("/signup") : undefined}
              >
                {tier.cta}
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
