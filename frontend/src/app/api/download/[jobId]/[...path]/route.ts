// app/api/download/[jobId]/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import fs from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string; path: string[] } }
) {
  try {
    const { jobId, path } = params;
    const filePath = join(process.cwd(), 'jobs', jobId, 'outputs', ...path);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path[path.length - 1];
    
    // Determine content type based on file extension
    const extension = filePath.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (extension === 'mp4') contentType = 'video/mp4';
    else if (extension === 'jpg' || extension === 'jpeg') contentType = 'image/jpeg';
    else if (extension === 'png') contentType = 'image/png';
    else if (extension === 'json') contentType = 'application/json';
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}