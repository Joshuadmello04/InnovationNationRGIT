#!/usr/bin/env python3
"""
Enhanced YouTube content creation tool API endpoint.
This script processes videos uploaded through the frontend.
"""

import os
import sys
import json
from InnovationNationRGIT.backend.enhanced_app import process_video
import requests

def update_job_status(job_id, status, progress=None, contents=None):
    """
    Updates job status in the database via API call.
    
    Parameters:
    - job_id: The job ID to update
    - status: New status (QUEUED, PROCESSING, COMPLETED, FAILED)
    - progress: Progress percentage (0-100)
    - contents: List of content items created
    """
    url = "http://localhost:3000/api/update-job"
    
    data = {
        "jobId": job_id,
        "status": status,
        "progress": progress
    }
    
    if contents:
        data["contents"] = contents
    
    try:
        response = requests.post(
            url,
            json=data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print(f"Successfully updated job {job_id} status to {status}")
        else:
            print(f"Failed to update job status: {response.text}")
    except Exception as e:
        print(f"Error calling update job API: {e}")

def process_video_job(video_path, job_id, platforms, output_dir):
    """
    Process a video with job status updates.
    
    Parameters:
    - video_path: Path to the uploaded video
    - job_id: Database job ID
    - platforms: List of platforms to process for
    - output_dir: Directory to save outputs
    
    Returns:
    - Success status (boolean)
    """
    try:
        # Validate that the video exists
        if not os.path.exists(video_path):
            print(f"Error: Video not found at {video_path}")
            update_job_status(job_id, "FAILED", 0)
            return False
        
        # Update job status to PROCESSING
        update_job_status(job_id, "PROCESSING", 10)
        
        # Start processing - transcription
        print(f"Processing video: {video_path}")
        print(f"Platforms: {platforms}")
        print(f"Output directory: {output_dir}")
        
        # Create the output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Update progress
        update_job_status(job_id, "PROCESSING", 20)
        
        # Process the video
        results = process_video(video_path, platforms=platforms)
        
        # Update progress
        update_job_status(job_id, "PROCESSING", 90)
        
        # Prepare content data to update in database
        if results:
            contents = []
            for platform, platform_results in results.items():
                contents.append({
                    "platform": platform.upper(),
                    "videoPath": platform_results["video_path"],
                    "thumbnailPath": platform_results["thumbnail_path"],
                    "metadataPath": platform_results.get("metadata_path", ""),
                    "startTimestamp": platform_results.get("metadata", {}).get("timestamp", 0),
                    "duration": platform_results.get("metadata", {}).get("duration", 0),
                    "creatives": platform_results.get("metadata", {}).get("creatives", {}),
                    "engagement_prediction": platform_results.get("metadata", {}).get("engagement_prediction", {})
                })
            
            # Update job as completed with content
            update_job_status(job_id, "COMPLETED", 100, contents)
            print("\n✅ Processing completed successfully!")
            return True
        else:
            # Update job as failed
            update_job_status(job_id, "FAILED", 0)
            print("\n❌ Processing failed. No results returned.")
            return False
            
    except Exception as e:
        # Update job as failed
        update_job_status(job_id, "FAILED", 0)
        print(f"\n❌ Error during processing: {str(e)}")
        return False

if __name__ == "__main__":
    # Get command line arguments
    if len(sys.argv) < 5:
        print("Usage: python process_video.py <video_path> <job_id> <output_dir> <platform1,platform2,...>")
        sys.exit(1)
    
    video_path = sys.argv[1]
    job_id = sys.argv[2]
    output_dir = sys.argv[3]
    platforms = sys.argv[4].split(',')
    
    # Process the video
    process_video_job(video_path, job_id, platforms, output_dir)