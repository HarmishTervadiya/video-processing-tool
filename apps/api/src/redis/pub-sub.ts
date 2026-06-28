import { createClient } from "redis";

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);
export const connection = { host: redisHost, port: redisPort };

export const redisClient = createClient({
  socket: {
    host: redisHost,
    port: redisPort,
  },
});

redisClient.on("error", (err) => console.error("Redis Client Error:", err));
