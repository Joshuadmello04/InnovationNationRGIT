"use client"

import { useEffect, useState } from "react"
import Header from "@/components/layout/Header"
import JobsList from "@/components/dashboard/JobsList"
import VideoUploadForm from "@/components/video/VideoUploadForm"
import type { Job } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Clock, CheckCircle } from "lucide-react"

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/jobs")

      if (!response.ok) {
        throw new Error("Failed to fetch jobs")
      }

      const data = await response.json()
      setJobs(data.jobs)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const handleJobCreated = (newJob: Job) => {
    setJobs((prevJobs) => [newJob, ...prevJobs])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Upload videos and manage your content transformations</p>
          </div>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full md:w-auto grid-cols-2 md:inline-flex">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload size={16} />
              <span>Upload</span>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Clock size={16} />
              <span>Jobs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Upload New Video
                </CardTitle>
                <CardDescription>
                  Upload a video to transform it into multiple formats optimized for different platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VideoUploadForm onJobCreated={handleJobCreated} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Your Jobs
                </CardTitle>
                <CardDescription>View and manage all your video processing jobs</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : error ? (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
                    {error}
                  </div>
                ) : jobs.length > 0 ? (
                  <JobsList jobs={jobs} />
                ) : (
                  <div className="text-center p-8 bg-muted rounded-md">
                    <p className="text-muted-foreground mb-4">No jobs found. Upload your first video to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

