import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "../lib/codingProfiles.api";
import type { Dashboard, PlatformKey, Recommendation } from "../types/codingProfiles";

const POLL_MS = 3_000; // how often to re-check while a sync is running
const MAX_POLLS = 60; // gives up after ~3 minutes; the next user action starts polling again

export function useCodingProfiles() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [ratingPlatform, setRatingPlatform] = useState<PlatformKey | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Bumping these numbers makes the matching effect below fetch again.
  const [dashboardReload, setDashboardReload] = useState(0);
  const [recommendationsReload, setRecommendationsReload] = useState(0);

  const polls = useRef(0);
  const wasSyncing = useRef(false);

  const reloadDashboard = useCallback(() => setDashboardReload((n) => n + 1), []);
  const reloadRecommendations = useCallback(() => setRecommendationsReload((n) => n + 1), []);

  // Dashboard: fetched whenever the rating platform changes or a reload is requested.
  useEffect(() => {
    let cancelled = false;

    api
      .getDashboard(ratingPlatform)
      .then((data) => {
        if (cancelled) return;
        setError(null);
        // A sync just finished: the recommendations may have changed too.
        if (wasSyncing.current && !data.syncing) setRecommendationsReload((n) => n + 1);
        wasSyncing.current = data.syncing;
        setDashboard(data);
      })
      .catch((err) => {
        console.error("[coding-profiles] could not load dashboard:", err);
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load your coding profiles.");
      });

    return () => {
      cancelled = true;
    };
  }, [ratingPlatform, dashboardReload]);

  // Recommendations: fetched on mount and whenever a reload is requested.
  useEffect(() => {
    let cancelled = false;

    api
      .getRecommendations()
      .then((data) => {
        if (!cancelled) setRecommendations(data.recommendations);
      })
      .catch((error) => console.error("[coding-profiles] could not load recommendations:", error));

    return () => {
      cancelled = true;
    };
  }, [recommendationsReload]);

  // While any platform is still being fetched, re-check every few seconds.
  const syncing = dashboard?.syncing ?? false;
  useEffect(() => {
    if (!syncing) {
      polls.current = 0;
      return undefined;
    }
    if (polls.current >= MAX_POLLS) return undefined;

    const timer = setTimeout(() => {
      polls.current += 1;
      setDashboardReload((n) => n + 1);
    }, POLL_MS);
    return () => clearTimeout(timer);
  }, [syncing, dashboard]);

  // Actions throw on failure so the page can show the message.
  const connect = useCallback(
    async (platform: PlatformKey, handle: string) => {
      await api.connectPlatform(platform, handle);
      polls.current = 0;
      reloadDashboard();
    },
    [reloadDashboard]
  );

  const disconnect = useCallback(
    async (platform: PlatformKey) => {
      await api.disconnectPlatform(platform);
      reloadDashboard();
      reloadRecommendations();
    },
    [reloadDashboard, reloadRecommendations]
  );

  const syncNow = useCallback(async () => {
    await api.syncAll();
    polls.current = 0;
    reloadDashboard();
  }, [reloadDashboard]);

  return { dashboard, recommendations, error, reload: reloadDashboard, setRatingPlatform, connect, disconnect, syncNow };
}