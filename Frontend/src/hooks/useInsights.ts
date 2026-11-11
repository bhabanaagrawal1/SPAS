
import { useCallback, useEffect, useState } from "react";

// ======================================================
// 1. API CONFIGURATION
// ======================================================

const BASE =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

const getToken = (): string | null =>
  localStorage.getItem("accessToken");

// ======================================================
// 2. API RESPONSE TYPES
// ======================================================

export interface Recommendation {
  id: string;
  title: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  why: string;
  score: number;
}

export interface LatestInsight {
  id?: string;
  semester?: number;
  academicYear?: string;

  predictedCgpa?: number;
  errorMargin?: number;

  risk?: {
    level?: string;
    score?: number;
    probabilities?: Record<string, number>;
  };

  cluster?: {
    id?: number;
    name?: string;
  };

  anomaly?: {
    score?: number;
    isAnomaly?: boolean;
    reasons?: string[];
  };

  recommendations?: Recommendation[];
  peerGap?: Record<string, number>;

  inputs?: Record<string, unknown>;
  missingFeatures?: string[];
  moduleErrors?: Record<string, unknown>;

  modelVersion?: string;
  createdAt?: string;
}

export interface InsightsResponse {
  student?: {
    id: string;
    studentId: string;
    name: string;
    section?: string;
  };

  hasAcademicRecord?: boolean;
  latest?: LatestInsight | null;

  chart?: Array<{
    semester: string;
    actual: number | null;
    predicted: number | null;
  }>;

  metrics?: Array<{
    label: string;
    value: string;
  }>;

  clusterMap?: {
    names?: Record<string, string>;
    groups?: Array<{
      name: string;
      students: number;
      meanCgpa: number;
    }>;
    points?: unknown[];
  };
}

// ======================================================
// 3. API HELPER
// ======================================================

async function api<T>(
  path: string,
  method: "GET" | "POST" = "GET"
): Promise<T> {
  const token = getToken();

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    },
  });

  const result: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      result &&
      typeof result === "object" &&
      "message" in result &&
      typeof result.message === "string"
        ? result.message
        : "Something went wrong";

    throw new Error(errorMessage);
  }

  return result as T;
}

// ======================================================
// 4. CUSTOM HOOK
// ======================================================

export function useInsights() {
  const [data, setData] =
    useState<InsightsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET: Fetch existing insights
  const fetchInsights = useCallback(async () => {
    return api<InsightsResponse>("/api/ml/insights/me");
  }, []);

  // Initial fetch
  useEffect(() => {
    let ignore = false;

    async function fetchInitialInsights() {
      try {
        const result = await fetchInsights();

        if (!ignore) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load insights"
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void fetchInitialInsights();

    return () => {
      ignore = true;
    };
  }, [fetchInsights]);

  // Manually reload insights
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchInsights();
      setData(result);
      return result;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load insights";

      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchInsights]);

  // POST: Run ML analysis
  const runAnalysis = useCallback(async () => {
    setRunning(true);
    setError(null);

    try {
      const result = await api<InsightsResponse>(
        "/api/ml/insights/me/analyze",
        "POST"
      );

      setData(result);
      return result;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "ML analysis failed";

      setError(message);
      throw err;
    } finally {
      setRunning(false);
    }
  }, []);

  return {
    data,
    loading,
    running,
    error,
    load,
    runAnalysis,
  };
}