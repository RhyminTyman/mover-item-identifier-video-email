#!/bin/bash

# Vercel build script with FFmpeg installation
set -e

echo "🚀 Starting Vercel build process..."

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Install FFmpeg for video processing
echo "🎬 Installing FFmpeg..."
if command -v apt-get &> /dev/null; then
  # Ubuntu/Debian (Vercel)
  apt-get update -qq
  apt-get install -y -qq ffmpeg
elif command -v brew &> /dev/null; then
  # macOS (local development)
  brew install ffmpeg
else
  echo "⚠️ Warning: Could not install FFmpeg - video processing may not work"
fi

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
pnpm db:generate

# Build Next.js app
echo "🏗️ Building Next.js application..."
pnpm build

echo "✅ Build completed successfully!"