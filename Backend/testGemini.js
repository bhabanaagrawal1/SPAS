// Requires Node 18+ (uses built-in fetch).
// Usage: GEMINI_API_KEY=your_key node test-gemini.mjs [model1 model2 ...]
import config from "./src/config/config.js";
const key = config.geminiApiKey;
if (!key) {
  console.error("Set GEMINI_API_KEY first.");
  process.exit(1);
}

const models = process.argv.slice(2).length ? process.argv.slice(2) : ["gemini-3.8-flash"];

const schema = {
  type: "object",
  properties: {
    ideas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          tag: { type: "string", enum: ["Advanced", "Challenging", "Ambitious"] },
          description: { type: "string" },
          tech: { type: "array", items: { type: "string" } },
        },
        required: ["title", "tag", "description", "tech"],
      },
    },
  },
  required: ["ideas"],
};

const prompt =
  "Suggest 3 hard portfolio project ideas for a student who knows JavaScript, React and Node. Keep descriptions under 160 characters.";

const variants = [
  { name: "A: plain text, default thinking", gen: {}, plain: true },
  { name: "B: plain text, thinkingLevel low", gen: { thinkingConfig: { thinkingLevel: "low" } }, plain: true },
  { name: "C: JSON schema, thinkingLevel low", gen: { thinkingConfig: { thinkingLevel: "low" } } },
  { name: "D: JSON schema, thinkingBudget 0", gen: { thinkingConfig: { thinkingBudget: 0 } } },
];

for (const model of models) {
  console.log(`\n=== ${model} ===`);
  for (const v of variants) {
    const generationConfig = { maxOutputTokens: 1024, ...v.gen };
    if (!v.plain) {
      generationConfig.responseMimeType = "application/json";
      generationConfig.responseJsonSchema = schema;
    }

    const started = Date.now();
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig,
          }),
          signal: AbortSignal.timeout(60_000),
        }
      );
      const data = await res.json();
      const ms = Date.now() - started;
      if (!res.ok) {
        console.log(`${v.name}: HTTP ${res.status} after ${ms}ms -> ${data?.error?.message}`);
        continue;
      }
      const u = data.usageMetadata ?? {};
      console.log(
        `${v.name}: ${ms}ms | output ${u.candidatesTokenCount ?? "?"} tokens | thinking ${u.thoughtsTokenCount ?? 0} tokens`
      );
    } catch (err) {
      console.log(`${v.name}: FAILED after ${Date.now() - started}ms -> ${err.name}: ${err.message}`);
    }
  }
}