// Static facts about each platform. Names, marks and colours match your UI.

export const PLATFORMS = {
  codeforces: {
    name: "Codeforces",
    shortName: "Codeforces",
    mark: "CF",
    color: "#5368e8",
    profileUrl: (h) => `https://codeforces.com/profile/${encodeURIComponent(h)}`,
  },
  leetcode: {
    name: "LeetCode",
    shortName: "LeetCode",
    mark: "LC",
    color: "#f59e0b",
    profileUrl: (h) => `https://leetcode.com/u/${encodeURIComponent(h)}/`,
  },
  codechef: {
    name: "CodeChef",
    shortName: "CodeChef",
    mark: "CC",
    color: "#a36a45",
    profileUrl: (h) => `https://www.codechef.com/users/${encodeURIComponent(h)}`,
  },
  geeksforgeeks: {
    name: "GeeksforGeeks",
    shortName: "GFG",
    mark: "GFG",
    color: "#159b70",
    profileUrl: (h) => `https://www.geeksforgeeks.org/profile/${encodeURIComponent(h)}`,
  },
  hackerrank: {
    name: "HackerRank",
    shortName: "HackerRank",
    mark: "HR",
    color: "#149b62",
    profileUrl: (h) => `https://www.hackerrank.com/profile/${encodeURIComponent(h)}`,
  },
};

export const PLATFORM_KEYS = Object.keys(PLATFORMS);

// Handles go into URLs, so only allow safe characters.
export const HANDLE_PATTERN = /^[A-Za-z0-9_.-]{1,40}$/;

// Solving this many problems in a topic counts as 100% "strength".
export const TOPIC_TARGET = 40;

// Prisma stores the platform as an enum (CODEFORCES), the code uses lowercase keys (codeforces).
export const toEnum = (key) => key.toUpperCase();
export const toKey = (platformEnum) => platformEnum.toLowerCase();