"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, KeyRound, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const result = await authClient.signIn.email({ email, password, callbackURL: "/app" });
    setPending(false);
    if (result.error) {
      setFailedAttempts((count) => count + 1);
      setError("We could not sign you in. Check your email and password, then try again.");
      return;
    }
    router.replace("/app");
    router.refresh();
  }

  return <>
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block"><span className="text-xs font-medium text-[#dddce6]">Email</span><Input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className="mt-2" /></label>
      <label className="block"><span className="text-xs font-medium text-[#dddce6]">Password</span><Input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" className="mt-2" /></label>
      {error && <p role="alert" className="rounded-xl border border-danger/20 bg-danger/[.08] px-3 py-2.5 text-xs leading-5 text-[#ffb0b0]">{error}</p>}
      {failedAttempts >= 3 && <div className="rounded-xl border border-warning/20 bg-warning/[.07] p-3.5 text-xs leading-5 text-[#ddd0a8]"><div className="flex items-center gap-2 font-medium text-[#f0dc9c]"><KeyRound className="size-3.5" /> Need another way in?</div><p className="mt-1.5">After three unsuccessful attempts, use the recovery email you chose when you signed up. We&apos;ll send a reset link without revealing whether an account exists.</p><Link href="/forgot-password" className="mt-2 inline-block font-medium text-[#d9d0ff] hover:text-white">Use recovery email →</Link></div>}
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <>Log in <ArrowRight className="size-4" /></>}</Button>
    </form>
    <p className="mt-6 text-center text-xs text-[#898895]">New to AgentLens? <Link href="/signup" className="font-medium text-[#c8bdff] hover:text-white">Create an account</Link></p>
  </>;
}
