#!/usr/bin/env python3
"""
Test script for the enhanced YouTube content creation tool.
This will process a sample video and generate content for YouTube Shorts only.
"""

import os
from InnovationNationRGIT.backend.enhanced_app import process_video

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