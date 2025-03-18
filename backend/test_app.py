#!/usr/bin/env python3
"""
Test script for the enhanced YouTube content creation tool.
This will process a sample video and generate content for YouTube Shorts only.
"""

import os
from InnovationNationRGIT.backend.enhanced_app import process_video
import requests
import json

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

def run_test():
    # Path to your test video
    # Replace this with the path to your actual test video
    test_video = "your_video.mp4"
    
    if not os.path.exists(test_video):
        print(f"Error: Test video not found at {test_video}")
        print("Please update the test_video path in this script.")
        return
    
    # Process only for YouTube Shorts to save time
    print(f"Testing with video: {test_video}")
    print("Processing for YouTube Shorts only (for faster testing)")
    
    # Run the processing
    results = process_video(test_video, platforms=["youtube_shorts"])
    
    # Check results
    if results and "youtube_shorts" in results:
        print("\n✅ Test completed successfully!")
        print(f"Output video: {results['youtube_shorts']['video_path']}")
        print(f"Output thumbnail: {results['youtube_shorts']['thumbnail_path']}")
    else:
        print("\n❌ Test failed. Check the error messages above.")

if __name__ == "__main__":
    run_test()