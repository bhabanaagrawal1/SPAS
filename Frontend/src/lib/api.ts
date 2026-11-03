import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { config } from "@/config";

// --------------------------------------------------
// 1. ACCESS TOKEN MANAGEMENT
// --------------------------------------------------

const TOKEN_KEY = "accessToken";

export const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAccessToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearAccessToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// --------------------------------------------------
// 2. MAIN AXIOS INSTANCE
// --------------------------------------------------

export const api = axios.create({
  baseURL: config.api.baseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// --------------------------------------------------
// 3. SEPARATE REFRESH CLIENT
// --------------------------------------------------

// This client does not use the main Axios interceptors.
// This prevents infinite refresh loops.

const refreshClient = axios.create({
  baseURL: config.api.baseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// --------------------------------------------------
// 4. TYPES
// --------------------------------------------------

type RefreshResponse = {
  accessToken: string;
  user?: unknown;
};

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type ApiRequestOptions = {
  method?: AxiosRequestConfig["method"];
  body?: unknown;
  headers?: AxiosRequestConfig["headers"];
};

// --------------------------------------------------
// 5. SHARED REFRESH PROMISE
// --------------------------------------------------

// Multiple requests receiving 401 simultaneously
// will wait for the same refresh request.

let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<RefreshResponse>("/auth/refresh")
      .then((response) => {
        const newToken = response.data?.accessToken;

        if (!newToken) {
          throw new Error(
            "Refresh succeeded but no access token was returned."
          );
        }

        setAccessToken(newToken);

        return newToken;
      })
      .catch((error) => {
        clearAccessToken();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

// --------------------------------------------------
// 6. REQUEST INTERCEPTOR
// --------------------------------------------------

// Automatically attach the latest access token
// to every authenticated API request.

api.interceptors.request.use((request) => {
  const token = getAccessToken();

  request.headers = request.headers ?? new AxiosHeaders();

  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  } else {
    request.headers.delete("Authorization");
  }

  return request;
});

// --------------------------------------------------
// 7. AUTH ENDPOINT EXCLUSIONS
// --------------------------------------------------

const excludedEndpoints = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/verify-email",
  "/auth/forgot-password",
  "/auth/reset-password",
];

const shouldSkipRefresh = (url: string): boolean => {
  return excludedEndpoints.some((endpoint) => {
    return url.includes(endpoint);
  });
};

// --------------------------------------------------
// 8. RESPONSE INTERCEPTOR
// --------------------------------------------------

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

    // Only handle 401 responses.
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url ?? "";

    // Do not refresh authentication endpoints.
    if (shouldSkipRefresh(requestUrl)) {
      return Promise.reject(error);
    }

    // Prevent infinite retry loops.
    originalRequest._retry = true;

    try {
      // All simultaneous 401 requests share this promise.
      const newToken = await refreshAccessToken();

      // Attach the newly generated access token.
      originalRequest.headers =
        originalRequest.headers ?? new AxiosHeaders();

      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      // Retry the original request exactly once.
      return api(originalRequest);
    } catch (refreshError) {
      // The refresh token is invalid, expired,
      // revoked, or otherwise cannot renew the session.
      clearAccessToken();

      return Promise.reject(refreshError);
    }
  }
);

// --------------------------------------------------
// 9. API REQUEST HELPER
// --------------------------------------------------

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  try {
    const response = await api.request<T>({
      url: endpoint,
      method: options.method ?? "GET",
      data: options.body,
      headers: options.headers,
    });

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as
        | {
            message?: string;
            errors?: {
              msg?: string;
              message?: string;
            }[];
          }
        | undefined;

      const message =
        data?.message ??
        data?.errors?.[0]?.msg ??
        data?.errors?.[0]?.message ??
        error.message ??
        "Something went wrong.";

      throw new Error(message, {
        cause: error,
      });
    }

    throw error;
  }
}