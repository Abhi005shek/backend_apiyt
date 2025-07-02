const { exec } = require("child_process");
const path = require("path");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const https = require("https");

// const ffmpegPath = "/usr/bin/ffmpeg";
// const ytdlpPath = "/usr/local/bin/yt-dlp";
// const ytdlpPath = path.join(__dirname, "bin", "yt-dlp");
const ytdlpPath = "yt-dlp";
const userAgent = `--user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"`

function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9_\-\.]/gi, "_");
}

exports.info = (req, res) => {
  const videoURL = req.query.url;
  if (!videoURL) return res.status(400).send("Missing URL parameter");

  //   const command = `yt-dlp -F "${videoURL}" --print-json`;
  // const command = `yt-dlp --dump-json "${videoURL}"`;
  const command = `${ytdlpPath} --cookies ./yt.txt ${userAgent} --dump-json "${videoURL}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("Error:", error);
      return res.status(500).send("Failed to fetch info");
    }

    try {
      const info = JSON.parse(stdout);
      const formats = info.formats.map((f) => ({
        format_id: f.format_id,
        resolution: f.resolution || `${f.width}x${f.height}` || "audio only",
        // ext: f.ext,
        filesize: f.filesize,
        acodec: f.acodec,
        vcodec: f.vcodec,
        format_note: f.format_note,
        fps: f.fps,
        // tbr: f.tbr,
        url: f.url,
      }));

      res.json({
        title: info.title,
        thumbnail: info.thumbnail,
        duration: info.duration,
        formats,
      });
    } catch (e) {
      console.error("Parsing error:", e);
      res.status(500).send("Failed to parse info");
    }
  });
};

exports.downloadVideo = (req, res) => {
  console.log("Download route accessed!");
  const videoURL = req.query.url;
  const formatId = req.query.format_id;
  let title = req.query.title || `video_${uuidv4()}`;

  if (!videoURL || !formatId) {
    return res.status(400).send("Missing url or format_id parameter");
  }

  //   if (!videoURL) return res.status(400).send("Missing URL parameter");

  const id = uuidv4(); // unique ID for each download

  //   const output = path.join(__dirname, "downloads", `${id}.mp4`);
  //   const command = `yt-dlp --ffmpeg-location "${ffmpegPath}" -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" --merge-output-format mp4 -o "${output}" "${videoURL}"`;

  title = sanitizeFilename(title);
  const output = path.join(__dirname, "downloads", `${title}.mp4`);

  // const command = `yt-dlp --ffmpeg-location "${ffmpegPath}" -f "${formatId}+bestaudio[ext=m4a]/best[ext=mp4]" --merge-output-format mp4 -o "${output}" "${videoURL}"`;
  const command = `${ytdlpPath} --ffmpeg-location "${ffmpegPath}" --cookies ./yt.txt -f "${formatId}+bestaudio[ext=m4a]/best[ext=mp4]" --merge-output-format mp4 -o "${output}" "${videoURL}"`;
  exec(command, (error, stdout, stderr) => {
    console.log("STDOUT:", stdout);
    console.error("STDERR:", stderr);
    if (error) {
      console.error("Error:", error);
      return res.status(500).send("Download failed");
    }

    // Serve the correct video
    res.download(output, `${title}.mp4`, (err) => {
      if (err) console.error("Download error:", err);
      // Optional cleanup
      fs.unlink(output, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    });
  });
};

//
//
exports.downloadAudio = (req, res) => {
  const videoURL = req.query.url;
  let title = req.query.title || `audio_${uuidv4()}`;

  if (!videoURL) return res.status(400).send("Missing URL parameter");

  title = sanitizeFilename(title);
  const outputPath = path.join(
    __dirname,
    "..",
    "downloads",
    `${title}.%(ext)s`
  );
  const mp3Path = outputPath.replace("%(ext)s", "mp3");

  // Step 1: If previous file exists, delete it
  if (fs.existsSync(mp3Path)) {
    fs.unlinkSync(mp3Path);
  }

  // Step 2: Run yt-dlp to extract and convert to mp3
  // const command = `yt-dlp --ffmpeg-location "${ffmpegPath}" -x --audio-format mp3 --embed-thumbnail --add-metadata --metadata-from-title "%(artist)s - %(title)s" -o "${outputPath}" "${videoURL}"`;
  const command = `${ytdlpPath} --ffmpeg-location "${ffmpegPath}" --cookies ./yt.txt -x --audio-format mp3 --embed-thumbnail --add-metadata --metadata-from-title "%(artist)s - %(title)s" -o "${outputPath}" "${videoURL}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("Error:", error);
      return res.status(500).send("Download failed");
    }

    // Step 3: Respond with the new mp3
    res.download(mp3Path, `${title}.mp3`, () => {
      // Step 4: Optional cleanup
      fs.unlink(mp3Path, () => {});
    });
  });
};

// Thumbnail
exports.downloadThumbnail = (req, res) => {
  const videoURL = req.query.url;
  if (!videoURL) return res.status(400).send("Missing URL parameter");

  const command = `${ytdlpPath} --cookies ./yt.txt --print "%(thumbnail)s" "${videoURL}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("yt-dlp error:", error);
      return res.status(500).send("Failed to get thumbnail");
    }

    const thumbnailURL = stdout.trim();
    const ext =
      path.extname(new URL(thumbnailURL).pathname).split("?")[0] || ".jpg";
    const filename = `thumb_${uuidv4()}${ext}`;
    const filePath = path.join(__dirname, "..", "downloads", filename);

    // ✅ Ensure the directory exists
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    const file = fs.createWriteStream(filePath);

    https
      .get(thumbnailURL, (response) => {
        if (response.statusCode !== 200) {
          console.error("Failed to download image:", response.statusCode);
          return res.status(500).send("Thumbnail fetch failed");
        }

        response.pipe(file);

        file.on("finish", () => {
          file.close(() => {
            res.download(filePath, filename, () => {
              fs.unlink(filePath, () => {}); // cleanup
            });
          });
        });
      })
      .on("error", (err) => {
        console.error("HTTPS error:", err);
        res.status(500).send("Thumbnail download error");
      });
  });
};
