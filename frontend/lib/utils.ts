import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number | undefined) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value ?? 0);
}

export function formatCost(value: number | undefined) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 4 }).format(value ?? 0);
}

export function describeResponseTime(value: number | null | undefined) {
  if (value === null || value === undefined) return { label: "—", detail: "No response time yet", kind: "unknown" as const };
  if (value <= 500) return { label: "Very Fast", detail: `${Math.round(value)} ms`, kind: "fast" as const };
  if (value <= 1_500) return { label: "Normal", detail: `${Math.round(value)} ms`, kind: "normal" as const };
  return { label: "Slow", detail: `${Math.round(value)} ms`, kind: "slow" as const };
}
