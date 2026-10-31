/**
 * NEXUS Remote — API client.
 *
 * Handles:
 *   - Auto-detecting the backend URL from window.location
 *   - Storing the auth token in localStorage
 *   - Wrapping fetch() to auto-attach Authorization headers
 *   - Parsing errors into friendly messages
 */

// ---------------------------------------------------------------------------
// Backend URL detection
// ---------------------------------------------------------------------------
const DEFAULT_BACKEND_PORT = 8000;

function resolveBackendUrl(): string {
  const override = localStorage.getItem("nexus.backend_url");
  if (override) return override.replace(/\/+$/, "");

  const { protocol, hostname } = window.location;
  const scheme = protocol === "https:" ? "https" : "http";
  return `${scheme}://${hostname}:${DEFAULT_BACKEND_PORT}`;
}

export const BACKEND_URL = "http://192.168.8.100:8000";

// ---------------------------------------------------------------------------
// Token storage
// ---------------------------------------------------------------------------
const TOKEN_KEY = "nexus.token";

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
  exists: (): boolean => !!localStorage.getItem(TOKEN_KEY),
};

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Core request wrapper
// ---------------------------------------------------------------------------
interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, auth = true, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(extraHeaders as Record<string, string> | undefined),
  };

  if (auth) {
    const token = tokenStore.get();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload: unknown = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    payload = await res.json().catch(() => null);
  } else {
    const text = await res.text().catch(() => "");
    payload = text || null;
  }

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    if (payload && typeof payload === "object" && "detail" in payload) {
      const d = (payload as { detail: unknown }).detail;
      if (typeof d === "string") {
        detail = d;
      } else if (Array.isArray(d)) {
        detail = "Validation error. Check input format.";
      }
    }
    throw new ApiError(detail, res.status);
  }
  return payload as T;
}

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------
export interface PairPayload {
  pin: string;
  device_name: string;
  device_fingerprint: string;
}

export interface PairResult {
  token: string;
  device_id: number;
  device_name: string;
  message: string;
}

export interface VerifyResult {
  valid: boolean;
  device_id?: number;
  device_name?: string;
}

export const authApi = {
  pair: (payload: PairPayload): Promise<PairResult> =>
    request<PairResult>("/auth/pair", {
      method: "POST",
      body: payload,
      auth: false,
    }),

  verify: (): Promise<VerifyResult> =>
    request<VerifyResult>("/auth/verify", { method: "GET" }),

  disconnect: (): Promise<{ message: string }> =>
    request<{ message: string }>("/auth/disconnect", { method: "POST" }),
};
