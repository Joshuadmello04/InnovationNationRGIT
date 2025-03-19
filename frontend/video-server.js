import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Fix for __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

// Enable CORS for all routes
app.use(cors());

// Add debug logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve static files from the jobs directory
app.use('/videos', express.static(path.join(__dirname, 'jobs'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mp4')) {
      res.set('Content-Type', 'video/mp4');
      res.set('Accept-Ranges', 'bytes'); // Enable range requests for video streaming
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.set('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.set('Content-Type', 'image/png');
    } else if (filePath.endsWith('.json')) {
      res.set('Content-Type', 'application/json');
    }
  }
}));

// Add a route to list available videos for a job
app.get('/list/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const jobDir = path.join(__dirname, 'jobs', jobId, 'outputs');

  if (!fs.existsSync(jobDir)) {
    return res.status(404).json({ error: 'Job directory not found' });
  }

  try {
    const platforms = fs.readdirSync(jobDir)
      .filter(item => fs.statSync(path.join(jobDir, item)).isDirectory());

    const result = {};
    
    platforms.forEach(platform => {
      const platformDir = path.join(jobDir, platform);
      const files = fs.readdirSync(platformDir);
      
      const videos = files.filter(file => file.endsWith('.mp4'));
      const thumbnails = files.filter(file => file.endsWith('.jpg'));
      const metadata = files.filter(file => file.endsWith('.json'));
      
      result[platform] = {
        videos: videos.map(file => ({
          name: file,
          url: `/videos/${jobId}/outputs/${platform}/${file}`,
          size: fs.statSync(path.join(platformDir, file)).size,
        })),
        thumbnails: thumbnails.map(file => ({
          name: file,
          url: `/videos/${jobId}/outputs/${platform}/${file}`,
        })),
        metadata: metadata.map(file => ({
          name: file,
          url: `/videos/${jobId}/outputs/${platform}/${file}`,
        })),
      };
    });

    res.json({
      jobId,
      platforms,
      files: result
    });
  } catch (error) {
    console.error(`Error listing files for job ${jobId}:`, error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(` Video server running at: http://localhost:${PORT}`);
  console.log(` Access videos at: http://localhost:${PORT}/videos/{jobId}/outputs/...`);
  console.log(` List videos for a job at: http://localhost:${PORT}/list/{jobId}`);
});
