"use client";

import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WorkspaceLoadError({ message, retry }: { message: string; retry: () => void }) {
  return <section className="project-load-error" role="alert">
    <TriangleAlert aria-hidden="true" />
    <div>
      <b>This page could not reach your AgentLens service.</b>
      <p>{message}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={retry}><RefreshCw />Try again</Button>
        <Button size="sm" variant="ghost" asChild><Link href="/app/diagnostics">Open connection check</Link></Button>
      </div>
    </div>
  </section>;
}
