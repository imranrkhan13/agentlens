"use client";

import { useState } from "react";
import { CheckCircle2, CreditCard, LoaderCircle } from "lucide-react";
import type { PaidPlanCode } from "@/lib/billing";
import { useToast } from "@/components/ui/toast";

type RazorpayResponse = { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string };
type CheckoutPayload = { keyId: string; subscriptionId: string; plan: PaidPlanCode; customer: { name: string; email: string } };
type RazorpayCheckout = { open(): void };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout;
  }
}

let checkoutScript: Promise<void> | null = null;
function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (checkoutScript) return checkoutScript;
  checkoutScript = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Checkout could not load"));
    document.head.appendChild(script);
  });
  return checkoutScript;
}

export function CheckoutButton({ plan, label, disabled = false }: { plan: PaidPlanCode; label: string; disabled?: boolean }) {
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const { showToast } = useToast();

  async function beginCheckout() {
    if (pending || disabled) return;
    setPending(true);
    try {
      const [response] = await Promise.all([
        fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) }),
        loadCheckout(),
      ]);
      const payload = await response.json() as CheckoutPayload & { detail?: string };
      if (!response.ok) throw new Error(payload.detail || "Checkout could not start");
      if (!window.Razorpay) throw new Error("Secure checkout could not load");

      const checkout = new window.Razorpay({
        key: payload.keyId,
        subscription_id: payload.subscriptionId,
        name: "AgentLens",
        description: `${plan === "pro" ? "Pro" : "Scale"} monthly subscription`,
        prefill: payload.customer,
        theme: { color: "#171914" },
        retry: { enabled: true, max_count: 3 },
        modal: {
          confirm_close: true,
          ondismiss: () => setPending(false),
        },
        handler: async (payment: RazorpayResponse) => {
          try {
            const verification = await fetch("/api/billing/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payment),
            });
            const result = await verification.json() as { detail?: string };
            if (!verification.ok) throw new Error(result.detail || "Payment is still being confirmed");
            setComplete(true);
            setPending(false);
            showToast("Subscription activated");
            window.setTimeout(() => window.location.reload(), 900);
          } catch (verificationError) {
            setPending(false);
            showToast(verificationError instanceof Error ? verificationError.message : "Payment is still being confirmed", "error");
          }
        },
      });
      checkout.open();
    } catch (error) {
      setPending(false);
      showToast(error instanceof Error ? error.message : "Checkout could not start", "error");
    }
  }

  return <button type="button" className="billing-checkout-button" onClick={() => void beginCheckout()} disabled={disabled || pending || complete}>{complete ? <CheckCircle2 className="size-4" /> : pending ? <LoaderCircle className="size-4 animate-spin" /> : <CreditCard className="size-4" />}{complete ? "Activated" : pending ? "Opening secure checkout…" : label}</button>;
}
