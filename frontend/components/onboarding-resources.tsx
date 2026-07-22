"use client";

import { BookOpen, ExternalLink, LifeBuoy, MessageSquareWarning, Play, Video } from "lucide-react";

const videoUrl = process.env.NEXT_PUBLIC_ONBOARDING_VIDEO?.trim();
const links = {
  docs: process.env.NEXT_PUBLIC_DOCS_URL?.trim(),
  support: process.env.NEXT_PUBLIC_SUPPORT_URL?.trim(),
  issues: process.env.NEXT_PUBLIC_ISSUES_URL?.trim(),
};

function isVideoFile(url: string) {
  return /\.(mp4|webm|ogg)(?:[?#].*)?$/i.test(url);
}

export function GettingStartedVideo() {
  return <section id="getting-started" className="surface-glow overflow-hidden rounded-2xl p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl border border-violet/20 bg-violet/[.08] text-violet"><Video className="size-4" aria-hidden="true" /></span><div><h2 className="text-base font-medium text-[#efeff5]">Getting Started</h2><p className="mt-1 text-sm text-[#888796]">Watch how to connect AgentLens in under 2 minutes.</p></div></div><div className="mt-5 aspect-video overflow-hidden rounded-xl border border-white/[.09] bg-[#101117]">{videoUrl ? isVideoFile(videoUrl) ? <video controls className="size-full object-cover" aria-label="Getting Started video"><source src={videoUrl} /></video> : <iframe src={videoUrl} title="Getting Started video" className="size-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen /> : <div className="relative flex size-full flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(137,111,255,.16),transparent_48%)] text-center"><button type="button" disabled aria-label="Getting Started video coming soon" className="grid size-14 cursor-not-allowed place-items-center rounded-full border border-violet/30 bg-violet/[.12] text-violet"><Play className="size-6" aria-hidden="true" /></button><p className="mt-4 text-sm font-medium text-[#e7e5f1]">Coming Soon</p><p className="mt-1 max-w-xs text-xs leading-5 text-[#858392]">A short walkthrough will appear here when your team adds a video link.</p></div>}</div></section>;
}

function ResourceLink({ href, label, icon: Icon }: { href?: string; label: string; icon: typeof BookOpen }) {
  const className = "inline-flex items-center gap-2 rounded-xl border border-white/[.09] bg-white/[.025] px-3 py-2 text-xs font-medium text-[#d5d3df] transition hover:border-violet/35 hover:bg-violet/[.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/70";
  if (!href) return <span aria-disabled="true" className={`${className} cursor-not-allowed opacity-45`}><Icon className="size-3.5" aria-hidden="true" />{label}<span className="text-[10px] text-[#858392]">Soon</span></span>;
  return <a href={href} target="_blank" rel="noreferrer" className={className}><Icon className="size-3.5" aria-hidden="true" />{label}<ExternalLink className="size-3" aria-hidden="true" /></a>;
}

export function HelpCenter() {
  return <section className="surface rounded-2xl p-5 sm:p-6"><div><h2 className="text-base font-medium text-[#efeff5]">Need help?</h2><p className="mt-1 text-sm text-[#888796]">Choose the quickest way to get unstuck.</p></div><div className="mt-5 flex flex-wrap gap-2"><ResourceLink href={links.docs} label="View Documentation" icon={BookOpen} /><a href="#getting-started" className="inline-flex items-center gap-2 rounded-xl border border-white/[.09] bg-white/[.025] px-3 py-2 text-xs font-medium text-[#d5d3df] transition hover:border-violet/35 hover:bg-violet/[.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/70"><Play className="size-3.5" aria-hidden="true" />Watch Setup Video</a><ResourceLink href={links.support} label="Contact Support" icon={LifeBuoy} /><ResourceLink href={links.issues} label="Report an Issue" icon={MessageSquareWarning} /></div></section>;
}
