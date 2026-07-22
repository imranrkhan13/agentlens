export type Project = {
  project_id: string;
  name: string;
  api_key: string;
  technology: ProjectTechnology;
};

export type ProjectTechnology = "nextjs" | "node" | "express" | "fastapi" | "django" | "laravel" | "python" | "other";

export type ProjectSummary = {
  project_id: string;
  name: string;
  webhook_configured: boolean;
  technology: ProjectTechnology;
  created_at: string;
};

export type ProjectsResponse = {
  projects: ProjectSummary[];
};

export type Stats = {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  success_rate: number | null;
  total_cost_usd: number;
  avg_latency_ms: number | null;
  total_retries: number;
  detected_provider_count: number;
  latest_event_at: string | null;
};

export type TelemetryEvent = {
  id: number;
  provider: string;
  model: string;
  latency_ms: number;
  success: boolean;
  error: string | null;
  est_cost_usd: number | null;
  status_code: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  error_category: string | null;
  retry_count: number;
  instrumentation_type: "native" | "generic";
  request_url: string | null;
  endpoint: string | null;
  http_method: string | null;
  created_at: string;
};

export type EventsResponse = {
  events: TelemetryEvent[];
  total: number;
  limit: number;
  offset: number;
};

export type ProviderModelAggregate = {
  model: string;
  request_volume: number;
  success_rate: number;
  avg_latency_ms: number;
  estimated_cost_usd: number;
  retries: number;
  top_error_categories: string[];
  first_event_at: string;
  latest_event_at: string;
  instrumentation_type: "native" | "generic" | "mixed";
};

export type ProviderAggregate = {
  provider: string;
  request_volume: number;
  success_rate: number;
  avg_latency_ms: number;
  estimated_cost_usd: number;
  retries: number;
  top_error_categories: string[];
  first_event_at: string;
  latest_event_at: string;
  instrumentation_type: "native" | "generic" | "mixed";
  models: ProviderModelAggregate[];
};

export type ProvidersResponse = {
  providers: ProviderAggregate[];
};

export type CreateProjectInput = {
  name: string;
  webhook_url?: string;
  technology: ProjectTechnology;
};

export type SessionConfig = {
  projectId: string;
  projectName: string;
  webhookConfigured: boolean;
  technology: ProjectTechnology;
  createdAt: string;
};
