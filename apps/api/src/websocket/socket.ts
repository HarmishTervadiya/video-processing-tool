import { Server } from "socket.io";
import { redisClient } from "../redis/pub-sub";

export function setupWebSocket(server: any) {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  const subClient = redisClient.duplicate();
  subClient
    .connect()
    .then(async () => {
      console.log("WebSocket Subscriber Redis Client connected successfully");
      await subClient.subscribe("processing_updates", (message) => {
        try {
          const data = JSON.parse(message);
          console.log("[WS Publish] Message received from Redis:", data);
          io.to(data.jobId).emit("status_change", data);
        } catch (err: any) {
          console.error(
            "Failed to parse Redis message in WebSocket subscriber:",
            err.message,
          );
        }
      });
    })
    .catch((err) => {
      console.error(
        "Failed to connect WebSocket Subscriber Redis Client:",
        err,
      );
    });

  io.on("connection", (socket) => {
    console.log("user connected");

    socket.on("video_status_request", (data) => {
      if (data && data.jobId) {
        console.log(`Socket ${socket.id} joined room ${data.jobId}`);
        socket.join(String(data.jobId));
      }
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });

  return io;
}
