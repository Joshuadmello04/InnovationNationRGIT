// app/api/file/[jobId]/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import fs from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string, path: string[] } }
) {
  try {
    const { jobId, path } = params
    
    // Build the file path based on the job ID and requested path
    const filePath = join(process.cwd(), 'jobs', jobId, 'outputs', ...path)
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }
    
    // Read the file
    const fileBuffer = fs.readFileSync(filePath)
    
    // Determine content type
    const extension = filePath.split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    
    if (extension === 'mp4') contentType = 'video/mp4'
    else if (extension === 'jpg' || extension === 'jpeg') contentType = 'image/jpeg'
    else if (extension === 'png') contentType = 'image/png'
    else if (extension === 'json') contentType = 'application/json'
    
    // Return the file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType
      }
    })
  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    )
  }
}