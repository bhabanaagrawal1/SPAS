import type { Dashboard, PlatformKey, RecommendationsResponse } from "@/types/codingProfiles";

// ---------------------------------------------------------------------------
// ADJUST THIS BLOCK to match how the rest of your app talks to the backend.
// If you already have an axios instance (with token refresh), call it inside `request` instead.
// ---------------------------------------------------------------------------
const BASE_URL: string =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL ?? "http://localhost:3000";

const getAccessToken = (): string | null => localStorage.getItem("accessToken");
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();

  const response = await fetch(`${BASE_URL}/api/coding-profiles${path}`, {
    ...init,
    credentials: "include", // sends cookies if your auth uses them
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  const body = (await response.json().catch(() => null)) as { message?: string; data?: T } | null;

  if (!response.ok) {
    throw new ApiError(body?.message ?? `Request failed (${response.status})`, response.status);
  }
  return body?.data as T;
}

export const getDashboard = (ratingPlatform?: PlatformKey) =>
  request<Dashboard>(`/me/dashboard${ratingPlatform ? `?ratingPlatform=${ratingPlatform}` : ""}`);

export const getRecommendations = (limit = 5) =>
  request<RecommendationsResponse>(`/me/recommendations?limit=${limit}`);

// Returns as soon as the handle is saved; the first sync runs in the background.
export const connectPlatform = (platform: PlatformKey, handle: string) =>
  request<unknown>(`/me/accounts/${platform}`, { method: "PUT", body: JSON.stringify({ handle }) });

export const disconnectPlatform = (platform: PlatformKey) =>
  request<unknown>(`/me/accounts/${platform}`, { method: "DELETE" });

export const syncAll = () => request<unknown>("/me/sync", { method: "POST" });