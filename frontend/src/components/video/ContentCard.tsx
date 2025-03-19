// components/video/ContentCard.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import VideoPlayer from './VideoPlayer';

interface ContentCardProps {
  content: {
    id: string;
    platform: string;
    videoPath: string;
    thumbnailPath: string;
    metadata: {
      creatives?: {
        headline?: string;
        description?: string;
        call_to_action?: string;
      };
      engagement_prediction?: {
        predicted_engagement: number;
        engagement_level: string;
      };
    };
  };
  jobId: string;
}

export default function ContentCard({ content, jobId }: ContentCardProps) {
  const [playing, setPlaying] = useState(false);
  
  // Format platform name for display
  const formatPlatformName = (platform: string) => {
    return platform.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };
  
  // Get engagement color based on level
  const getEngagementColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Video/Thumbnail section */}
      <div className="relative aspect-video bg-gray-100">
        {playing ? (
          <VideoPlayer 
            src={`/api/file/${jobId}/${content.videoPath}`} 
            onEnded={() => setPlaying(false)}
          />
        ) : (
          <>
            <Image
              src={`/api/file/${jobId}/${content.thumbnailPath}`}
              alt={`Thumbnail for ${formatPlatformName(content.platform)}`}
              fill
              objectFit="cover"
              className="rounded-t-lg"
            />
            <button 
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-16 h-16 rounded-full bg-white bg-opacity-75 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4l12 6-12 6z" />
                </svg>
              </div>
            </button>
          </>
        )}
      </div>
      
      {/* Content details */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-medium text-gray-900">
            {formatPlatformName(content.platform)}
          </h3>
          
          {content.metadata.engagement_prediction && (
            <span className="flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-1 ${
                getEngagementColor(content.metadata.engagement_prediction.engagement_level)
              }`}></span>
              <span className="text-sm text-gray-600">
                {content.metadata.engagement_prediction.engagement_level} Engagement
              </span>
            </span>
          )}
        </div>
        
        {content.metadata.creatives?.headline && (
          <p className="text-sm font-medium text-gray-900 mb-1">
            {content.metadata.creatives.headline}
          </p>
        )}
        
        {content.metadata.creatives?.description && (
          <p className="text-sm text-gray-600 mb-2">
            {content.metadata.creatives.description}
          </p>
        )}
        
        {content.metadata.engagement_prediction && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
              <div 
                className={`h-1.5 rounded-full ${getEngagementColor(content.metadata.engagement_prediction.engagement_level)}`}
                style={{ width: `${content.metadata.engagement_prediction.predicted_engagement}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 text-right">
              {content.metadata.engagement_prediction.predicted_engagement}% predicted engagement
            </p>
          </div>
        )}
        
        <div className="flex space-x-2 mt-4">
          <a 
            href={`/api/download/${jobId}/${content.videoPath}`}
            download
            className="flex-1"
          >
            <Button variant="primary" size="sm" className="w-full">
              Download Video
            </Button>
          </a>
          <a 
            href={`/api/download/${jobId}/${content.thumbnailPath}`}
            download
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full">
              Download Thumbnail
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}