// app/api/process-video/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readdir } from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const video = formData.get('video') as File
    const platformsJson = formData.get('platforms') as string
    const platforms = JSON.parse(platformsJson)
    
    if (!video) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      )
    }

    // Create job directory structure
    const jobsDir = join(process.cwd(), 'jobs')
    await mkdir(jobsDir, { recursive: true })
    
    // Save the video file temporarily
    const videoPath = join(jobsDir, video.name)
    const bytes = await video.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(videoPath, buffer)
    
    // Create job record WITHOUT a user ID
    const job = await prisma.job.create({
      data: {
        // Now that userId is optional, we can create a job without it
        originalVideoName: video.name,
        originalVideoPath: videoPath,
        status: 'QUEUED',
      }
    })
    
    // Create job-specific output directory
    const jobDir = join(jobsDir, job.id)
    await mkdir(jobDir, { recursive: true })
    
    const outputDir = join(jobDir, 'outputs')
    await mkdir(outputDir, { recursive: true })
    
    // Start the Python process
    const platformsArg = platforms.join(' ')
    const command = `cd ../backend && python enhanced_app.py "${videoPath}" --platforms ${platformsArg} --output "${outputDir}" --job_id ${job.id}`
    
    console.log(`Executing command: ${command}`)
    
    // Update job status to PROCESSING
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
        progress: 10
      }
    })
    
    // Execute the command asynchronously
    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Execution error: ${error}`)
        console.error(`stderr: ${stderr}`)
        
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
      
      // Check if the outputs directory contains files
      try {
        const outputFiles = await readdir(outputDir)
        
        if (outputFiles.length > 0) {
          // Success - update job as completed
          await prisma.job.update({
            where: { id: job.id },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
              progress: 100
            }
          })
          
          // Here you would typically parse the output and create Content records
          // This would depend on what your Python script outputs
          console.log(`Processing complete. Output files: ${outputFiles.join(', ')}`)
        } else {
          // No output files found - mark as failed
          await prisma.job.update({
            where: { id: job.id },
            data: {
              status: 'FAILED',
              error: 'No output files were generated',
            }
          })
        }
      } catch (error: unknown) {
        // Properly type the error
        const fsError = error instanceof Error ? error : new Error(String(error))
        console.error(`Error checking output directory: ${fsError.message}`)
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            error: `Error checking output: ${fsError.message}`,
          }
        })
      }
    })
    
    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Video processing started'
    })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Failed to process video', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}