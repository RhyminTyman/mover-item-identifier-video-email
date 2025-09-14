# Video Processing System

This application now includes a robust video processing system that handles problematic video formats like MOV files by using server-side processing with FFmpeg.

## How It Works

### Client-Side Processing (Primary)
- For well-supported formats (MP4, WebM), the browser processes videos directly
- Uses HTML5 video element to extract frames
- Fast and efficient for compatible formats

### Server-Side Processing (Fallback)
- For problematic formats (MOV, AVI, WMV), automatically uses server-side processing
- Uses FFmpeg for reliable video frame extraction
- Handles formats that browsers cannot process natively

## Supported Video Formats

### Browser-Compatible (Client-Side)
- **MP4** - H.264 codec recommended
- **WebM** - VP8/VP9 codec
- **OGG** - Theora codec

### Server-Side Processing Required
- **MOV** - QuickTime format (problematic in browsers)
- **AVI** - Limited browser support
- **WMV** - Windows Media Video
- **QuickTime** - Legacy QuickTime formats

## Setup Instructions

### 1. Install FFmpeg

Run the setup script:

```bash
./scripts/setup-ffmpeg.sh
```

Or install manually:

#### macOS (with Homebrew)
```bash
brew install ffmpeg
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install ffmpeg
```

#### Windows (with Chocolatey)
```bash
choco install ffmpeg -y
```

### 2. Verify Installation

Check if FFmpeg is working:

```bash
ffmpeg -version
```

Test the API endpoint:

```bash
curl http://localhost:3000/api/video/frames
```

## API Endpoints

### POST `/api/video/frames`
Processes video files server-side and extracts frames.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `video` file field

**Response:**
```json
{
  "success": true,
  "frames": ["data:image/jpeg;base64,..."],
  "method": "server-side-ffmpeg"
}
```

### GET `/api/video/frames`
Health check endpoint to verify FFmpeg availability.

**Response:**
```json
{
  "status": "healthy",
  "ffmpeg": "available",
  "message": "Video processing service is ready"
}
```

## Error Handling

The system includes comprehensive error handling:

1. **Format Detection**: Automatically detects problematic formats
2. **Client-Side Fallback**: Falls back to server-side processing on browser errors
3. **Server-Side Fallback**: Uses alternative FFmpeg commands if primary fails
4. **Graceful Degradation**: Returns empty frames if all methods fail

## Troubleshooting

### Common Issues

#### FFmpeg Not Found
```
Error: FFmpeg not found - video processing will not work
```

**Solution:** Install FFmpeg using the setup script or manually.

#### MOV File Errors
```
Video error for IMG_4171.MOV: {}
```

**Solution:** This is now handled automatically by server-side processing. The system will:
1. Detect MOV format
2. Automatically use server-side processing
3. Extract frames using FFmpeg

#### Server-Side Processing Fails
If server-side processing fails, check:
1. FFmpeg is installed and accessible
2. File permissions for temporary directory
3. Available disk space
4. File is not corrupted

### Debug Information

The system provides detailed logging:

```
🖥️ Server-side video processing for: IMG_4171.MOV, type: video/quicktime, size: 1234567
✅ Server-side processing successful for IMG_4171.MOV using server-side-ffmpeg
```

## Performance Considerations

- **Client-Side**: Faster for supported formats, no server load
- **Server-Side**: More reliable but uses server resources
- **File Size**: Large video files may take longer to process
- **Concurrent Processing**: Multiple videos can be processed simultaneously

## Security Notes

- Temporary files are automatically cleaned up
- File processing is isolated in `/tmp` directory
- No persistent storage of uploaded videos
- Input validation prevents malicious file uploads

## Future Improvements

- Support for additional video formats
- Video thumbnail generation
- Batch processing capabilities
- Progress tracking for large files
- Caching for frequently processed videos
