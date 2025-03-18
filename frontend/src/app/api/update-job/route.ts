// app/api/update-job/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { JobStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { jobId, status, progress, contents } = data
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' }, 
        { status: 400 }
      )
    }
    
    // Create a properly typed update object
    const jobUpdate: {
      progress?: number;
      status?: JobStatus;
      completedAt?: Date;
    } = {}
    
    // Only add progress if it's defined
    if (progress !== undefined) {
      jobUpdate.progress = progress
    }
    
    // Only add status if it's valid
    if (status) {
      // Validate that status is one of the expected enum values
      if (['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'].includes(status)) {
        jobUpdate.status = status as JobStatus
        
        if (status === 'COMPLETED') {
          jobUpdate.completedAt = new Date()
        }
      }
    }
    
    await prisma.job.update({
      where: { id: jobId },
      data: jobUpdate
    })
    
    // Add contents if provided 
    if (contents && Array.isArray(contents)) {
      for (const content of contents) {
        const { 
          platform, videoPath, thumbnailPath, metadataPath, 
          startTimestamp, duration, creatives 
        } = content
        
        // Extract filenames from paths
        const videoName = videoPath.split('/').pop() || 'video.mp4'
        const thumbnailName = thumbnailPath.split('/').pop() || 'thumbnail.jpg'
        
        // Create content record with proper typing for platform
        const contentRecord = await prisma.content.create({
          data: {
            jobId,
            // Ensure platform is a valid PlatformType enum value
            platform: platform,
            videoName,
            videoPath,
            thumbnailName,
            thumbnailPath,
            metadataPath,
            startTimestamp,
            duration,
            engagement: content.engagement_prediction?.predicted_engagement || 0,
          }
        })
        
        // Add creative texts if available
        if (creatives) {
          await prisma.creativeText.create({
            data: {
              contentId: contentRecord.id,
              headline: creatives.headline,
              description: creatives.description,
              callToAction: creatives.call_to_action
            }
          })
        }
        
        // Add metrics if available
        if (content.engagement_prediction) {
          await prisma.contentMetric.create({
            data: {
              contentId: contentRecord.id,
              predictedEngagement: content.engagement_prediction.predicted_engagement || 0,
              engagementLevel: content.engagement_prediction.engagement_level || 'Medium'
            }
          })
        }
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Job updated successfully'
    })
  } catch (error) {
    console.error('Error updating job:', error)
    return NextResponse.json(
      { error: 'Failed to update job' }, 
      { status: 500 }
    )
  }
}