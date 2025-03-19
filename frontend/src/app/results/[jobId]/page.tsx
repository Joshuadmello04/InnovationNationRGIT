'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, Eye, Share2, Copy } from 'lucide-react'

// Express server URL for serving videos
const VIDEO_SERVER_URL = 'http://localhost:3002';

interface Creative {
  headline: string;
  description: string;
  callToAction: string;
}

interface ContentMetadata {
  creatives: Creative | null;
  engagement_prediction: {
    predicted_engagement: number;
    engagement_level: string;
  } | null;
}

interface Content {
  id: string;
  platform: string;
  videoPath: string;
  thumbnailPath: string;
  duration: number;
  startTimestamp: number;
  createdAt: string;
  metadata: ContentMetadata;
}

interface ResultsData {
  job: {
    id: string;
    status: string;
    progress: number;
    createdAt: string;
    completedAt: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  results: Content[];
}

// Function to extract filename from path
function getFilenameFromPath(path: string | null): string | null {
  if (!path) return null;
  const parts = path.split('/');
  return parts[parts.length - 1];
}

// Function to build Express server video URL
function buildVideoUrl(jobId: string, platform: string, filename: string | null): string | null {
  if (!filename) return null;
  return `${VIDEO_SERVER_URL}/videos/${jobId}/outputs/${platform}/${filename}`;
}

export default function ResultsPage({ 
  params 
}: { 
  params: { jobId: string } 
}) {
  const [resultsData, setResultsData] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const router = useRouter()

  // Store the jobId in state to avoid direct access to params
  const [jobId, setJobId] = useState<string>('')
  
  useEffect(() => {
    setJobId(params.jobId)
  }, [params])

  // Fetch results data
  useEffect(() => {
    if (!jobId) return;

    const fetchResults = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/results/${jobId}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch results: ${response.status}`)
        }

        const data = await response.json()
        console.log("Results data:", data);
        setResultsData(data)
      } catch (err) {
        console.error('Error fetching results:', err)
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [jobId])

  // Copy URL to clipboard
  const copyToClipboard = (url: string, type: string) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopied(type)
        setTimeout(() => setCopied(null), 2000)
      })
      .catch((err) => {
        console.error('Failed to copy:', err)
      })
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Debug function - get list of files for job
  const checkFilesOnServer = async () => {
    try {
      const response = await fetch(`${VIDEO_SERVER_URL}/list/${jobId}`);
      const data = await response.json();
      console.log('Files available on server:', data);
      alert('Check console for file list');
    } catch (err) {
      console.error('Error checking files:', err);
      alert('Error checking files. See console.');
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mb-4"></div>
        <p className="text-gray-500">Loading your content...</p>
      </div>
    )
  }

  if (error || !resultsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4">
        <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6 border-l-4 border-red-500">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Results</h1>
          <p className="text-red-500 mb-6">{error || 'Failed to load results data'}</p>
          <div className="flex justify-between">
            <Button 
              onClick={() => router.push('/dashboard')} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Content Results</h1>
          <div className="flex gap-2">
            <Button 
              onClick={checkFilesOnServer}
              variant="outline"
              className="flex items-center gap-2"
            >
              Check Files
            </Button>
            <Button 
              onClick={() => router.push('/dashboard')} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Button>
          </div>
        </div>

        <Card className="mb-8 border border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-xl text-gray-800">Job Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Job ID</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-800 truncate max-w-[180px]">
                    {resultsData.job.id}
                  </p>
                  <button 
                    onClick={() => copyToClipboard(resultsData.job.id, 'jobId')}
                    className="text-gray-500 hover:text-gray-700"
                    title="Copy Job ID"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                {copied === 'jobId' && (
                  <p className="text-xs text-green-600 mt-1">Copied!</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  {resultsData.job.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Completed</p>
                <p className="text-gray-800">{formatDate(resultsData.job.completedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="youtube_shorts" className="w-full">
          <TabsList className="mb-6 bg-white border border-gray-200 rounded-lg p-1 gap-2">
            {['youtube_shorts', 'youtube_ads', 'display_ads', 'performance_max'].map(platform => {
              const hasContent = resultsData.results.some(r => r.platform === platform);
              return (
                <TabsTrigger 
                  key={platform} 
                  value={platform}
                  className={`rounded-md ${hasContent ? 'data-[state=active]:bg-blue-500 data-[state=active]:text-white' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="capitalize">{platform.replace(/_/g, ' ')}</span>
                    {hasContent && (
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    )}
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {['youtube_shorts', 'youtube_ads', 'display_ads', 'performance_max'].map(platform => {
            const content = resultsData.results.find(r => r.platform === platform);
            const platformName = platform.replace(/_/g, ' ');
            
            // Get filenames from paths
            const videoFilename = content ? getFilenameFromPath(content.videoPath) : null;
            const thumbnailFilename = content ? getFilenameFromPath(content.thumbnailPath) : null;
            
            // Build direct URLs to Express server
            const videoUrl = videoFilename ? buildVideoUrl(jobId, platform, videoFilename) : null;
            const thumbnailUrl = thumbnailFilename ? buildVideoUrl(jobId, platform, thumbnailFilename) : null;
            
            console.log(`[${platform}] Video URL:`, videoUrl);
            console.log(`[${platform}] Thumbnail URL:`, thumbnailUrl);
            
            return (
              <TabsContent value={platform} key={platform}>
                {content ? (
                  <Card className="border border-gray-200 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-gray-200 bg-gray-50 py-4">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                        <div>
                          <CardTitle className="capitalize text-xl text-gray-800">{platformName}</CardTitle>
                          <CardDescription>
                            {content.duration} seconds • Created {new Date(content.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        {content.metadata.engagement_prediction && (
                          <Badge className={`px-3 py-1 ${
                            content.metadata.engagement_prediction.engagement_level === 'High' 
                              ? 'bg-green-100 text-green-800' 
                              : content.metadata.engagement_prediction.engagement_level === 'Medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {content.metadata.engagement_prediction.engagement_level} Engagement
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-3">
                          <h3 className="text-lg font-medium mb-4 text-gray-800 flex items-center gap-2">
                            <Eye size={18} />
                            Video Preview
                          </h3>
                          <div className="bg-black rounded-lg overflow-hidden mb-6 shadow-md">
                            {videoUrl ? (
                              <video 
                                src={videoUrl} 
                                controls 
                                className="w-full h-full"
                                poster={thumbnailUrl || undefined}
                                style={{ aspectRatio: platform === 'youtube_shorts' ? '9/16' : '16/9' }}
                              />
                            ) : (
                              <div className="flex items-center justify-center bg-gray-800 text-white p-8" 
                                   style={{ aspectRatio: platform === 'youtube_shorts' ? '9/16' : '16/9' }}>
                                Video not available
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {videoUrl && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex items-center gap-2 bg-white"
                                asChild
                              >
                                <a href={videoUrl} download>
                                  <Download size={14} />
                                  Download Video
                                </a>
                              </Button>
                            )}
                            {thumbnailUrl && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex items-center gap-2 bg-white"
                                asChild
                              >
                                <a href={thumbnailUrl} download>
                                  <Download size={14} />
                                  Download Thumbnail
                                </a>
                              </Button>
                            )}
                            {videoUrl && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="flex items-center gap-2 bg-white"
                                onClick={() => copyToClipboard(videoUrl, 'videoUrl')}
                              >
                                <Share2 size={14} />
                                Copy Video URL
                                {copied === 'videoUrl' && (
                                  <span className="text-xs text-green-600 ml-1">Copied!</span>
                                )}
                              </Button>
                            )}
                          </div>
                          
                          {/* Debug info */}
                          <div className="mt-6 p-3 bg-gray-100 border border-gray-200 rounded text-xs font-mono">
                            <div className="font-bold mb-1">Debug Info:</div>
                            <div className="mb-1">Job ID: {jobId}</div>
                            <div className="mb-1">Platform: {platform}</div>
                            <div className="mb-1">Original Video Path: {content.videoPath}</div>
                            <div className="mb-1">Video Filename: {videoFilename}</div>
                            <div className="mb-1">Express Video URL: {videoUrl}</div>
                          </div>
                        </div>
                        
                        <div className="lg:col-span-2">
                          <h3 className="text-lg font-medium mb-4 text-gray-800">Content Details</h3>
                          
                          {content.metadata.creatives && (
                            <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                              <h4 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b border-gray-100">
                                Ad Creatives
                              </h4>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-xs font-medium text-gray-500 mb-1">Headline</p>
                                  <p className="text-sm bg-gray-50 p-2 rounded text-gray-800">
                                    {content.metadata.creatives.headline}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
                                  <p className="text-sm bg-gray-50 p-2 rounded text-gray-800">
                                    {content.metadata.creatives.description || "No description available"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-500 mb-1">Call to Action</p>
                                  <p className="text-sm bg-gray-50 p-2 rounded text-gray-800">
                                    {content.metadata.creatives.callToAction}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {content.metadata.engagement_prediction && (
                            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                              <h4 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b border-gray-100">
                                Engagement Prediction
                              </h4>
                              <div className="px-4 py-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm text-gray-600">Predicted Score</span>
                                  <span className="font-bold text-gray-800">
                                    {content.metadata.engagement_prediction.predicted_engagement.toFixed(1)}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                                  <div 
                                    className={`h-2.5 rounded-full ${
                                      content.metadata.engagement_prediction.engagement_level === 'High'
                                        ? 'bg-green-500'
                                        : content.metadata.engagement_prediction.engagement_level === 'Medium'
                                        ? 'bg-yellow-500'
                                        : 'bg-blue-500'
                                    }`}
                                    style={{ 
                                      width: `${Math.min(100, content.metadata.engagement_prediction.predicted_engagement)}%` 
                                    }}
                                  ></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>0</span>
                                  <span>25</span>
                                  <span>50</span>
                                  <span>75</span>
                                  <span>100</span>
                                </div>
                                <p className="mt-3 text-sm text-center text-gray-700">
                                  <span className={`font-medium ${
                                    content.metadata.engagement_prediction.engagement_level === 'High'
                                      ? 'text-green-600'
                                      : content.metadata.engagement_prediction.engagement_level === 'Medium'
                                      ? 'text-yellow-600'
                                      : 'text-blue-600'
                                  }`}>
                                    {content.metadata.engagement_prediction.engagement_level}
                                  </span> engagement level
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="rounded-lg bg-white border border-gray-200 p-12 text-center shadow-sm">
                    <div className="max-w-md mx-auto">
                      <h3 className="text-xl font-medium text-gray-800 mb-2">
                        No {platformName} content
                      </h3>
                      <p className="text-gray-500 mb-6">
                        No content was generated for this platform. Try processing your video with this platform selected.
                      </p>
                      <Button onClick={() => router.push('/')} className="bg-blue-500 hover:bg-blue-600">
                        Upload New Video
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  )
}