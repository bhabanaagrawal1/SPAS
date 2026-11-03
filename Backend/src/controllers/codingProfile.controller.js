import { connectAccount, disconnectAccount, requestSync } from "../services/codingProfiles/accounts.service.js";
import { getDashboard } from "../services/codingProfiles/dashboard.service.js";
import { getRecommendations } from "../services/codingProfiles/recommendations.service.js";

// Controllers stay thin: read the request, call a service, shape the response.
// req.student is set by the middleware in codingAccess.js.

const send = (res, data, status = 200) => res.status(status).json({ success: true, data });

const ratingPlatformOf = (req) =>
  typeof req.query.ratingPlatform === "string" ? req.query.ratingPlatform : undefined;

export const dashboard = async (req, res) => {
  send(res, await getDashboard(req.student.id, { ratingPlatform: ratingPlatformOf(req) }));
};

export const recommendations = async (req, res) => {
  const limit = Math.min(10, Math.max(1, Number.parseInt(req.query.limit, 10) || 5));
  send(res, await getRecommendations(req.student.id, { limit, refresh: req.query.refresh === "true" }));
};

// Returns 202: the first sync runs in the background.
export const connect = async (req, res) => {
  send(res, await connectAccount(req.student.id, req.params.platform, req.body?.handle), 202);
};

export const disconnect = async (req, res) => {
  await disconnectAccount(req.student.id, req.params.platform);
  send(res, { disconnected: req.params.platform });
};

export const sync = async (req, res) => {
  send(res, { queued: await requestSync(req.student.id, req.params.platform) }, 202);
};