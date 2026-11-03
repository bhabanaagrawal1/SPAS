import { prisma } from "../../config/coding.prisma.js";
import { SETTINGS } from "../../config/coding.settings.js";
import { PLATFORMS } from "../../config/coding.platforms.js";
import { TOPIC_TAGS } from "../../config/coding.topics.js";
import { buildTopics } from "./dashboard.builder.js";
import { cached, cacheDel, studentVersion } from "../../utils/codingProfiles/cache.js";
import { k } from "../../config/coding.redis.js";
import { dayKey, hashString, memo } from "../../utils/codingProfiles/helpers.js";
import * as codeforces from "./providers/codeforces.provider.js";
import * as leetcode from "./providers/leetcode.provider.js";

// Shown when nothing is linked, or to fill the list if the platforms return too few.
const STARTERS = [
  { platformKey: "leetcode", title: "Two Sum", topic: "Arrays", level: "Easy", url: "https://leetcode.com/problems/two-sum/" },
  { platformKey: "codeforces", title: "A. Watermelon", topic: "Math", level: "Easy", url: "https://codeforces.com/problemset/problem/4/A" },
  { platformKey: "leetcode", title: "Maximum Subarray", topic: "Arrays", level: "Medium", url: "https://leetcode.com/problems/maximum-subarray/" },
  { platformKey: "codeforces", title: "A. Way Too Long Words", topic: "Strings", level: "Easy", url: "https://codeforces.com/problemset/problem/71/A" },
  { platformKey: "leetcode", title: "Climbing Stairs", topic: "DP", level: "Easy", url: "https://leetcode.com/problems/climbing-stairs/" },
];

const toCard = ({ platformKey, title, topic, level, reason, url }) => ({
  platform: PLATFORMS[platformKey].mark, // "CF" / "LC", as the UI shows
  platformKey,
  title,
  topic,
  level,
  reason,
  color: PLATFORMS[platformKey].color,
  url,
});

const reasonFor = (topic) =>
  topic.strength === 0
    ? `You have not solved many ${topic.topic} problems yet, so this is a great place to start.`
    : `Your ${topic.topic} score is ${topic.strength}%, so this is a good one to practise.`;

const cfLevel = (rating) => (rating <= 1100 ? "Easy" : rating <= 1600 ? "Medium" : "Hard");
const lcDifficulty = (solved) => (solved < 100 ? "Easy" : solved < 300 ? "Medium" : "Hard");

const ratingBand = (rating) => {
  const base = Math.max(800, Math.round((rating ?? 800) / 100) * 100);
  return [Math.max(800, base - 100), base + 200];
};

// Problem catalogs are the same for everyone: Redis (6h) shared by all servers, plus a short in-process copy.
const cfCatalog = () =>
  memo("cf:catalog", 600_000, () => cached(k("catalog", "cf"), SETTINGS.catalogCacheSeconds, codeforces.fetchProblemset));

const lcCatalog = (tagSlug, difficulty) =>
  cached(k("catalog", "lc", tagSlug, difficulty), SETTINGS.catalogCacheSeconds, () =>
    leetcode.fetchProblemsByTag({ tagSlug, difficulty })
  );

const pickCodeforces = async ({ rating, solved }, topic, seed) => {
  const wanted = TOPIC_TAGS[topic.topic].codeforces;
  const [low, high] = ratingBand(rating);

  const pool = (await cfCatalog())
    .filter((p) => p.rating >= low && p.rating <= high && !solved.has(p.key) && p.tags.some((t) => wanted.includes(t)))
    .sort((a, b) => b.solvedCount - a.solvedCount)
    .slice(0, 30);
  if (!pool.length) return null;

  const problem = pool[hashString(`${seed}:cf:${topic.topic}`) % pool.length];
  return toCard({
    platformKey: "codeforces",
    title: `${problem.index}. ${problem.name}`,
    topic: topic.topic,
    level: cfLevel(problem.rating),
    reason: reasonFor(topic),
    url: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
  });
};

const pickLeetCode = async ({ problemsSolved }, topic, seed) => {
  const pool = await lcCatalog(TOPIC_TAGS[topic.topic].leetcode, lcDifficulty(problemsSolved));
  if (!pool.length) return null;

  const problem = pool[hashString(`${seed}:lc:${topic.topic}`) % pool.length];
  return toCard({
    platformKey: "leetcode",
    title: problem.title,
    topic: topic.topic,
    level: problem.difficulty,
    reason: reasonFor(topic),
    url: `https://leetcode.com/problems/${problem.slug}/`,
  });
};

const build = async (studentId, limit) => {
  const accounts = await prisma.codingAccount.findMany({
    where: { studentId, platform: { in: ["CODEFORCES", "LEETCODE"] } },
    select: { id: true, platform: true, currentRating: true, problemsSolved: true },
  });
  const allIds = (await prisma.codingAccount.findMany({ where: { studentId }, select: { id: true } })).map((a) => a.id);

  const tagRows = allIds.length
    ? await prisma.codingTagStat.groupBy({ by: ["tag"], where: { accountId: { in: allIds } }, _sum: { solved: true } })
    : [];
  const weakest = buildTopics(new Map(tagRows.map((r) => [r.tag, r._sum.solved ?? 0])))
    .sort((a, b) => a.strength - b.strength)
    .slice(0, 3);

  const cf = accounts.find((a) => a.platform === "CODEFORCES");
  const lc = accounts.find((a) => a.platform === "LEETCODE");

  const solvedKeys = cf
    ? ((await prisma.codingSolvedSet.findUnique({ where: { accountId: cf.id }, select: { keys: true } }))?.keys ?? [])
    : [];
  const cfContext = cf && { rating: cf.currentRating, solved: new Set(solvedKeys) };

  // The pick changes daily but stays stable within a day.
  const seed = `${studentId}:${dayKey(Date.now())}`;
  const picks = [];

  for (const topic of weakest) {
    if (cfContext) {
      const pick = await pickCodeforces(cfContext, topic, seed).catch(() => null);
      if (pick) picks.push(pick);
    }
    if (lc) {
      const pick = await pickLeetCode(lc, topic, seed).catch(() => null);
      if (pick) picks.push(pick);
    }
  }

  const personalized = picks.length > 0;

  for (const starter of STARTERS) {
    if (picks.length >= limit) break;
    if (!picks.some((p) => p.title === starter.title)) {
      picks.push(toCard({ ...starter, reason: "A well-known problem to build a solid foundation." }));
    }
  }

  return { personalized, recommendations: picks.slice(0, limit) };
};

export const getRecommendations = async (studentId, { limit = 5, refresh = false } = {}) => {
  const version = await studentVersion(studentId);
  const key = k("recs", "v1", studentId, version, limit);
  if (refresh) await cacheDel(key);
  return cached(key, SETTINGS.recommendationsCacheSeconds, () => build(studentId, limit));
};