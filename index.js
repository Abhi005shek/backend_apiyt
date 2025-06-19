const express = require("express");
const { config } = require("dotenv");
const {
  info,
  downloadVideo,
  downloadAudio,
  downloadThumbnail,
} = require("./controller");

config();

console.log(process.env.PORT);
const app = express();
const PORT = 5000;

app.get("/info", info);
app.get("/download", downloadVideo);
app.get("/audio", downloadAudio);
app.get("/thumbnail", downloadThumbnail);

app.listen(PORT || 5000, () => {
  console.log(`Server is running at http://localhost:${PORT || 5000}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled promise rejection:", err);
});
