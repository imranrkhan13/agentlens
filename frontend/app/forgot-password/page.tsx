"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    await fetch("/api/recovery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recoveryEmail }) });
    setPending(false);
    setSent(true);
  }

  return <AuthShell eyebrow="Account recovery" title="Reset your password" description="Enter the recovery email you chose when creating your AgentLens account.">
    {sent ? <div className="rounded-2xl border border-success/20 bg-success/[.07] p-5 text-sm leading-6 text-[#a9dfcc]"><CheckCircle2 className="size-5 text-success" /><p className="mt-3 font-medium">Check your recovery inbox.</p><p className="mt-1 text-xs text-[#9bc5b8]">If the address matches an account, reset instructions are on their way. In local development, the reset link is printed in the web-service log until an email sender is configured.</p><Link href="/login" className="mt-4 inline-block text-xs font-medium text-[#d6cfff] hover:text-white">Back to login</Link></div> : <form onSubmit={onSubmit} className="space-y-5"><label className="block"><span className="text-xs font-medium text-[#dddce6]">Recovery email</span><Input required type="email" autoComplete="email" value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} placeholder="recovery@example.com" className="mt-2" /></label><Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : "Send reset instructions"}</Button><p className="text-center text-xs text-[#898895]"><Link href="/login" className="text-[#c8bdff] hover:text-white">Back to login</Link></p></form>}
  </AuthShell>;
}
