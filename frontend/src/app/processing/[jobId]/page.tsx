"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/Header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, AlertCircle, Loader2, CheckCircle, Clock } from "lucide-react"

// Improved ProcessingStatus component
function ProcessingStatus({ status, progress }: { status: string; progress: number }) {
  return (
    <Card className="w-full border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          {status === "PROCESSING" && <Loader2 className="h-5 w-5 text-primary animate-spin" />}
          {status === "COMPLETED" && <CheckCircle className="h-5 w-5 text-green-500" />}
          {status === "FAILED" && <AlertCircle className="h-5 w-5 text-destructive" />}
          {status === "QUEUED" && <Clock className="h-5 w-5 text-amber-500" />}
          Processing Status
        </CardTitle>
        <CardDescription>
          {status === "PROCESSING"
            ? "Your video is being processed"
            : status === "COMPLETED"
              ? "Processing complete!"
              : status === "FAILED"
                ? "Processing failed"
                : "Waiting to start processing"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center justify-center">
          {status === "PROCESSING" && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-full">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Processing in progress</span>
            </div>
          )}
          {status === "COMPLETED" && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-full">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Processing complete</span>
            </div>
          )}
          {status === "FAILED" && (
            <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-3 py-2 rounded-full">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Processing failed</span>
            </div>
          )}
          {status === "QUEUED" && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-full">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Waiting in queue</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-6">
        <p className="text-sm text-center text-muted-foreground max-w-md">
          {status === "PROCESSING"
            ? "This may take a few minutes depending on the length and complexity of your video. Please don't close this window."
            : status === "COMPLETED"
              ? "Your video has been successfully processed and is ready to view."
              : status === "FAILED"
                ? "There was an issue processing your video. Please try again or contact support."
                : "Your video is in the processing queue and will begin shortly."}
        </p>
      </CardFooter>
    </Card>
  )
}

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
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Processing Your Video</h1>
          <p className="mt-2 text-muted-foreground">Please wait while we analyze and convert your video.</p>
        </div>

        {error ? (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              <div className="mt-4">
                <Button variant="outline" onClick={() => router.push("/dashboard")} className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Return to Dashboard
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="animate-in fade-in-50 duration-300">
            <ProcessingStatus status={status} progress={progress} />

            <div className="mt-8 flex justify-center">
              <Button variant="outline" onClick={() => router.push("/dashboard")} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

