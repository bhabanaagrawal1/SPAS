import axios from "axios";
import { throttle } from "../../../utils/codingProfiles/throttle.js";

export class ProviderError extends Error {
  /** code: "NOT_FOUND" | "UNAVAILABLE" */
  constructor(code, message) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
  }
}

export const http = axios.create({
  timeout: 15_000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; Student360/1.0)",
    "Accept-Language": "en",
  },
});

const HOSTS = [
  ["codeforces.com", "codeforces"],
  ["leetcode.com", "leetcode"],
  ["codechef.com", "codechef"],
  ["geeksforgeeks.org", "geeksforgeeks"],
  ["hackerrank.com", "hackerrank"],
];

// Every outgoing request waits for its platform's shared rate-limit gate.
http.interceptors.request.use(async (config) => {
  const url = String(config.url ?? "");
  const platform = HOSTS.find(([host]) => url.includes(host))?.[1];
  if (platform) await throttle(platform);
  return config;
});