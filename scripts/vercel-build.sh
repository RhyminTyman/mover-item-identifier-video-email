#!/bin/bash

# Vercel Build Script with FFmpeg Installation
# This script installs FFmpeg during the Vercel build process

echo "🚀 Starting Vercel build with FFmpeg support..."

# Install FFmpeg for Vercel's AWS Lambda environment
echo "📦 Installing FFmpeg..."

# Create directory for FFmpeg
mkdir -p /tmp/ffmpeg

# Download and install FFmpeg static binary
cd /tmp/ffmpeg
wget -q https://github.com/eugeneware/ffmpeg-static/releases/download/b4.2.2/ffmpeg-linux-x64
chmod +x ffmpeg-linux-x64
mv ffmpeg-linux-x64 ffmpeg

# Make FFmpeg available system-wide
export PATH="/tmp/ffmpeg:$PATH"
export FFMPEG_PATH="/tmp/ffmpeg/ffmpeg"

echo "✅ FFmpeg installed successfully"
echo "📍 FFmpeg path: $FFMPEG_PATH"

# Verify FFmpeg installation
./ffmpeg -version | head -n 1

# Run the original build command
echo "🔨 Running Next.js build..."
cd /vercel/path0
pnpm build

echo "🎉 Build completed successfully with FFmpeg support!"
