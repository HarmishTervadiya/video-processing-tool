import ffmpeg from "fluent-ffmpeg";
import express from "express";
import multer from "multer";
import { createClient } from "redis";
import { Queue, Worker } from "bullmq";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import http from "http";
import { videoProcessQueue } from "./worker";
import { redisClient } from "./redis/pub-sub";
import { setupWebSocket } from "./websocket/socket";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const port = process.env.PORT || 3001;
export const server = http.createServer(app);

setupWebSocket(server);

const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ dest: uploadsDir });

redisClient
  .connect()
  .then(() => console.log("Connected to Redis successfully"))
  .catch((err) => console.error("Failed to connect to Redis:", err));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running!");
});

app.get("/ffmpeg-version", (req, res) => {
  ffmpeg.getAvailableFormats((err, formats) => {
    if (err) {
      console.error("FFmpeg error:", err);
      return res.status(500).json({
        error: "FFmpeg not available",
        details: err.message,
      });
    }
    res.json({
      message: "FFmpeg is working!",
      formatCount: Object.keys(formats).length,
    });
  });
});

app.post("/api/upload-video", upload.single("video"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No video file uploaded" });
  }

  console.log(`[API] Received file upload: ${req.file.originalname}`);

  try {
    const job = await videoProcessQueue.add("transcoding", req.file, {
      removeOnComplete: true,
      removeOnFail: true,
    });

    await redisClient.publish(job.id!, "Job created");

    return res.status(200).json({
      message: "Video upload success. Job queued.",
      jobId: job.id,
    });
  } catch (error: any) {
    console.error("[API] Failed to add job to queue:", error);
    return res.status(500).json({
      error: "Failed to queue video processing",
      details: error.message,
    });
  }
});

server.listen(port, () => {
  console.log(`API server listening on port ${port}`);

  // Log FFmpeg status on startup
  ffmpeg.getAvailableFormats((err, formats) => {
    if (err) {
      console.error("FFmpeg startup check failed:", err.message);
    } else {
      console.log(
        `FFmpeg startup check passed! Found ${Object.keys(formats).length} formats.`,
      );
    }
  });
});

