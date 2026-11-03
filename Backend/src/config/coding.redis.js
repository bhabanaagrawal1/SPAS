
import IORedis from "ioredis";
import { SETTINGS } from "./coding.settings.js";
import config from "./config.js";

console.log("Redis config check:", {
  host: config.redisHost,
  port: config.redisPort,
  username: config.redisUsername,
  passwordExists: !!config.redisPassword,
});
if (
  !config.redisHost ||
  !config.redisPort ||
  !config.redisPassword
) {
  throw new Error(
    "Redis configuration is incomplete. Check REDIS_HOST, REDIS_PORT and REDIS_PASSWORD."
  );
}

// Common connection settings for Redis Cloud.
const connectionOptions = {
  host: config.redisHost,
  port: config.redisPort,
  username: config.redisUsername,
  password: config.redisPassword,
  connectTimeout: 5000,
};

// Cache connection: used for caching and locks.
export const redis = new IORedis({
  ...connectionOptions,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});

redis.on("error", (error) => {
  console.error("[redis] cache connection error:", error.message);
});

redis.on("ready", () => {
  console.log("[redis] Cache connection ready");
});

// BullMQ needs a separate connection.
export const createQueueConnection = () => {
  const connection = new IORedis({
    ...connectionOptions,
    maxRetriesPerRequest: null,
  });

  connection.on("error", (error) => {
    console.error("[redis] queue connection error:", error.message);
  });

  return connection;
};

// Redis key generator.
export const k = (...parts) => [
  config.redisNamespace || SETTINGS.namespace,
  "cp",
  ...parts,
].join(":");

// Close cache connection.
export const closeRedis = async () => {
  if (redis.status !== "end") {
    await redis.quit().catch(() => {});
  }
};