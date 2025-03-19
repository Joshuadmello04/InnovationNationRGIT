// app/api/static/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';

// This route serves static files from the jobs directory
export async function GET(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  try {
    // Get the path segments from context directly
    const pathSegments = context.params.path;
    
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Construct the file path
    // Base path is the jobs directory inside your project
    const basePath = join(process.cwd(), 'jobs');
    const filePath = join(basePath, ...pathSegments);

    // Safety check to prevent directory traversal
    if (!filePath.startsWith(basePath)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Check if the file exists
    if (!existsSync(filePath)) {
      return new NextResponse('Not Found', { status: 404 });
    }

    try {
      const stats = await stat(filePath);
      if (!stats.isFile()) {
        return new NextResponse('Not Found', { status: 404 });
      }
    } catch (error) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Read the file
    const file = await readFile(filePath);

    // Determine content type
    let contentType = 'application/octet-stream'; // Default
    
    if (filePath.endsWith('.mp4')) {
      contentType = 'video/mp4';
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (filePath.endsWith('.png')) {
      contentType = 'image/png';
    } else if (filePath.endsWith('.json')) {
      contentType = 'application/json';
    }

    // Return the file with appropriate headers
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${pathSegments[pathSegments.length - 1]}"`,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error serving static file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}