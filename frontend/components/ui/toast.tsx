"use client";

import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";

type Toast = { id: number; message: string; tone: "success" | "error" };
type ToastContextValue = { showToast: (message: string, tone?: Toast["tone"]) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.floor(Math.random() * 1_000);
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 2800);
  }, []);
  return <ToastContext.Provider value={{ showToast }}>{children}<div className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-2" aria-live="polite" aria-atomic="true">{toasts.map((toast) => <div key={toast.id} role="status" className={`pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl border px-3 py-2.5 text-sm shadow-2xl ${toast.tone === "success" ? "border-success/25 bg-[#10231d] text-[#d8f2e7]" : "border-danger/25 bg-[#2d1619] text-[#ffd9d9]"}`}>{toast.tone === "success" ? <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" /> : <CircleAlert className="size-4 shrink-0 text-danger" aria-hidden="true" />}<span className="flex-1">{toast.message}</span><button type="button" aria-label="Dismiss notification" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} className="rounded-md p-0.5 text-current/70 transition hover:bg-white/10 hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/70"><X className="size-3.5" aria-hidden="true" /></button></div>)}</div></ToastContext.Provider>;
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used within ToastProvider");
  return value;
}
