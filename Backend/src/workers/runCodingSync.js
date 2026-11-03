// Production entry point: run this as its own process/container, separate from the API.
//   node src/workers/runCodingSync.js   (or: npm run worker:coding)
import "dotenv/config"; // remove this line if your env is loaded some other way
import { startCodingSync } from "../services/codingProfiles/sync/codingSync.worker.js";

const { stop } = startCodingSync();

let stopping = false;
const shutdown = async (signal) => {
  if (stopping) return;
  stopping = true;
  console.log(`[coding-sync] ${signal} received, finishing running jobs...`);
  try {
    await stop();
  } finally {
    process.exit(0);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));