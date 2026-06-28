import fs from "fs";
import { connection, redisClient } from "../redis/pub-sub";
import { Queue, Worker } from "bullmq";

export const videoProcessQueue = new Queue("transcoding", { connection });
const worker = new Worker(
  "transcoding",
  async (job) => {
    console.log(`[Worker] Received job ${job.id}:`, job.data);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  },
  { connection },
);

worker.on("active", async (job) => {
  redisClient.publish(
    "processing_updates",
    JSON.stringify({
      jobId: job.id,
      status: "processing",
    }),
  );
  console.log(`[Worker] Job ${job.id} is now active`);
});

worker.on("completed", (job) => {
  const payload = {
    jobId: job.id,
    status: "completed",
    downloadUrl: `http://localhost:3001/media/${job.data.outputFilename}`,
  };
  redisClient.publish("processing_updates", JSON.stringify(payload));

  console.log(`[Worker] Job ${job.id} has completed`);
  if (job?.data?.path) {
    fs.unlinkSync(job.data.path);
  }
});

worker.on("failed", (job, err) => {
  redisClient.publish(
    "processing_updates",
    JSON.stringify({
      jobId: job?.id,
      status: "failed",
      error: err.message,
    }),
  );
  console.error(`[Worker] Job ${job?.id} failed with error:`, err);
  if (job?.data?.path) {
    fs.unlinkSync(job.data.path);
  }
});
