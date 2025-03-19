"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ArrowLeft,
  Download,
  Eye,
  Share2,
  Copy,
  Info,
  BarChart2,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  MessageSquare,
} from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

// Express server URL for serving videos
const VIDEO_SERVER_URL = "http://localhost:3002"

// More comprehensive interface for creatives
interface Creative {
  headline: string
  description: string
  call_to_action?: string
  callToAction?: string // Support both naming conventions
  video_snippets?: string[]
}

// Updated engagement prediction interface
interface EngagementPrediction {
  predicted_engagement: number
  engagement_level: string
  suggestions?: string[]
}

// Add transcript interface
interface Transcript {
  text: string
  length: number
}

// Add insights interface
interface Insights {
  key_themes?: string[]
  high_impact_moments?: string[]
  audience_engagement_points?: string[]
  content_performance_predictions?: string[]
}

interface ContentMetadata {
  platform?: string
  timestamp?: number
  duration?: number
  aspect_ratio?: string
  video_file?: string
  thumbnail_file?: string
  creatives?: Creative
  engagement_prediction?: EngagementPrediction
  insights?: Insights
  job_id?: string
}

interface Content {
  id: string
  platform: string
  videoPath: string
  thumbnailPath: string
  duration: number
  startTimestamp: number
  createdAt: string
  metadata: {
    creatives: Creative | null
    engagement_prediction: EngagementPrediction | null
    platform?: string
    timestamp?: number
    duration?: number
    aspect_ratio?: string
    insights?: Insights
    video_file?: string
  }
}

interface ResultsData {
  job: {
    id: string
    status: string
    progress: number
    createdAt: string
    completedAt: string
  }
  user: {
    id: string
    name: string
    email: string
  } | null
  results: Content[]
  insights?: Insights
  transcript?: string
  processingLog?: string
}

// Function to extract filename from path
function getFilenameFromPath(path: string | null): string | null {
  if (!path) return null
  const parts = path.split("/")
  return parts[parts.length - 1]
}

// Function to build Express server video URL
function buildVideoUrl(jobId: string, platform: string, filename: string | null): string | null {
  if (!filename) return null
  return `${VIDEO_SERVER_URL}/videos/${jobId}/outputs/${platform}/${filename}`
}

// Function to format text content for display
function formatContent(content: string | undefined): React.ReactNode {
  if (!content) return <p className="text-muted-foreground italic">No content available</p>

  // Split by numeric markers like "1. Something"
  const parts = content.split(/(\d+\.\s)/g)

  if (parts.length <= 1) {
    // No numeric markers found, return as is
    return <p className="text-sm text-foreground">{content}</p>
  }

  const elements: React.ReactNode[] = []
  let currentListItem = ""
  let inList = false

  parts.forEach((part, index) => {
    if (part.match(/^\d+\.\s$/)) {
      // This is a numeric marker
      if (inList && currentListItem) {
        elements.push(
          <li key={`item-${index - 1}`} className="ml-4 mb-2">
            {currentListItem}
          </li>,
        )
      } else if (!inList) {
        inList = true
        elements.push(<ul key={`list-${index}`} className="list-disc pl-5 py-2 space-y-1"></ul>)
      }
      currentListItem = part
    } else if (inList) {
      // Continuation of a list item
      currentListItem += part
      elements.push(
        <li key={`item-${index}`} className="ml-4 mb-2">
          {currentListItem}
        </li>,
      )
      currentListItem = ""
    } else {
      // Regular text
      if (part.trim()) {
        elements.push(
          <p key={`text-${index}`} className="text-sm text-foreground mb-2">
            {part}
          </p>,
        )
      }
    }
  })

  // Add any remaining list item
  if (inList && currentListItem) {
    elements.push(
      <li key="item-final" className="ml-4 mb-2">
        {currentListItem}
      </li>,
    )
  }

  return <div className="space-y-1">{elements}</div>
}

export default function ResultsPage({
  params,
}: {
  params: { jobId: string }
}) {
  const [resultsData, setResultsData] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [processingLog, setProcessingLog] = useState<string>("")
  const router = useRouter()

  // Fetch results data
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/results/${params.jobId}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch results: ${response.status}`)
        }

        const data = await response.json()

        // Enhance results with additional metadata from JSON files
        const enhancedResults = await Promise.all(
          data.results.map(async (content: Content) => {
            try {
              // Construct the metadata file URL
              const metadataFilename = content.metadata.video_file?.replace(".mp4", ".json")
              if (metadataFilename) {
                const metadataResponse = await fetch(
                  `${VIDEO_SERVER_URL}/videos/${params.jobId}/outputs/${content.platform}/${metadataFilename}`,
                )

                if (metadataResponse.ok) {
                  const metadataFile = await metadataResponse.json()

                  // Merge fetched metadata with existing metadata
                  return {
                    ...content,
                    metadata: {
                      ...content.metadata,
                      creatives: metadataFile.creatives || content.metadata.creatives,
                      engagement_prediction:
                        metadataFile.engagement_prediction || content.metadata.engagement_prediction,
                      platform: metadataFile.platform || content.metadata.platform,
                      timestamp: metadataFile.timestamp || content.metadata.timestamp,
                      duration: metadataFile.duration || content.metadata.duration,
                      aspect_ratio: metadataFile.aspect_ratio || content.metadata.aspect_ratio,
                      insights: metadataFile.insights || content.metadata.insights,
                    },
                  }
                }
              }
            } catch (metadataError) {
              console.warn(`Could not fetch metadata for ${content.platform}:`, metadataError)
            }
            return content
          }),
        )

        // Update results with enhanced data
        data.results = enhancedResults

        // Fetch processing log
        try {
          const logResponse = await fetch(`/api/logs/${params.jobId}`)
          if (logResponse.ok) {
            const logData = await logResponse.text()
            setProcessingLog(logData)
          }
        } catch (logError) {
          console.warn("Could not fetch processing log:", logError)
        }

        setResultsData(data)
      } catch (err) {
        console.error("Error fetching results:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [params.jobId])

  // Copy URL to clipboard
  const copyToClipboard = (url: string, type: string) => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(type)
        setTimeout(() => setCopied(null), 2000)
      })
      .catch((err) => {
        console.error("Failed to copy:", err)
      })
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Debug function - get list of files for job
  const checkFilesOnServer = async () => {
    try {
      const response = await fetch(`${VIDEO_SERVER_URL}/list/${params.jobId}`)
      const data = await response.json()
      console.log("Files available on server:", data)
      alert("Check console for file list")
    } catch (err) {
      console.error("Error checking files:", err)
      alert("Error checking files. See console.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Content Results</h1>
          </div>

          <Card className="mb-8 border shadow-sm">
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-xl">Job Summary</CardTitle>
              <CardDescription>Loading job information...</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[400px] w-full rounded-lg" />
          </div>

          <div className="flex justify-center mt-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading your content...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !resultsData) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Results</AlertTitle>
            <AlertDescription>{error || "Failed to load results data"}</AlertDescription>
          </Alert>

          <div className="flex justify-between gap-4 mt-6">
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              className="flex items-center gap-2 w-full"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Button>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Content Results</h1>
            <p className="text-muted-foreground mt-1">View and download your processed content</p>
          </div>
          <div className="flex gap-2 self-end sm:self-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={checkFilesOnServer} variant="outline" size="sm" className="flex items-center gap-2">
                    <Info size={14} />
                    <span className="hidden md:inline">Check Files</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Check available files on server</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft size={14} />
              <span className="hidden md:inline">Back to Dashboard</span>
              <span className="inline md:hidden">Back</span>
            </Button>
          </div>
        </div>

        <Card className="mb-8 border shadow-sm">
          <CardHeader className="bg-muted/50 border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              <CheckCircle className="h-5 w-5 text-primary" />
              Job Summary
            </CardTitle>
            <CardDescription>Job completed on {formatDate(resultsData.job.completedAt)}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Job ID</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm bg-muted px-2 py-1 rounded text-foreground truncate max-w-[180px]">
                    {resultsData.job.id}
                  </p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(resultsData.job.id, "jobId")}
                        >
                          <Copy size={14} className="text-muted-foreground" />
                          <span className="sr-only">Copy Job ID</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{copied === "jobId" ? "Copied!" : "Copy Job ID"}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                  {resultsData.job.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Completed</p>
                <p className="text-foreground">{formatDate(resultsData.job.completedAt)}</p>
              </div>
            </div>

            {/* Global insights and processing log section */}
            {(resultsData.insights || processingLog) && (
              <div className="mt-8">
                <Accordion type="single" collapsible className="w-full">
                  {resultsData.insights && (
                    <AccordionItem value="insights">
                      <AccordionTrigger className="text-primary hover:text-primary/80 font-medium">
                        <div className="flex items-center gap-2">
                          <BarChart2 size={16} />
                          Content Insights
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="bg-card p-4 rounded-md border mt-2 data-[state=open]:animate-accordion-down">
                        <div className="space-y-4">
                          {resultsData.insights.key_themes && (
                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-2">Key Themes</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                {resultsData.insights.key_themes.map((theme, i) => (
                                  <li key={i} className="text-sm text-foreground">
                                    {theme}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {resultsData.insights.high_impact_moments && (
                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-2">High-Impact Moments</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                {resultsData.insights.high_impact_moments.map((moment, i) => (
                                  <li key={i} className="text-sm text-foreground">
                                    {moment}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {resultsData.insights.audience_engagement_points && (
                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-2">Audience Engagement Points</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                {resultsData.insights.audience_engagement_points.map((point, i) => (
                                  <li key={i} className="text-sm text-foreground">
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {resultsData.insights.content_performance_predictions && (
                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-2">
                                Content Performance Predictions
                              </h4>
                              <ul className="list-disc pl-5 space-y-1">
                                {resultsData.insights.content_performance_predictions.map((prediction, i) => (
                                  <li key={i} className="text-sm text-foreground">
                                    {prediction}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  <AccordionItem value="processing-log">
                    <AccordionTrigger className="text-primary hover:text-primary/80 font-medium">
                      <div className="flex items-center gap-2">
                        <Info size={16} />
                        Processing Log
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="bg-card rounded-md border mt-2 data-[state=open]:animate-accordion-down">
                      <div className="max-h-96 overflow-auto p-4">
                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                          {processingLog || "No processing log available"}
                        </pre>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="youtube_shorts" className="w-full">
          <TabsList className="mb-6 bg-card border rounded-lg p-1 gap-2 flex flex-wrap">
            {["youtube_shorts", "youtube_ads", "display_ads", "performance_max"].map((platform) => {
              const hasContent = resultsData.results.some((r) => r.platform === platform)
              return (
                <TabsTrigger
                  key={platform}
                  value={platform}
                  className={`rounded-md ${!hasContent && "opacity-50"}`}
                  disabled={!hasContent}
                >
                  <div className="flex items-center gap-2">
                    <span className="capitalize">{platform.replace(/_/g, " ")}</span>
                    {hasContent && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                  </div>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {["youtube_shorts", "youtube_ads", "display_ads", "performance_max"].map((platform) => {
            const content = resultsData.results.find((r) => r.platform === platform)
            const platformName = platform.replace(/_/g, " ")

            // Get filenames from paths
            const videoFilename = content ? getFilenameFromPath(content.videoPath) : null
            const thumbnailFilename = content ? getFilenameFromPath(content.thumbnailPath) : null

            // Build direct URLs to Express server
            const videoUrl = videoFilename ? buildVideoUrl(params.jobId, platform, videoFilename) : null
            const thumbnailUrl = thumbnailFilename ? buildVideoUrl(params.jobId, platform, thumbnailFilename) : null

            console.log(`[${platform}] Video URL:`, videoUrl)
            console.log(`[${platform}] Thumbnail URL:`, thumbnailUrl)

            return (
              <TabsContent value={platform} key={platform} className="animate-in fade-in-50 duration-300">
                {content ? (
                  <Card className="border shadow-sm overflow-hidden">
                    <CardHeader className="border-b bg-muted/50 py-4">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                        <div>
                          <CardTitle className="capitalize text-xl flex items-center gap-2">
                            {platform === "youtube_shorts" && <MessageSquare className="h-5 w-5 text-primary" />}
                            {platform === "youtube_ads" && <Eye className="h-5 w-5 text-primary" />}
                            {platform === "display_ads" && <BarChart2 className="h-5 w-5 text-primary" />}
                            {platform === "performance_max" && <Share2 className="h-5 w-5 text-primary" />}
                            {platformName}
                          </CardTitle>
                          <CardDescription>
                            {content.duration} seconds • Created {new Date(content.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        {content.metadata.engagement_prediction && (
                          <Badge
                            className={`px-3 py-1 ${
                              content.metadata.engagement_prediction.engagement_level === "High"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : content.metadata.engagement_prediction.engagement_level === "Medium"
                                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                  : "bg-blue-100 text-blue-800 border-blue-200"
                            }`}
                          >
                            {content.metadata.engagement_prediction.engagement_level} Engagement
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-3">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                              <Eye size={18} className="text-primary" />
                              Video Preview
                            </h3>

                            {content.metadata.timestamp && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Calendar size={12} />
                                <span>Timestamp: {content.metadata.timestamp.toFixed(2)}s</span>
                              </Badge>
                            )}
                          </div>

                          <div className="bg-black rounded-lg overflow-hidden mb-6 shadow-md">
                            {videoUrl ? (
                              <video
                                src={videoUrl}
                                controls
                                className="w-full h-full"
                                poster={thumbnailUrl || undefined}
                                style={{
                                  aspectRatio:
                                    platform === "youtube_shorts"
                                      ? "9/16"
                                      : platform === "display_ads"
                                        ? "1/1"
                                        : "16/9",
                                }}
                              />
                            ) : (
                              <div
                                className="flex items-center justify-center bg-gray-800 text-white p-8"
                                style={{
                                  aspectRatio:
                                    platform === "youtube_shorts"
                                      ? "9/16"
                                      : platform === "display_ads"
                                        ? "1/1"
                                        : "16/9",
                                }}
                              >
                                Video not available
                              </div>
                            )}
                          </div>

                          {/* Thumbnail preview */}
                          {thumbnailUrl && (
                            <div className="mb-6">
                              <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                <Calendar size={14} className="text-primary" />
                                Thumbnail
                              </h3>
                              <div className="bg-black rounded-lg overflow-hidden shadow-sm border">
                                <img
                                  src={thumbnailUrl || "/placeholder.svg"}
                                  alt="Video thumbnail"
                                  className="w-full h-auto"
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-3">
                            {videoUrl && (
                              <Button variant="outline" size="sm" className="flex items-center gap-2" asChild>
                                <a href={videoUrl} download>
                                  <Download size={14} />
                                  Download Video
                                </a>
                              </Button>
                            )}
                            {thumbnailUrl && (
                              <Button variant="outline" size="sm" className="flex items-center gap-2" asChild>
                                <a href={thumbnailUrl} download>
                                  <Download size={14} />
                                  Download Thumbnail
                                </a>
                              </Button>
                            )}
                            {videoUrl && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex items-center gap-2"
                                      onClick={() => copyToClipboard(videoUrl, "videoUrl")}
                                    >
                                      <Share2 size={14} />
                                      Copy Video URL
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {copied === "videoUrl" ? "Copied!" : "Copy URL to clipboard"}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>

                        <div className="lg:col-span-2">
                          <Accordion type="multiple" defaultValue={["creatives", "engagement"]} className="space-y-4">
                            {/* Ad Creatives Section */}
                            {content.metadata.creatives && (
                              <AccordionItem value="creatives" className="border rounded-lg overflow-hidden">
                                <AccordionTrigger className="px-4 py-3 bg-muted/50 hover:bg-muted border-b">
                                  <div className="flex items-center gap-2 text-foreground font-medium">
                                    <Info size={16} className="text-primary" />
                                    Ad Creatives
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 bg-card data-[state=open]:animate-accordion-down">
                                  <div className="space-y-4">
                                    <div>
                                      <p className="text-xs font-medium text-muted-foreground mb-1">Headline</p>
                                      <p className="text-sm bg-muted p-2 rounded text-foreground">
                                        {content.metadata.creatives.headline}
                                      </p>
                                    </div>

                                    {content.metadata.creatives.description && (
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                                        <p className="text-sm bg-muted p-2 rounded text-foreground">
                                          {content.metadata.creatives.description}
                                        </p>
                                      </div>
                                    )}

                                    {(content.metadata.creatives.call_to_action ||
                                      content.metadata.creatives.callToAction) && (
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Call to Action</p>
                                        <p className="text-sm bg-muted p-2 rounded text-foreground">
                                          {content.metadata.creatives.call_to_action ||
                                            content.metadata.creatives.callToAction}
                                        </p>
                                      </div>
                                    )}

                                    {content.metadata.creatives.video_snippets && (
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                          Key Video Snippets
                                        </p>
                                        <ul className="list-disc pl-5 space-y-1">
                                          {content.metadata.creatives.video_snippets.map((snippet, i) => (
                                            <li key={i} className="text-sm bg-muted p-2 rounded text-foreground">
                                              {snippet}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            )}

                            {/* Engagement Prediction Section */}
                            {content.metadata.engagement_prediction && (
                              <AccordionItem value="engagement" className="border rounded-lg overflow-hidden">
                                <AccordionTrigger className="px-4 py-3 bg-muted/50 hover:bg-muted border-b">
                                  <div className="flex items-center gap-2 text-foreground font-medium">
                                    <BarChart2 size={16} className="text-primary" />
                                    Engagement Prediction
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 bg-card data-[state=open]:animate-accordion-down">
                                  <div className="px-4 py-3 bg-muted rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-sm text-muted-foreground">Predicted Score</span>
                                      <span className="font-bold text-foreground">
                                        {content.metadata.engagement_prediction.predicted_engagement.toFixed(1)}
                                      </span>
                                    </div>
                                    <Progress
                                      value={Math.min(100, content.metadata.engagement_prediction.predicted_engagement)}
                                      className="h-2.5 mb-3"
                                      color={
                                        content.metadata.engagement_prediction.engagement_level === "High"
                                          ? "bg-green-500"
                                          : content.metadata.engagement_prediction.engagement_level === "Medium"
                                            ? "bg-yellow-500"
                                            : "bg-blue-500"
                                      }
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                      <span>0</span>
                                      <span>25</span>
                                      <span>50</span>
                                      <span>75</span>
                                      <span>100</span>
                                    </div>
                                    <p className="mt-3 text-sm text-center text-foreground">
                                      <span
                                        className={`font-medium ${
                                          content.metadata.engagement_prediction.engagement_level === "High"
                                            ? "text-green-600"
                                            : content.metadata.engagement_prediction.engagement_level === "Medium"
                                              ? "text-yellow-600"
                                              : "text-blue-600"
                                        }`}
                                      >
                                        {content.metadata.engagement_prediction.engagement_level}
                                      </span>{" "}
                                      engagement level
                                    </p>

                                    {content.metadata.engagement_prediction.suggestions && (
                                      <div className="mt-4">
                                        <h4 className="text-sm font-semibold text-foreground mb-2">
                                          Improvement Suggestions
                                        </h4>
                                        <ul className="list-disc pl-5 space-y-1">
                                          {content.metadata.engagement_prediction.suggestions.map((suggestion, i) => (
                                            <li key={i} className="text-sm text-foreground">
                                              {suggestion}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            )}

                            {/* Metadata Section */}
                            <AccordionItem value="metadata" className="border rounded-lg overflow-hidden">
                              <AccordionTrigger className="px-4 py-3 bg-muted/50 hover:bg-muted border-b">
                                <div className="flex items-center gap-2 text-foreground font-medium">
                                  <Info size={16} className="text-primary" />
                                  Technical Details
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="p-4 bg-card data-[state=open]:animate-accordion-down">
                                <div className="space-y-3">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Format</span>
                                    <span className="font-medium text-foreground capitalize">{platformName}</span>
                                  </div>

                                  {content.metadata.aspect_ratio && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Aspect Ratio</span>
                                      <span className="font-medium text-foreground">
                                        {content.metadata.aspect_ratio}
                                      </span>
                                    </div>
                                  )}

                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Duration</span>
                                    <span className="font-medium text-foreground">
                                      {content.metadata.duration || content.duration}s
                                    </span>
                                  </div>

                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Video</span>
                                    <span className="font-medium text-foreground font-mono text-xs truncate max-w-[180px]">
                                      {videoFilename || "N/A"}
                                    </span>
                                  </div>

                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Thumbnail</span>
                                    <span className="font-medium text-foreground font-mono text-xs truncate max-w-[180px]">
                                      {thumbnailFilename || "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>

                            {/* Platform-specific insights, if available */}
                            {content.metadata.insights && (
                              <AccordionItem value="platform-insights" className="border rounded-lg overflow-hidden">
                                <AccordionTrigger className="px-4 py-3 bg-muted/50 hover:bg-muted border-b">
                                  <div className="flex items-center gap-2 text-foreground font-medium">
                                    <BarChart2 size={16} className="text-primary" />
                                    Platform Insights
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 bg-card data-[state=open]:animate-accordion-down">
                                  <div className="space-y-4">
                                    {content.metadata.insights.key_themes && (
                                      <div>
                                        <h4 className="text-sm font-semibold text-foreground mb-2">Key Themes</h4>
                                        <ul className="list-disc pl-5 space-y-1">
                                          {content.metadata.insights.key_themes.map((theme, i) => (
                                            <li key={i} className="text-sm text-foreground">
                                              {theme}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {content.metadata.insights.high_impact_moments && (
                                      <div>
                                        <h4 className="text-sm font-semibold text-foreground mb-2">
                                          High-Impact Moments
                                        </h4>
                                        <ul className="list-disc pl-5 space-y-1">
                                          {content.metadata.insights.high_impact_moments.map((moment, i) => (
                                            <li key={i} className="text-sm text-foreground">
                                              {moment}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {content.metadata.insights.audience_engagement_points && (
                                      <div>
                                        <h4 className="text-sm font-semibold text-foreground mb-2">
                                          Audience Engagement Points
                                        </h4>
                                        <ul className="list-disc pl-5 space-y-1">
                                          {content.metadata.insights.audience_engagement_points.map((point, i) => (
                                            <li key={i} className="text-sm text-foreground">
                                              {point}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {content.metadata.insights.content_performance_predictions && (
                                      <div>
                                        <h4 className="text-sm font-semibold text-foreground mb-2">
                                          Content Performance Predictions
                                        </h4>
                                        <ul className="list-disc pl-5 space-y-1">
                                          {content.metadata.insights.content_performance_predictions.map(
                                            (prediction, i) => (
                                              <li key={i} className="text-sm text-foreground">
                                                {prediction}
                                              </li>
                                            ),
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            )}
                          </Accordion>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border shadow-sm">
                    <CardContent className="p-12 text-center">
                      <div className="max-w-md mx-auto">
                        <h3 className="text-xl font-medium text-foreground mb-2">No {platformName} content</h3>
                        <p className="text-muted-foreground mb-6">
                          No content was generated for this platform. Try processing your video with this platform
                          selected.
                        </p>
                        <Button onClick={() => router.push("/")} className="bg-primary hover:bg-primary/90">
                          Upload New Video
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </div>
  )
}

