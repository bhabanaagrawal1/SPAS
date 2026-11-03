// The seven topics shown in "Topic-wise Performance".
export const TOPICS = ["Arrays", "Strings", "Graphs", "Trees", "DP", "Sorting", "Math"];

// Platform tags that count towards each topic (lowercase).
const ALIASES = {
  Arrays: ["array", "arrays", "two pointers", "sliding window", "prefix sum", "hash table", "matrix", "matrices"],
  Strings: ["string", "strings", "string matching", "hashing", "trie", "string suffix structures"],
  Graphs: [
    "graph", "graphs", "dfs and similar", "shortest paths", "shortest path", "graph matchings",
    "breadth-first search", "depth-first search", "topological sort", "union find",
    "disjoint set", "flows", "minimum spanning tree",
  ],
  Trees: ["tree", "trees", "binary tree", "binary search tree", "segment tree", "binary indexed tree"],
  DP: ["dp", "dynamic programming", "memoization"],
  Sorting: [
    "sorting", "sortings", "binary search", "divide and conquer", "merge sort",
    "counting sort", "bucket sort", "radix sort", "quickselect",
  ],
  Math: ["math", "number theory", "combinatorics", "geometry", "probabilities", "probability and statistics"],
};

const LOOKUP = new Map(
  Object.entries(ALIASES).flatMap(([topic, tags]) => tags.map((tag) => [tag, topic]))
);

/** Maps a raw platform tag to one of the seven topics, or null. */
export const toTopic = (tag) => LOOKUP.get(String(tag ?? "").trim().toLowerCase()) ?? null;

// Used to find practice problems for a topic on each platform.
export const TOPIC_TAGS = {
  Arrays: { codeforces: ["two pointers", "data structures"], leetcode: "array" },
  Strings: { codeforces: ["strings"], leetcode: "string" },
  Graphs: { codeforces: ["graphs", "dfs and similar", "shortest paths"], leetcode: "graph" },
  Trees: { codeforces: ["trees"], leetcode: "tree" },
  DP: { codeforces: ["dp"], leetcode: "dynamic-programming" },
  Sorting: { codeforces: ["sortings", "binary search"], leetcode: "sorting" },
  Math: { codeforces: ["math", "number theory"], leetcode: "math" },
};