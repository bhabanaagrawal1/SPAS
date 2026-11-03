
import { createClient } from "redis";
import "dotenv/config";

const client = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

client.on("error", (err) => {
  console.error("[Redis]", err.message);
});

try {
  await client.connect();

  console.log("Redis connected successfully!");

  const pong = await client.ping();
  console.log("PING:", pong);

  await client.set("student360:test", "working");

  console.log("GET:", await client.get("student360:test"));
} catch (error) {
  console.error("Connection failed:", error.message);
} finally {
  if (client.isOpen) {
    await client.quit();
  }
}
