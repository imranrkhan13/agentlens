"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) { setError("This reset link is missing its token. Request a new one."); return; }
    setPending(true);
    const result = await authClient.resetPassword({ newPassword: password, token });
    setPending(false);
    if (result.error) { setError(result.error.message || "This reset link is no longer valid. Request a new one."); return; }
    setComplete(true);
  }

  if (complete) return <div className="rounded-2xl border border-success/20 bg-success/[.07] p-5 text-sm leading-6 text-[#a9dfcc]"><CheckCircle2 className="size-5 text-success" /><p className="mt-3 font-medium">Password updated.</p><Link href="/login" className="mt-4 inline-block text-xs font-medium text-[#d6cfff] hover:text-white">Log in to AgentLens</Link></div>;
  return <form onSubmit={onSubmit} className="space-y-5"><label className="block"><span className="text-xs font-medium text-[#dddce6]">New password</span><Input required minLength={10} maxLength={128} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 10 characters" className="mt-2" /></label>{error && <p role="alert" className="rounded-xl border border-danger/20 bg-danger/[.08] px-3 py-2.5 text-xs text-[#ffb0b0]">{error}</p>}<Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>{pending ? "Saving password…" : "Set new password"}</Button></form>;
}

export default function ResetPasswordPage() {
  return <AuthShell eyebrow="Account recovery" title="Choose a new password" description="Use a unique password with at least 10 characters."><Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-white/[.04]" />}><ResetPasswordForm /></Suspense></AuthShell>;
}
