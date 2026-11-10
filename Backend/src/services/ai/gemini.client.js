import axios from "axios";
import config from "../../config/config.js";

// Primary model, with a fallback if it is overloaded or times out.
// Override the primary with config.geminiModel (remove it from .env to use this default).
const DEFAULT_MODEL = "gemini-3.6-flash";
const FALLBACK_MODEL = "gemini-3.8-flash";

const REQUEST_TIMEOUT_MS = 20_000; // per attempt
const ATTEMPTS_PER_MODEL = 2;

// Cap output size: 3 short ideas never need more than this.
const MAX_OUTPUT_TOKENS = 1024;

// Set DEBUG_AI=true in your env to get the verbose logs back.
const DEBUG = config.debugAi;
const debug = (...args) => DEBUG && console.log(...args);

const http = axios.create({
  baseURL: "https://generativelanguage.googleapis.com/v1beta",
});

export class AiError extends Error {
  constructor(code, message, { status = 503, retryAfter } = {}) {
    super(message);
    this.name = "AiError";
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

const TIMEOUT_CODES = new Set(["ECONNABORTED", "ETIMEDOUT"]);

export const toAiError = (error) => {
  const status = error.response?.status;
  const detail = error.response?.data?.error?.message ?? error.message ?? "";

  if (TIMEOUT_CODES.has(error.code)) {
    return new AiError(
      "AI_TIMEOUT",
      "The idea generator took too long. Please try again.",
      { status: 504 }
    );
  }

  if (status === 429) {
    const retryAfter = Number(error.response?.headers?.["retry-after"]);

    return new AiError(
      "AI_RATE_LIMITED",
      "The idea generator is busy right now. Please try again in a minute.",
      {
        status: 429,
        retryAfter: Number.isFinite(retryAfter) ? retryAfter : 60,
      }
    );
  }

  if (
    status === 401 ||
    status === 403 ||
    status === 404 ||
    (status === 400 && /api key/i.test(detail))
  ) {
    return new AiError(
      "AI_CONFIG",
      `Gemini rejected the request (${status}): ${detail}`
    );
  }

  if (status === 400) {
    return new AiError(
      "AI_BAD_RESPONSE",
      "Could not generate ideas right now. Please try again.",
      { status: 502 }
    );
  }

  return new AiError(
    "AI_UNAVAILABLE",
    "The idea generator is temporarily unavailable.",
    { status: 503 }
  );
};

// Parse Gemini JSON response.
export const parseJsonResponse = (data) => {
  const bad = () =>
    new AiError(
      "AI_BAD_RESPONSE",
      "Could not generate ideas right now. Please try again.",
      { status: 502 }
    );

  const candidate = data?.candidates?.[0];

  if (
    !candidate ||
    data?.promptFeedback?.blockReason ||
    candidate.finishReason === "SAFETY"
  ) {
    console.error("[ai] No usable candidate:", {
      blockReason: data?.promptFeedback?.blockReason,
      finishReason: candidate?.finishReason,
    });

    throw bad();
  }

  const text = (candidate.content?.parts ?? [])
    // skip "thought" parts if the model returns any
    .filter((part) => !part?.thought)
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  if (!text) {
    console.error("[ai] Gemini returned empty text.", {
      finishReason: candidate.finishReason,
    });
    throw bad();
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("[ai] JSON parsing failed:", error.message);
    debug("[ai] Received text:", text);
    throw bad();
  }
};

// thinkingBudget 0 worked in testing (about 3.5s). thinkingLevel "low" is only
// a fallback in case a model rejects a zero budget.
const THINKING_OPTIONS = [{ thinkingBudget: 0 }, { thinkingLevel: "low" }];

const buildBody = ({ systemInstruction, prompt, schema, thinkingConfig }) => ({
  systemInstruction: { parts: [{ text: systemInstruction }] },
  contents: [{ role: "user", parts: [{ text: prompt }] }],
  generationConfig: {
    responseMimeType: "application/json",
    responseJsonSchema: schema,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    thinkingConfig,
  },
});

const isRetryable = (error) =>
  TIMEOUT_CODES.has(error.code) ||
  [500, 502, 503, 504].includes(error.response?.status);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isModelProblem = (error) => {
  if (error instanceof AiError) return error.code === "AI_BAD_RESPONSE";
  const status = error.response?.status;
  const detail = error.response?.data?.error?.message ?? "";
  return status === 404 || (status === 400 && !/api key/i.test(detail));
};

// One model, one attempt. Tries the next thinking option only if the model rejects it.
const requestOnce = async ({ model, apiKey, systemInstruction, prompt, schema }) => {
  let lastError;

  for (const thinkingConfig of THINKING_OPTIONS) {
    try {
      return await http.post(
        `/models/${encodeURIComponent(model)}:generateContent`,
        buildBody({ systemInstruction, prompt, schema, thinkingConfig }),
        {
          timeout: REQUEST_TIMEOUT_MS,
          headers: {
            "x-goog-api-key": apiKey,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      lastError = error;
      const detail = error.response?.data?.error?.message ?? "";
      if (error.response?.status === 400 && /thinking/i.test(detail)) continue;
      throw error;
    }
  }

  throw lastError;
};

// Generate structured JSON using Gemini, with retry and model fallback.
export const generateJson = async ({ systemInstruction, prompt, schema, models: modelOverride, deadlineMs }) => {
  const apiKey = config.geminiApiKey;
  if (!apiKey) {
    throw new AiError("AI_CONFIG", "GEMINI_API_KEY is not configured");
  }

  const models = modelOverride?.length
    ? modelOverride
    : [...new Set([config.geminiModel || DEFAULT_MODEL, FALLBACK_MODEL])];
  const begin = Date.now();
  let lastError;

  outer: for (const model of models) {
    for (let attempt = 1; attempt <= ATTEMPTS_PER_MODEL; attempt++) {
      // With a deadline: never start an attempt that cannot finish in time, and cap its timeout.
      const remaining = deadlineMs ? deadlineMs - (Date.now() - begin) : Infinity;
      if (remaining < 1500) break outer;

      const startedAt = Date.now();
      try {
        const response = await requestOnce({
          model,
          apiKey,
          systemInstruction,
          prompt,
          schema,
          timeoutMs: Math.min(REQUEST_TIMEOUT_MS, remaining),
        });
        const usage = response.data?.usageMetadata;

        console.log(`[ai] ${model} responded in ${Date.now() - startedAt}ms`, {
          outputTokens: usage?.candidatesTokenCount,
          thinkingTokens: usage?.thoughtsTokenCount ?? 0,
        });

        return parseJsonResponse(response.data);
      } catch (error) {
        lastError = error;

        // This model cannot do the job: move on to the next one instead of giving up.
        if (isModelProblem(error) && model !== models[models.length - 1]) {
          console.warn(`[ai] ${model} unusable (${error.response?.status ?? error.code}), trying the next model`);
          continue outer;
        }

        if (error instanceof AiError) throw error; // bad/blocked response on the last model: retrying won't help

        console.warn(
          `[ai] ${model} attempt ${attempt} failed after ${Date.now() - startedAt}ms:`,
          error.response?.status ?? error.code,
          error.response?.data?.error?.message ?? error.message
        );

        if (!isRetryable(error)) throw toAiError(error); // e.g. 401, 403, 429, or a model problem on the last model
        if (attempt < ATTEMPTS_PER_MODEL) await sleep(1000 * attempt);
      }
    }
  }

  throw lastError instanceof AiError ? lastError : toAiError(lastError ?? new Error("Gemini deadline reached"));
};