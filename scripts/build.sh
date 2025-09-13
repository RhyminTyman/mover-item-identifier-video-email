#!/bin/bash

echo "🚀 Starting build process..."

# Set error handling
set -e

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Are you in the right directory?"
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Generate Prisma client
echo "🔧 Generating Prisma client..."
pnpm prisma generate

# Verify Prisma client was generated
echo "🔍 Verifying Prisma client..."
if [ ! -d "node_modules/@prisma/client" ]; then
  echo "❌ Error: Prisma client not generated"
  echo "Looking for Prisma client in:"
  find node_modules -name "@prisma" -type d 2>/dev/null || echo "No @prisma directories found"
  exit 1
fi
echo "✅ Prisma client found at node_modules/@prisma/client"

# Run type check
echo "🔍 Running type check..."
pnpm tsc --noEmit

# Run linting (allow failures)
echo "🔍 Running linting..."
pnpm lint || echo "⚠️ Linting completed with warnings"

# Build the application
echo "🏗️ Building application..."
pnpm build

echo "✅ Build completed successfully!"
