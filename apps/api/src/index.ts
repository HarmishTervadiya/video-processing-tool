import ffmpeg from "fluent-ffmpeg";
import express from "express";

const app = express();
const port = process.env.PORT || 3001;

app.get("/", (req, res) => {
  res.send("API is running!");
});

app.get("/ffmpeg-version", (req, res) => {
  ffmpeg.getAvailableFormats((err, formats) => {
    if (err) {
      console.error("FFmpeg error:", err);
      return res.status(500).json({ error: "FFmpeg not available", details: err.message });
    }
    res.json({ message: "FFmpeg is working!", formatCount: Object.keys(formats).length });
  });
});

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
  
  // Also log the FFmpeg status on startup
  ffmpeg.getAvailableFormats((err, formats) => {
    if (err) {
      console.error("FFmpeg startup check failed:", err.message);
    } else {
      console.log(`FFmpeg startup check passed! Found ${Object.keys(formats).length} formats.`);
    }
  });
});