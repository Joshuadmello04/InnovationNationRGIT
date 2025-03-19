"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/Header"
import ProcessingStatus from "@/components/video/ProcessingStatus"
import { ArrowLeft, AlertCircle } from "lucide-react"

export default function ProcessingPage({ params }: { params: { jobId: string } }) {
  const [status, setStatus] = useState("PROCESSING")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { jobId } = params

  useEffect(() => {
    // Poll for job status updates
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch job status")
        }

        const data = await response.json()

        setStatus(data.job.status)
        setProgress(data.job.progress)

        // Redirect to results page when job is completed
        if (data.job.status === "COMPLETED") {
          router.push(`/results/${jobId}`)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      }
    }

    // First check
    checkStatus()

    // Set up polling
    const intervalId = setInterval(checkStatus, 5000)

    // Clean up interval
    return () => clearInterval(intervalId)
  }, [jobId, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-8 sm:px-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Processing Your Video</h1>
            <p className="mt-3 text-gray-600 max-w-xl mx-auto">
              Please wait while we analyze and convert your video. This process typically takes a few minutes depending
              on the file size.
            </p>
          </div>

          {error ? (
            <div className="border-t border-gray-200 bg-red-50 px-6 py-8 sm:px-8">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-red-800">Processing Error</h3>
                <p className="mt-2 text-red-700">{error}</p>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="mt-6 inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-200 px-6 py-8 sm:px-8">
              <div className="flex flex-col items-center">
                {/* Processing animation */}
                <div className="relative h-32 w-32 mb-6">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-full w-full rounded-full border-t-2 border-b-2 border-primary animate-spin"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-semibold text-primary">{Math.round(progress)}%</span>
                  </div>
                </div>

                <ProcessingStatus status={status} progress={progress} />

                <div className="w-full max-w-md mt-8">
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200">
                      <div
                        style={{ width: `${progress}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500 ease-in-out"
                      ></div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    {status === "PROCESSING"
                      ? "Your video is being processed. Please don't close this page."
                      : status === "QUEUED"
                        ? "Your video is in the queue and will be processed shortly."
                        : "Finalizing your video..."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

