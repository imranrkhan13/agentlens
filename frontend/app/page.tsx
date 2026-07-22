import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { Features } from "@/components/landing/Features";
import { FinalCTA, GiantWordmarkFooter } from "@/components/landing/FinalCTA";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { InvestigationWorkflow } from "@/components/landing/InvestigationWorkflow";
import { Navbar } from "@/components/landing/Navbar";
import { OpenSource } from "@/components/landing/OpenSource";
import { Pricing } from "@/components/landing/Pricing";
import { Problem } from "@/components/landing/Problem";
import { ProviderComparison } from "@/components/landing/ProviderComparison";
import { Testimonials } from "@/components/landing/Testimonials";

/** The product landing page and authenticated application share this one Next.js server. */
export default function HomePage() {
  return (
    <main className="relative min-h-screen">
      <Navbar />
      <Hero />
      <Problem />
      <HowItWorks />
      <Features />
      <DashboardPreview />
      <ProviderComparison />
      <InvestigationWorkflow />
      <Testimonials />
      <Pricing />
      <OpenSource />
      <FinalCTA />
      <GiantWordmarkFooter />
    </main>
  );
}
