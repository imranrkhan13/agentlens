import { AgentLensApiError, inspectApiRequest } from "@/lib/api/diagnostics";
import type { CreateProjectInput, EventsResponse, Project, ProvidersResponse, Stats } from "@/lib/api/types";

export { AgentLensApiError } from "@/lib/api/diagnostics";

function resolveBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.BETTER_AUTH_URL || "http://localhost:3000";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { headers, body, method = "GET" } = options;
  const result = await inspectApiRequest({
    baseUrl: resolveBaseUrl(),
    path,
    method,
    body,
    headers,
  });
  if (!result.ok) throw new AgentLensApiError(result.diagnostic);
  if (result.responseJson === null) {
    throw new AgentLensApiError({
      ...result.diagnostic,
      category: "network",
      title: "Invalid API response",
      summary: "The backend succeeded but did not return a JSON response the frontend can read.",
      suggestions: ["Inspect the response body below.", "Verify this deployment is running a compatible AgentLens API version."],
    });
  }
  return result.responseJson as T;
}

export const agentLensApi = {
  createProject(input: CreateProjectInput) {
    return request<Project>("/api/app/projects", { method: "POST", body: JSON.stringify(input) });
  },
  getStats(projectId: string) {
    return request<Stats>(`/api/app/projects/${projectId}/stats`, { method: "GET" });
  },
  getEvents(projectId: string, limit = 30, offset = 0) {
    return request<EventsResponse>(`/api/app/projects/${projectId}/events?limit=${limit}&offset=${offset}`, { method: "GET" });
  },
  getProviders(projectId: string) {
    return request<ProvidersResponse>(`/api/app/projects/${projectId}/providers`, { method: "GET" });
  },
};
