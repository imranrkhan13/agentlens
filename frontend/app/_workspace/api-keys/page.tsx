import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export default function ApiKeysPage() {
  return <div className="space-y-7"><PageHeader eyebrow="Private project key" title="Project connection keys" description="This key lets your app share activity. It is different from your dashboard login." />
    <section className="surface-glow rounded-2xl p-6 sm:p-8"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-violet/20 bg-violet/[.09] text-violet"><KeyRound className="size-5" /></span><div><h2 className="text-base font-medium text-[#efeff5]">Keys are shown only once</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#8c8b9a]">You see a private project key when you create a project. Keep it in your app&apos;s private settings as <code className="rounded bg-black/20 px-1.5 py-0.5 text-xs text-[#c8c4d8]">AGENTLENS_API_KEY</code>.</p><div className="mt-5 flex gap-3 rounded-xl border border-success/15 bg-success/[.045] p-3.5 text-xs leading-5 text-[#a5d2c1]"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />Your login can view activity, but cannot reveal a key again.</div><Button asChild className="mt-6" size="sm" variant="primary"><Link href="/app/projects/new">Create a project key</Link></Button></div></div></section>
  </div>;
}
