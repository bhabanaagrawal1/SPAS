// Shapes returned by GET /api/coding-profiles/me/dashboard and /me/recommendations.

export type PlatformKey = "codeforces" | "leetcode" | "codechef" | "geeksforgeeks" | "hackerrank";

export interface PlatformCard {
  key: PlatformKey;
  name: string;
  shortName: string;
  mark: string;
  color: string;
  connected: boolean;
  handle: string | null;
  status: string;
  syncStatus: "pending" | "ok" | "error" | "invalid_handle" | null;
  syncing: boolean;
  needsAttention: boolean;
  profileUrl: string | null;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
}

export interface ActivityDay {
  date: string; // "YYYY-MM-DD"
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface Dashboard {
  hasData: boolean;
  syncing: boolean;
  platforms: PlatformCard[];
  summary: {
    problemsSolved: number;
    contestsAttended: number;
    currentStreak: number;
    longestStreak: number;
    lastSyncedAt: string | null;
  };
  activity: {
    days: ActivityDay[];
    months: { label: string; index: number }[];
    totalSubmissions: number;
    activeDays: number;
  };
  ratingProgression: {
    platform: PlatformKey | null;
    available: PlatformKey[];
    data: { month: string; rating: number }[];
    current: number | null;
    changeThisYear: number;
    domain: [number, number] | null;
  };
  solvedByPlatform: { key: PlatformKey; platform: string; solved: number; color: string }[];
  topics: { topic: string; solved: number; strength: number; needsWork: number }[];
  progress: {
    connected: number;
    total: number;
    connectedPlatforms: { key: PlatformKey; name: string; color: string }[];
  };
}

export interface Recommendation {
  platform: string; // "CF" | "LC"
  platformKey: PlatformKey;
  title: string;
  topic: string;
  level: string;
  reason: string;
  color: string;
  url: string;
}

export interface RecommendationsResponse {
  personalized: boolean;
  recommendations: Recommendation[];
}