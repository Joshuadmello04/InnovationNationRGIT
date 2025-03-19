// app/api/results/[jobId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { join } from 'path';
import { readFile, readdir } from 'fs/promises';
import { existsSync, statSync } from 'fs'; // Added statSync import here

// Define types for metadata
interface Creatives {
  headline: string;
  description: string;
  call_to_action?: string;
  callToAction?: string;
}

interface EngagementPrediction {
  predicted_engagement: number;
  engagement_level: string;
}

interface Metadata {
  platform?: string;
  timestamp?: number;
  duration?: number;
  aspect_ratio?: string;
  video_file?: string;
  thumbnail_file?: string;
  creatives?: Creatives;
  engagement_prediction?: EngagementPrediction;
  job_id?: string;
}

// Function to convert absolute file paths to relative API URLs
function convertToApiUrl(path: string | null): string | null {
  if (!path) return null;
  
  // Find the jobs directory in the path
  const jobsIndex = path.indexOf('jobs');
  if (jobsIndex === -1) return path;
  
  // Extract the part after 'jobs/'
  const relativePath = path.substring(jobsIndex);
  
  // Convert to API URL
  return `/api/static/${relativePath.replace(/\\/g, '/')}`;
}

// Function to read metadata file if it exists
async function readMetadataFile(metadataPath: string): Promise<Metadata | null> {
  try {
    if (existsSync(metadataPath)) {
      const data = await readFile(metadataPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading metadata file:', error);
  }
  return null;
}

// Function to find the latest file matching a pattern in a directory
async function findLatestFile(dir: string, extension: string): Promise<string | null> {
  try {
    if (!existsSync(dir)) return null;
    
    const files = await readdir(dir);
    
    // Filter files by extension
    const matchingFiles = files.filter(file => file.endsWith(extension));
    
    if (matchingFiles.length === 0) return null;
    
    // Sort by creation date (newest first)
    // Use statSync from imported fs module instead of require('fs')
    matchingFiles.sort((a, b) => {
      const statA = existsSync(join(dir, a)) ? statSync(join(dir, a)).mtime.getTime() : 0;
      const statB = existsSync(join(dir, b)) ? statSync(join(dir, b)).mtime.getTime() : 0;
      return statB - statA;
    });
    
    return matchingFiles[0];
  } catch (error) {
    console.error(`Error finding latest ${extension} file:`, error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  context: { params: { jobId: string } }
) {
  // Get jobId from context using destructuring (this is key for newer Next.js)
  const { jobId } = context.params;
  
  try {
    // Fetch job details from the database
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        contents: {
          include: {
            creatives: true,
            metrics: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' }, 
        { status: 404 }
      );
    }

    // Check if there are no db contents but output dir exists (direct file system check)
    if (job.contents.length === 0) {
      // Try to get content from the file system directly
      const outputDir = join(process.cwd(), 'jobs', jobId, 'outputs');
      const platforms = ['youtube_shorts', 'youtube_ads', 'display_ads', 'performance_max'];
      
      const fileSystemResults = [];
      
      for (const platform of platforms) {
        // Look for files in the platform directory
        const platformDir = join(outputDir, platform);
        
        if (existsSync(platformDir)) {
          // Find the latest files
          const videoName = await findLatestFile(platformDir, '.mp4');
          const thumbnailName = await findLatestFile(platformDir, '.jpg');
          const metadataName = await findLatestFile(platformDir, '.json');
          
          const videoPath = videoName ? join(platformDir, videoName) : null;
          const thumbnailPath = thumbnailName ? join(platformDir, thumbnailName) : null;
          const metadataPath = metadataName ? join(platformDir, metadataName) : null;
          
          // Read metadata file if it exists
          const metadata = metadataPath ? await readMetadataFile(metadataPath) : null;
          
          if (videoPath || thumbnailPath) {
            fileSystemResults.push({
              id: `${jobId}-${platform}`,
              platform: platform,
              videoPath: convertToApiUrl(videoPath),
              thumbnailPath: convertToApiUrl(thumbnailPath),
              duration: metadata?.duration || 60,
              startTimestamp: metadata?.timestamp || 0,
              createdAt: new Date().toISOString(),
              metadata: {
                creatives: metadata?.creatives ? {
                  headline: metadata.creatives.headline || "Generated Content",
                  description: metadata.creatives.description || "Automatically generated content",
                  callToAction: metadata.creatives.call_to_action || metadata.creatives.callToAction || "Watch Now"
                } : {
                  headline: "Generated Content",
                  description: "Automatically generated content",
                  callToAction: "Watch Now"
                },
                engagement_prediction: metadata?.engagement_prediction || {
                  predicted_engagement: 75,
                  engagement_level: "High"
                }
              }
            });
          }
        }
      }
      
      // If we found files, return them
      if (fileSystemResults.length > 0) {
        return NextResponse.json({
          job: {
            id: job.id,
            status: job.status,
            progress: job.progress || 100,
            createdAt: job.createdAt,
            completedAt: job.completedAt || new Date().toISOString(),
          },
          user: job.user,
          results: fileSystemResults
        });
      }
      
      // Fall back to summary report if it exists
      const summaryPath = join(outputDir, 'summary_report.json');
      if (existsSync(summaryPath)) {
        try {
          const summaryData = JSON.parse(await readFile(summaryPath, 'utf8'));
          const resultsFromSummary = [];
          
          for (const platform in summaryData.created_content) {
            const content = summaryData.created_content[platform];
            
            const videoPath = join(outputDir, platform, content.video_file);
            const thumbnailPath = join(outputDir, platform, content.thumbnail_file);
            
            resultsFromSummary.push({
              id: `${jobId}-${platform}`,
              platform: platform,
              videoPath: convertToApiUrl(videoPath),
              thumbnailPath: convertToApiUrl(thumbnailPath),
              duration: 60, // Default
              startTimestamp: 0,
              createdAt: new Date().toISOString(),
              metadata: {
                creatives: {
                  headline: "Generated Content",
                  description: "Automatically generated content",
                  callToAction: "Watch Now"
                },
                engagement_prediction: {
                  predicted_engagement: content.predicted_engagement || 75,
                  engagement_level: content.engagement_level || "High"
                }
              }
            });
          }
          
          if (resultsFromSummary.length > 0) {
            return NextResponse.json({
              job: {
                id: job.id,
                status: job.status,
                progress: job.progress || 100,
                createdAt: job.createdAt,
                completedAt: job.completedAt || new Date().toISOString(),
              },
              user: job.user,
              results: resultsFromSummary
            });
          }
        } catch (error) {
          console.error('Error reading summary report:', error);
        }
      }
    }
    
    // If we have contents in the database, process them
    const results = job.contents.map(content => ({
      id: content.id,
      platform: content.platform,
      videoPath: convertToApiUrl(content.videoPath),
      thumbnailPath: convertToApiUrl(content.thumbnailPath),
      duration: content.duration,
      startTimestamp: content.startTimestamp,
      createdAt: content.createdAt,
      metadata: {
        creatives: content.creatives || null,
        engagement_prediction: content.metrics ? {
          predicted_engagement: content.metrics.predictedEngagement,
          engagement_level: content.metrics.engagementLevel,
        } : null
      }
    }));
    
    return NextResponse.json({
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
      },
      user: job.user,
      results
    });
    
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}