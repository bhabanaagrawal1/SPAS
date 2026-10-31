
import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { config } from "@/config";

const TOKEN_KEY = "accessToken";

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);

export const setAccessToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearAccessToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const api = axios.create({
  baseURL: config.api.baseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach access token to outgoing requests.
api.interceptors.request.use((request) => {
  const token = getAccessToken();

  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }

  return request;
});

// Separate Axios instance for refreshing.
// This prevents the refresh request from triggering the same interceptor.
const refreshClient = axios.create({
  baseURL: config.api.baseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

type RefreshResponse = {
  accessToken: string;
  user: unknown;
};

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<string> | null = null;

// Handle expired access tokens.
api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes("/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // Reuse an ongoing refresh request if one already exists.
      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post<RefreshResponse>("/refresh")
          .then((response) => {
            const newToken = response.data.accessToken;

            setAccessToken(newToken);

            return newToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;

      // Retry the original request with the new access token.
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      clearAccessToken();

      return Promise.reject(refreshError);
    }
  }
);

type ApiRequestOptions = {
  method?: AxiosRequestConfig["method"];
  body?: unknown;
  headers?: AxiosRequestConfig["headers"];
};

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
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
    if (error instanceof AxiosError) {
      const data = error.response?.data as
        | {
            message?: string;
            errors?: { msg?: string; message?: string }[];
          }
        | undefined;

      const message =
        data?.message ??
        data?.errors?.[0]?.msg ??
        data?.errors?.[0]?.message ??
        error.message ??
        "Something went wrong.";

      throw new Error(message, { cause: error });
    }

    throw error;
  }
}
