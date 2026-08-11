"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function CancelSubscriptionButton() {
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { showToast } = useToast();
  async function cancel() {
    setPending(true);
    const response = await fetch("/api/billing/cancel", { method: "POST" });
    const result = await response.json() as { detail?: string };
    setPending(false);
    if (!response.ok) { showToast(result.detail || "Cancellation failed", "error"); return; }
    showToast("Cancellation scheduled");
    window.location.reload();
  }
  return <details className="billing-cancel"><summary>Need to cancel?</summary><p>Your plan stays active until the current billing period ends.</p>{confirming ? <div><Button variant="secondary" size="sm" onClick={() => setConfirming(false)}>Keep plan</Button><Button variant="danger" size="sm" disabled={pending} onClick={() => void cancel()}>{pending ? "Scheduling…" : "Confirm cancellation"}</Button></div> : <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>Cancel subscription</Button>}</details>;
}
