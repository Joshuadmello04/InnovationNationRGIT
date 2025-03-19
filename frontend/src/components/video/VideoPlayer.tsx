// components/video/VideoPlayer.tsx
'use client';

import { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  src: string;
  onEnded?: () => void;
  autoPlay?: boolean;
  controls?: boolean;
}

export default function VideoPlayer({
  src,
  onEnded,
  autoPlay = true,
  controls = true
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    const videoElement = videoRef.current;
    
    if (!videoElement) return;
    
    if (onEnded) {
      const handleEnded = () => {
        onEnded();
      };
      
      videoElement.addEventListener('ended', handleEnded);
      
      return () => {
        videoElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [onEnded]);
  
  return (
    <video
      ref={videoRef}
      src={src}
      className="absolute inset-0 w-full h-full object-cover"
      autoPlay={autoPlay}
      controls={controls}
      playsInline
    />
  );
}