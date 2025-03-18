// app/api/results/[jobId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const jobId = params.jobId
  
  try {
    // Fetch job with all associated content
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
    })
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' }, 
        { status: 404 }
      )
    }
    
    // Format the response with all job details
    const results = job.contents.map(content => ({
      id: content.id,
      platform: content.platform,
      videoPath: content.videoPath,
      thumbnailPath: content.thumbnailPath,
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
    }))
    
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
    })
    
  } catch (error) {
    console.error('Error fetching results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch results' }, 
      { status: 500 }
    )
  }
}