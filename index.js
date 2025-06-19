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

config();

// Ensure "downloads" directory exists
const downloadDir = path.join(__dirname, "downloads");
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir);
}

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.get("/info", info);
app.get("/download", downloadVideo);
app.get("/audio", downloadAudio);
app.get("/thumbnail", downloadThumbnail);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled promise rejection:", err);
});
