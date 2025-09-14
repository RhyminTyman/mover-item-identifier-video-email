#!/bin/bash

# FFmpeg Setup Script for Video Processing
# This script installs FFmpeg for server-side video frame extraction

echo "🎬 Setting up FFmpeg for video processing..."

# Detect operating system
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "🐧 Detected Linux system"
    
    # Check if apt is available (Ubuntu/Debian)
    if command -v apt &> /dev/null; then
        echo "📦 Installing FFmpeg via apt..."
        sudo apt update
        sudo apt install -y ffmpeg
    # Check if yum is available (CentOS/RHEL)
    elif command -v yum &> /dev/null; then
        echo "📦 Installing FFmpeg via yum..."
        sudo yum install -y epel-release
        sudo yum install -y ffmpeg
    # Check if dnf is available (Fedora)
    elif command -v dnf &> /dev/null; then
        echo "📦 Installing FFmpeg via dnf..."
        sudo dnf install -y ffmpeg
    else
        echo "❌ Package manager not found. Please install FFmpeg manually."
        exit 1
    fi
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "🍎 Detected macOS system"
    
    # Check if Homebrew is available
    if command -v brew &> /dev/null; then
        echo "🍺 Installing FFmpeg via Homebrew..."
        brew install ffmpeg
    else
        echo "❌ Homebrew not found. Please install Homebrew first or install FFmpeg manually."
        echo "To install Homebrew, run: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # Windows (Git Bash or Cygwin)
    echo "🪟 Detected Windows system"
    
    # Check if Chocolatey is available
    if command -v choco &> /dev/null; then
        echo "🍫 Installing FFmpeg via Chocolatey..."
        choco install ffmpeg -y
    else
        echo "❌ Chocolatey not found. Please install FFmpeg manually or install Chocolatey first."
        echo "To install Chocolatey, visit: https://chocolatey.org/install"
        exit 1
    fi
    
else
    echo "❌ Unsupported operating system: $OSTYPE"
    echo "Please install FFmpeg manually for your system."
    exit 1
fi

# Verify installation
echo "🔍 Verifying FFmpeg installation..."
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg installed successfully!"
    echo "📋 FFmpeg version:"
    ffmpeg -version | head -n 1
    
    # Test the video processing API endpoint
    echo "🧪 Testing video processing endpoint..."
    if command -v curl &> /dev/null; then
        curl -s http://localhost:3000/api/video/frames || echo "⚠️ API endpoint not accessible (this is normal if the server isn't running)"
    fi
    
    echo ""
    echo "🎉 Setup complete! Your application can now process video files server-side."
    echo "📝 Supported formats: MOV, AVI, WMV, MP4, WebM, OGG"
    echo "🔧 The server will automatically use FFmpeg for problematic video formats."
    
else
    echo "❌ FFmpeg installation failed or not found in PATH"
    exit 1
fi
