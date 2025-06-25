const express = require("express");
const { config } = require("dotenv");
const path = require("path");
const fs = require("fs");
const {
  info,
  downloadVideo,
  downloadAudio,
  downloadThumbnail,
} = require("./controller");
const cors = require("cors");
const ratelimit = require("express-rate-limit");
const { downloadMAudio, downloadMVideo } = require("./mobileController");

config();

// Ensure "downloads" directory exists
const downloadDir = path.join(__dirname, "downloads");
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir);
}

const PORT = process.env.PORT || 5000;
const app = express();
app.set("trust proxy", 1); // Trust the first proxy

const infoRateLimiter = ratelimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  message: "Too many requests — try again in 24 hours.",
});
const downloadRateLimiter = ratelimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 2,
  message: "Too many requests — try again in 24 hours.",
});

app.use(cors());
app.get("/info", infoRateLimiter, info);
app.get("/download", downloadRateLimiter, downloadVideo);
app.get("/audio", downloadRateLimiter, downloadAudio);
app.get("/thumbnail", downloadRateLimiter, downloadThumbnail);

app.get("/v2/download", downloadRateLimiter, downloadMVideo);
app.get("/v2/audio", downloadRateLimiter, downloadMAudio);
 
app.get("/v2/test", infoRateLimiter, (req, res) => {
  res.send("working");
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled promise rejection:", err);
});
