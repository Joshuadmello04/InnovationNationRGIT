// app/processing/[jobId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import ProcessingStatus from '@/components/video/ProcessingStatus';

export default function ProcessingPage({ params }: { params: { jobId: string } }) {
  const [status, setStatus] = useState('PROCESSING');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { jobId } = params;

  useEffect(() => {
    // Poll for job status updates
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch job status');
        }
        
        const data = await response.json();
        
        setStatus(data.job.status);
        setProgress(data.job.progress);
        
        // Redirect to results page when job is completed
        if (data.job.status === 'COMPLETED') {
          router.push(`/results/${jobId}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };
    
    // First check
    checkStatus();
    
    // Set up polling
    const intervalId = setInterval(checkStatus, 5000);
    
    // Clean up interval
    return () => clearInterval(intervalId);
  }, [jobId, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Processing Your Video</h1>
          <p className="mt-2 text-gray-600">
            Please wait while we analyze and convert your video.
          </p>
        </div>
        
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-md mb-8">
            <p className="font-medium">Error</p>
            <p>{error}</p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="mt-2 text-sm font-medium text-red-700 hover:text-red-900"
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          <ProcessingStatus status={status} progress={progress} />
        )}
      </main>
    </div>
  );
}