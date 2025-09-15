const fs = require('fs');
const FormData = require('form-data');

// Create a simple test video file (1 second of black video)
const testVideoPath = './test-video.mp4';

// Test the API endpoint
async function testVideoAPI() {
  try {
    // Create a simple test video using ffmpeg
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    console.log('Creating test video...');
    await execAsync('ffmpeg -f lavfi -i testsrc=duration=2:size=320x240:rate=1 -c:v libx264 -pix_fmt yuv420p test-video.mp4 -y');
    
    console.log('Test video created, testing API...');
    
    const form = new FormData();
    form.append('video', fs.createReadStream(testVideoPath));
    form.append('maxFrames', '3');
    
    const response = await fetch('http://localhost:3000/api/video/convert-and-extract', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response:', result);
    
    // Clean up
    fs.unlinkSync(testVideoPath);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testVideoAPI();
