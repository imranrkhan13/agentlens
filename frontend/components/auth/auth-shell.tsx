import { ArrowLeft, Radar } from "lucide-react";
import { marketingUrl } from "@/lib/marketing-url";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="grid-fade pointer-events-none absolute inset-x-0 top-0 h-[40rem]" />
      <div className="absolute -left-36 top-12 size-[30rem] rounded-full bg-violet/10 blur-[110px]" />
      <div className="absolute -right-36 bottom-12 size-[28rem] rounded-full bg-cyan/10 blur-[120px]" />
      <section className="surface-glow relative w-full max-w-[460px] rounded-[28px] p-6 shadow-[0_32px_100px_-40px_rgba(112,76,224,.55)] sm:p-8">
        <a href={marketingUrl} className="inline-flex items-center gap-2 text-sm font-semibold text-[#f3f2f8] transition hover:text-[#c8bdff]" aria-label="Back to AgentLens">
          <span className="grid size-8 place-items-center rounded-xl border border-violet/25 bg-violet/[.11] text-violet"><Radar className="size-4" /></span>
          AgentLens
        </a>
        <div className="mt-8">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#f4f3fb]">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-[#9695a4]">{description}</p>
        </div>
        <div className="mt-7">{children}</div>
      </section>
      <a href={marketingUrl} className="relative mt-6 inline-flex items-center gap-1.5 text-xs text-[#858493] transition hover:text-white"><ArrowLeft className="size-3.5" /> Back to website</a>
    </main>
  );
}
