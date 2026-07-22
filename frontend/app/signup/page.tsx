"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const result = await authClient.signUp.email({ name, email, password, recoveryEmail });
    setPending(false);
    if (result.error) {
      setError(result.error.message || "We could not create your account. Please check the details and try again.");
      return;
    }
    router.replace("/app");
    router.refresh();
  }

  return <AuthShell eyebrow="Create your account" title="See what actually happened." description="Create a project, run one guided command, make a normal AI call, then see what happened.">
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block"><span className="text-xs font-medium text-[#dddce6]">Name</span><Input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="mt-2" /></label>
      <label className="block"><span className="text-xs font-medium text-[#dddce6]">Email</span><Input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className="mt-2" /></label>
      <label className="block"><span className="text-xs font-medium text-[#dddce6]">Recovery email</span><Input required type="email" autoComplete="email" value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} placeholder="A secure email you can access" className="mt-2" /><span className="mt-2 block text-[11px] leading-5 text-[#777685]">We use this only to send a password-reset link. It is not a way to sign in.</span></label>
      <label className="block"><span className="text-xs font-medium text-[#dddce6]">Password</span><Input required minLength={10} maxLength={128} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 10 characters" className="mt-2" /></label>
      {error && <p role="alert" className="rounded-xl border border-danger/20 bg-danger/[.08] px-3 py-2.5 text-xs leading-5 text-[#ffb0b0]">{error}</p>}
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>{pending ? "Creating account…" : <>Create account <ArrowRight className="size-4" aria-hidden="true" /></>}</Button>
    </form>
    <p className="mt-6 text-center text-xs text-[#898895]">Already have an account? <Link href="/login" className="font-medium text-[#c8bdff] hover:text-white">Log in</Link></p>
  </AuthShell>;
}
