"use client";

import { InfoTooltip } from "@/components/ui/tooltip";

export function FounderHelp({ message = "This page shows only real activity from your app." }: { message?: string }) {
  return <span className="inline-flex"><InfoTooltip label={message} /></span>;
}
