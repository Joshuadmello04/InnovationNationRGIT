// app/api/process-video/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const video = formData.get('video') as File
    const userId = formData.get('userId') as string
    const platformsJson = formData.get('platforms') as string
    const platforms = JSON.parse(platformsJson)
    
    if (!video) {
      return NextResponse.json(
        { error: 'No video file provided' }, 
        { status: 400 }
      )
    }

    // Create job directory using a unique ID
    const jobDir = join(process.cwd(), 'jobs')
    await mkdir(jobDir, { recursive: true })
    
    // Save the video file
    const originalName = video.name
    const videoPath = join(jobDir, originalName)
    const bytes = await video.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(videoPath, buffer)
    
    // Create job record in the database
    const job = await prisma.job.create({
      data: {
        userId: userId,
        originalVideoName: originalName,
        originalVideoPath: videoPath,
        status: 'QUEUED',
      }
    })
    
    // Create output directory for this specific job
    const outputDir = join(jobDir, 'outputs', job.id)
    await mkdir(outputDir, { recursive: true })
    
    // Start the Python process
    const platformsArg = platforms.join(' ')
    const command = `cd ../backend && python enhanced_app.py ${videoPath} --platforms ${platformsArg} --output ${outputDir} --job_id ${job.id}`
    
    // Update job status to PROCESSING and record start time
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
      }
    })
    
    // Execute the command asynchronously
    exec(command, async (error, stdout) => {
      if (error) {
        console.error(`Execution error: ${error}`)
        
        // Update job status to FAILED on error
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            error: error.message,
          }
        })
        return
      }
      
      console.log(`Python output: ${stdout}`)
    })
    
    return NextResponse.json({ 
      success: true,
      jobId: job.id,
      message: 'Video processing started'
    })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Failed to process video' }, 
      { status: 500 }
    )
  }
}