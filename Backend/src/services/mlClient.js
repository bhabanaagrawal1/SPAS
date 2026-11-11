import { HttpError } from "../httpError.js";

async function call(path, { method = "GET", body, timeout = 60_000 } = {}) {
  let res;
  try {
    res = await fetch(`${process.env.ML_SERVICE_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", "X-API-Key": process.env.ML_API_KEY || "" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeout),
    });
  } catch {
    throw new HttpError(503, "ML service is not running (start uvicorn on port 8000)");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new HttpError(res.status === 422 ? 422 : 502, data.detail || "ML service error");
  return data;
}

export const mlAnalyze = (records) => call("/analyze", { method: "POST", body: { records } });
export const mlMeta = () => call("/meta", { timeout: 10_000 });
export const mlHealth = () => call("/health", { timeout: 5_000 });