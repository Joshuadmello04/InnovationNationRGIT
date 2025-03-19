// app/api/jobs/[jobId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// The most current Next.js approach for dynamic API routes
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> | { jobId: string } }
) {
  // Handle both Promise and non-Promise params formats
  let jobId: string;
  
  try {
    // For latest Next.js where params might be a Promise
    if (context.params instanceof Promise) {
      const resolvedParams = await context.params;
      jobId = resolvedParams.jobId;
    } else {
      // For slightly older Next.js versions
      jobId = context.params.jobId;
    }
    
    // Fetch the job by ID
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        contents: true
      }
    });
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}