#!/usr/bin/env bash

# Make sure we can use apt
apt-get update

# Install ffmpeg
apt-get install -y ffmpeg

# Install yt-dlp
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
chmod a+rx /usr/local/bin/yt-dlp
