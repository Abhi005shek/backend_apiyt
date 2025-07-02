# #!/bin/bash

# # Fail the build if any command fails
# set -e

# echo "🛠️ Starting build script..."

# # Create a local bin directory inside the project
# mkdir -p ./bin

# # Download yt-dlp binary into ./bin
# curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ./bin/yt-dlp

# # Make it executable
# chmod +x ./bin/yt-dlp

# echo "✅ yt-dlp installed locally at ./bin/yt-dlp"




#!/bin/bash

# Fail the build if any command fails
set -e

echo "🛠️ Starting build script..."

# Create a local bin directory inside the project
mkdir -p ./bin

# Download the latest NIGHTLY yt-dlp binary into ./bin
curl -L https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp -o ./bin/yt-dlp

# Make it executable
chmod +x ./bin/yt-dlp

echo "🌙 Nightly yt-dlp installed locally at ./bin/yt-dlp"

