// components/video/VideoUploadForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Job } from '@/types'

interface VideoUploadFormProps {
  onJobCreated?: (job: Job) => void
}

export default function VideoUploadForm ({
  onJobCreated
}: VideoUploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [platforms, setPlatforms] = useState({
    youtube_shorts: true,
    youtube_ads: false,
    display_ads: false,
    performance_max: false
  })
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handlePlatformChange = (platform: string) => {
    setPlatforms(prev => ({
      ...prev,
      [platform]: !prev[platform as keyof typeof prev]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError('Please select a video file')
      return
    }

    // Ensure at least one platform is selected
    const selectedPlatforms = Object.entries(platforms)
      .filter(([, selected]) => selected)
      .map(([platform]) => platform)

    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('video', file)
      formData.append('platforms', JSON.stringify(selectedPlatforms))

      // In a real app, you'd get userId from auth context
      formData.append('userId', 'user-123')

      const response = await fetch('/api/process-video', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upload video')
      }

      const data = await response.json()

      if (onJobCreated) {
        // Make sure we're using the correct literal type here
        onJobCreated({
          id: data.jobId,
          originalVideoName: file.name,
          status: 'PROCESSING', // This is now a valid literal of the expected type
          progress: 0,
          createdAt: new Date().toISOString()
        })
      }

      // Redirect to processing page
      router.push(`/processing/${data.jobId}`)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload video')
    } finally {
      setUploading(false)
    }
  }

  // The component must return JSX
  return (
    <div>
      {error && (
        <div className='mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className='space-y-6'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Upload Video
          </label>
          <input
            type='file'
            accept='video/*'
            onChange={handleFileChange}
            className='w-full border border-gray-300 rounded-md p-2 bg-white'
            disabled={uploading}
          />
          {file && (
            <p className='mt-2 text-sm text-gray-500'>
              Selected: {file.name} (
              {Math.round((file.size / 1024 / 1024) * 10) / 10} MB)
            </p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Generate Content For:
          </label>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            {Object.keys(platforms).map(platform => (
              <div key={platform} className='flex items-center'>
                <input
                  type='checkbox'
                  id={platform}
                  checked={platforms[platform as keyof typeof platforms]}
                  onChange={() => handlePlatformChange(platform)}
                  className='h-4 w-4 text-blue-600 border-gray-300 rounded'
                  disabled={uploading}
                />
                <label
                  htmlFor={platform}
                  className='ml-2 text-sm text-gray-700'
                >
                  {platform.replace('_', ' ')}
                </label>
              </div>
            ))}
          </div>
        </div>

        <button
          type='submit'
          className={`w-full px-4 py-2 text-white font-medium rounded-md ${
            uploading || !file
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          disabled={uploading || !file}
        >
          {uploading ? 'Uploading...' : 'Upload & Process Video'}
        </button>
      </form>
    </div>
  )
}
