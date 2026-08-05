import type { DataPoint, DisclosureRequirement, Framework, Organization } from "../types.ts";

type TokenProvider = () => Promise<string | null>;

interface ApiOptions extends RequestInit {
  getToken?: TokenProvider;
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { getToken, headers, body, ...requestOptions } = options;
  const token = getToken ? await getToken() : null;
  const response = await fetch(path, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export function listOrganizations() {
  return apiRequest<Organization[]>("/api/orgs");
}

export function listFrameworks() {
  return apiRequest<Framework[]>("/api/frameworks");
}

export function listRequirements(frameworkId?: number) {
  const query = frameworkId ? `?frameworkId=${frameworkId}` : "";
  return apiRequest<DisclosureRequirement[]>(`/api/requirements${query}`);
}

export function listDataPoints(orgId?: number) {
  const query = orgId ? `?orgId=${orgId}` : "";
  return apiRequest<DataPoint[]>(`/api/data-points${query}`);
}

export function createDataPoint(input: Omit<DataPoint, "id" | "status"> & { status?: string }, getToken: TokenProvider) {
  return apiRequest<DataPoint>("/api/data-points", {
    method: "POST",
    getToken,
    body: JSON.stringify(input),
  });
}

export interface NarrativeDraftResponse {
  narrative: string;
  citations?: Array<{
    dataPointId: number;
    textSegment: string;
  }>;
}

export function draftNarrative(data: unknown, framework: string, getToken: TokenProvider) {
  return apiRequest<NarrativeDraftResponse>("/api/ai/draft", {
    method: "POST",
    getToken,
    body: JSON.stringify({ data, framework }),
  });
}

export interface GapFinding {
  requirementCode: string;
  status: string;
  gapDescription: string;
  suggestedAction: string;
}

export function runGapAnalysis(currentData: unknown, requirements: unknown, getToken: TokenProvider) {
  return apiRequest<GapFinding[]>("/api/ai/gap-analysis", {
    method: "POST",
    getToken,
    body: JSON.stringify({ currentData, requirements }),
  });
}
