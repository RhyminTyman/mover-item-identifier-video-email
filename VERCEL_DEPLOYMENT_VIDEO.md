# Vercel Deployment Guide - Video Processing

This guide explains how to deploy your application with video processing capabilities to Vercel.

## 🚀 Quick Deployment

### 1. Deploy to Vercel

```bash
# Install Vercel CLI if you haven't already
npm i -g vercel

# Deploy your application
vercel

# Follow the prompts to link to your Vercel project
```

### 2. Set Environment Variables

In your Vercel dashboard, add these environment variables:

```
DATABASE_URL=your_neon_database_url
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=https://your-app.vercel.app
CLERK_SECRET_KEY=your_clerk_secret
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_public_key
REDIS_URL=your_redis_url
OPENAI_API_KEY=your_openai_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=your_aws_region
S3_BUCKET_NAME=your_s3_bucket
```

## 📹 Video Processing Options

### Option 1: Basic Deployment (Recommended for MVP)

Your application will work with basic video processing:

- ✅ **MP4 files**: Processed client-side (fast)
- ✅ **WebM files**: Processed client-side (fast)
- ⚠️ **MOV files**: Fallback to client-side processing (may have issues)
- ⚠️ **Other formats**: Limited support

**Benefits:**
- Simple deployment
- No additional configuration needed
- Fast for supported formats

**Limitations:**
- MOV files may not work reliably
- Limited format support

### Option 2: Enhanced Deployment with FFmpeg

For full video processing support, you'll need FFmpeg. Here are your options:

#### A. Use Vercel Edge Runtime (Limited FFmpeg)

```typescript
// In your API route, add:
export const runtime = 'edge';
```

**Limitations:**
- Limited FFmpeg support
- Smaller memory allocation
- Shorter execution time

#### B. Use External Video Processing Service

Consider using services like:
- **Cloudinary**: Full video processing API
- **AWS MediaConvert**: Enterprise video processing
- **Azure Media Services**: Microsoft's video processing

Example with Cloudinary:
```typescript
// Replace server-side processing with Cloudinary
const cloudinaryResponse = await fetch(
  `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
  {
    method: 'POST',
    body: formData
  }
);
```

#### C. Custom Server with FFmpeg

Deploy to platforms that support FFmpeg:
- **Railway**: Supports FFmpeg
- **DigitalOcean App Platform**: Supports custom Docker
- **AWS Lambda**: With custom layers
- **Google Cloud Run**: With custom containers

## 🔧 Current Implementation

Your application is configured for **Option 1** (Basic Deployment) with the following features:

### Smart Fallback System

1. **Format Detection**: Automatically detects problematic formats
2. **Server-Side Attempt**: Tries server-side processing first
3. **Graceful Fallback**: Falls back to client-side if server-side fails
4. **Error Handling**: Provides clear error messages

### API Endpoints

- `POST /api/video/frames` - Video processing endpoint
- `GET /api/video/frames` - Health check and capability detection

### Configuration

Your `vercel.json` is configured with:
- 30-second timeout for video processing
- 1GB memory allocation
- Optimized for serverless functions

## 🧪 Testing Your Deployment

### 1. Check Video Processing Status

```bash
curl https://your-app.vercel.app/api/video/frames
```

Expected response:
```json
{
  "status": "limited",
  "ffmpeg": "unavailable",
  "environment": {
    "vercel": true,
    "production": true,
    "nodeEnv": "production"
  },
  "message": "Video processing limited - MOV files will fallback to client-side processing",
  "fallback": true
}
```

### 2. Test Video Upload

1. Upload an MP4 file - should work perfectly
2. Upload a MOV file - will attempt processing and provide fallback

### 3. Monitor Logs

Check Vercel function logs for:
- Video processing attempts
- Fallback messages
- Error handling

## 🚨 Troubleshooting

### Common Issues

#### "FFmpeg not found" Error
```
⚠️ Server-side processing not available for IMG_4171.MOV. Using client-side fallback.
```

**Solution**: This is expected behavior in basic Vercel deployment. MOV files will fallback to client-side processing.

#### Function Timeout
```
Function execution timed out
```

**Solution**: 
1. Reduce video file size
2. Optimize video compression
3. Consider external video processing service

#### Memory Issues
```
Function exceeded memory limit
```

**Solution**:
1. Process smaller video files
2. Increase memory allocation in `vercel.json`
3. Use streaming processing

### Debug Commands

```bash
# Check deployment status
vercel ls

# View function logs
vercel logs your-deployment-url

# Test API endpoint
curl -X GET https://your-app.vercel.app/api/video/frames
```

## 📈 Performance Optimization

### For Basic Deployment

1. **File Size Limits**: Keep videos under 10MB
2. **Format Recommendations**: Use MP4 with H.264 codec
3. **Compression**: Pre-compress videos before upload
4. **Fallback Handling**: Inform users about format limitations

### For Enhanced Deployment

1. **CDN Integration**: Use Vercel's Edge Network
2. **Caching**: Cache processed frames
3. **Background Processing**: Use Vercel Cron for batch processing
4. **Monitoring**: Set up alerts for processing failures

## 🔄 Migration Path

If you need full video processing later:

1. **Immediate**: Current deployment works for most use cases
2. **Short-term**: Add Cloudinary integration
3. **Long-term**: Move to dedicated video processing infrastructure

## 📞 Support

If you encounter issues:

1. Check Vercel function logs
2. Test with different video formats
3. Verify environment variables
4. Consider the limitations of serverless video processing

Your application is now ready for Vercel deployment with smart video processing fallbacks! 🎉
