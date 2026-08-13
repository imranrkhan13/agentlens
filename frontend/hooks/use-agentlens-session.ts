"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { ProjectsResponse, SessionConfig } from "@/lib/api/types";

export function useAgentLensSession() {
  const [session, setSession] = useState<SessionConfig | null>(null);
  const [projects, setProjects] = useState<ProjectsResponse["projects"]>([]);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const pathname = usePathname();

  const selectedProjectId = useMemo(() => {
    const segment = pathname.match(/^\/app\/projects\/([A-Za-z0-9-]+)/)?.[1];
    if (segment) return segment;
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("project");
  }, [pathname]);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/app/context", { cache: "no-store" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { detail?: unknown } | null;
        throw new Error(typeof payload?.detail === "string" ? payload.detail : "Could not load your apps.");
      }
      const data = (await response.json()) as ProjectsResponse;
      setProjects(data.projects);
      setLoadError(null);
    } catch (error) {
      setProjects([]);
      setLoadError(error instanceof Error ? error.message : "Could not load your apps.");
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const updateProjects = () => void refresh();
    window.addEventListener("agentlens:projects-updated", updateProjects);
    return () => window.removeEventListener("agentlens:projects-updated", updateProjects);
  }, [refresh]);

  useEffect(() => {
    const active = projects.find((project) => project.project_id === selectedProjectId) || projects[0] || null;
    setSession(active ? {
      projectId: active.project_id,
      projectName: active.name,
      webhookConfigured: active.webhook_configured,
      technology: active.technology,
      createdAt: active.created_at,
    } : null);
  }, [projects, selectedProjectId]);

  return { session, projects, isReady, loadError, refresh };
}
