'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Job } from '@/types'

// Spinner component for loading state
const Spinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
  </div>
)

// Progress Bar Component
const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
    <div 
      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
      style={{ width: `${progress}%` }}
    ></div>
  </div>
)

export default function ProcessingPage({ 
  params 
}: { 
  params: { jobId: string } 
}) {
  const [job, setJob] = useState<Job | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  // Handle the jobId safely using useState to store the value
  const [jobId, setJobId] = useState<string>('')
  
  // Set the jobId once when the component mounts
  useEffect(() => {
    setJobId(params.jobId)
  }, [params])

  // Fetch job status
  const fetchJobStatus = useCallback(async () => {
    if (!jobId) return; // Don't fetch if jobId isn't set yet
    
    try {
      const response = await fetch(`/api/jobs/${jobId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch job status')
      }

      const data = await response.json()
      setJob(data)

      // Redirect to results if job is completed
      if (data.status === 'COMPLETED') {
        router.push(`/results/${jobId}`)
        return
      }

      // Redirect to error page if job failed
      if (data.status === 'FAILED') {
        router.push(`/error/${jobId}`)
        return
      }
    } catch (err) {
      console.error('Error fetching job status:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }, [jobId, router])

  // Set up periodic status checking
  useEffect(() => {
    if (!jobId) return; // Skip if jobId isn't set
    
    // Initial fetch
    fetchJobStatus()

    // Set up interval to check job status every 5 seconds
    const intervalId = setInterval(fetchJobStatus, 5000)

    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [fetchJobStatus, jobId])

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Processing Error</h1>
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => router.push('/')} 
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Return to Upload
        </button>
      </div>
    )
  }

  // Loading state
  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <Spinner />
        <p className="mt-4 text-gray-600">Initializing job...</p>
      </div>
    )
  }

  // Main processing view
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Processing Video</h1>
        
        <div className="mb-4">
          <p className="text-gray-600 mb-2">
            Processing: <span className="font-semibold">{job.originalVideoName}</span>
          </p>
          <ProgressBar progress={job.progress || 0} />
          <p className="text-sm text-gray-500 mt-2 text-center">
            {job.progress || 0}% Complete
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-700">
            Status: <span className="font-semibold capitalize">
              {job.status ? job.status.toLowerCase() : 'Unknown'}
            </span>
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Please do not close this window. Your video is being processed.
          </p>
        </div>
      </div>
    </div>
  )
}