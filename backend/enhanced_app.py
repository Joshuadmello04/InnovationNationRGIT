#!/usr/bin/env python3
"""
Enhanced YouTube Content Creation Tool

This script automates the creation of content for multiple platforms from a single video.
It analyzes videos to find engaging moments and generates optimized content for
different platforms including YouTube Shorts, YouTube Ads, Display Ads, and Performance Max.
"""

import os
import sys
import argparse
import time
import json

# Ensure the script can find modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import our modules
from modules.transcription import transcribe_video
from modules.engagement import find_engaging_moments, frames_to_timestamps
from modules.insights import generate_insights, generate_ad_creatives
from modules.content import create_youtube_short, create_ad_video, generate_thumbnail
from modules.utils import ensure_dir, save_metadata, generate_output_filename, predict_engagement

# Define output directories BEFORE main function
OUTPUT_DIR = "outputs"
PLATFORM_DIRS = {
    "youtube_shorts": os.path.join(OUTPUT_DIR, "youtube_shorts"),
    "youtube_ads": os.path.join(OUTPUT_DIR, "youtube_ads"),
    "display_ads": os.path.join(OUTPUT_DIR, "display_ads"),
    "performance_max": os.path.join(OUTPUT_DIR, "performance_max")
}

# Platform-specific settings
PLATFORM_SETTINGS = {
    "youtube_shorts": {
        "duration": 60,  # seconds
        "aspect_ratio": "9:16",
    },
    "youtube_ads": {
        "duration": 15,  # seconds
        "aspect_ratio": "16:9",
    },
    "display_ads": {
        "duration": 6,  # seconds
        "aspect_ratio": "1:1",
    },
    "performance_max": {
        "duration": 20,  # seconds
        "aspect_ratio": "16:9",
    }
}

def process_video(video_path, platforms=None, job_id=None, output_dir=None, font_path=None):
    """
    Process a video to create content for different platforms.
    
    Parameters:
    - video_path: Path to the input video
    - platforms: List of platforms to generate content for (default: all platforms)
    - job_id: Optional job identifier
    - output_dir: Optional custom output directory
    - font_path: Optional path to a custom font for thumbnails
    
    Returns:
    - Dictionary with results for each platform
    """
    # Use custom output directory if provided
    global OUTPUT_DIR, PLATFORM_DIRS
    if output_dir:
        OUTPUT_DIR = output_dir
        PLATFORM_DIRS = {
            platform: os.path.join(OUTPUT_DIR, platform)
            for platform in PLATFORM_DIRS
        }

    # Create output directories
    for directory in PLATFORM_DIRS.values():
        ensure_dir(directory)
    
    if platforms is None:
        platforms = list(PLATFORM_DIRS.keys())
    
    results = {}
    
    # Step 1: Transcribe the video
    print("\n1. Transcribing video...")
    start_time = time.time()
    transcript = transcribe_video(video_path)
    # Changed Unicode checkmark to "+" to avoid encoding issues
    print(f"+ Transcription completed in {time.time() - start_time:.1f} seconds")
    print(f"  Transcript length: {len(transcript)} characters")
    
    # Step 2: Find engaging moments
    print("\n2. Analyzing video for engaging moments...")
    start_time = time.time()
    engaging_moments = find_engaging_moments(video_path, top_n=5)
    timestamps = frames_to_timestamps(engaging_moments, video_path)
    # Changed Unicode checkmark to "+" to avoid encoding issues
    print(f"+ Video analysis completed in {time.time() - start_time:.1f} seconds")
    print(f"  Found {len(timestamps)} engaging moments:")
    for i, ts in enumerate(timestamps):
        print(f"  - Moment {i+1}: {ts:.2f}s")
    
    # Step 3: Generate insights
    print("\n3. Generating insights...")
    start_time = time.time()
    insights = generate_insights(transcript)
    print(insights)
    # Changed Unicode checkmark to "+" to avoid encoding issues
    print(f"+ Insights generated in {time.time() - start_time:.1f} seconds")
    
    # Step 4: Process for each platform
    for platform in platforms:
        print(f"\n4. Creating content for {platform}...")
        start_time = time.time()
        
        # Get platform settings
        settings = PLATFORM_SETTINGS[platform]
        output_dir = PLATFORM_DIRS[platform]
        
        # Generate ad creatives for this platform
        ad_creatives = generate_ad_creatives(transcript, ad_format=platform.replace("_", " ").title())
        
        # Select the best timestamp for this platform (for simplicity, using the first one)
        timestamp = timestamps[0]
        
        # Create the content based on platform
        output_filename = generate_output_filename(platform)
        output_path = os.path.join(output_dir, output_filename)
        
        if platform == "youtube_shorts":
            # Create a YouTube Short
            duration = min(settings["duration"], 60)  # Max 60 seconds for Shorts
            video_path_out = create_youtube_short(
                video_path, 
                timestamp, 
                timestamp + duration, 
                output_path,
                add_text={'headline': ad_creatives.get('headline', ''), 'cta': ad_creatives.get('call_to_action', '')}
            )
        else:
            # Create an ad video
            video_path_out = create_ad_video(
                video_path,
                timestamp,
                settings["duration"],
                output_path,
                platform,
                ad_text=ad_creatives
            )
        
        # Generate a thumbnail with headline overlay
        thumbnail_filename = generate_output_filename(platform, "jpg")
        thumbnail_path = os.path.join(output_dir, thumbnail_filename)
        
        # Pass both headline and call to action to the thumbnail generator
        # We'll modify the function to accept a dictionary with both values
        generate_thumbnail(
            video_path, 
            timestamp, 
            thumbnail_path, 
            headline=ad_creatives
        )
        
        # Create metadata
        metadata = {
            "platform": platform,
            "timestamp": timestamp,
            "duration": settings["duration"],
            "aspect_ratio": settings["aspect_ratio"],
            "video_file": output_filename,
            "thumbnail_file": thumbnail_filename,
            "creatives": ad_creatives,
            "job_id": job_id  # Include job_id in metadata
        }
        
        # Add engagement prediction
        metadata["engagement_prediction"] = predict_engagement(
            {**metadata, **ad_creatives}, 
            platform
        )
        
        # Save metadata
        metadata_filename = generate_output_filename(platform, "json")
        metadata_path = os.path.join(output_dir, metadata_filename)
        save_metadata(metadata, metadata_path)
        
        # Changed Unicode checkmark to "+" to avoid encoding issues
        print(f"+ {platform} content created in {time.time() - start_time:.1f} seconds")
        print(f"  - Video: {output_filename}")
        print(f"  - Thumbnail: {thumbnail_filename}")
        print(f"  - Metadata: {metadata_filename}")
        
        # Store results
        results[platform] = {
            "video_path": output_path,
            "thumbnail_path": thumbnail_path,
            "metadata_path": metadata_path,
            "metadata": metadata,
            "engagement_prediction": metadata["engagement_prediction"]
        }
    
    # Step 5: Generate a summary report
    print("\n5. Generating summary report...")
    summary = {
        "input_video": os.path.basename(video_path),
        "platforms_processed": platforms,
        "job_id": job_id,  # Include job_id in summary
        "created_content": {}
    }
    
    for platform in results:
        prediction = results[platform]["engagement_prediction"]
        summary["created_content"][platform] = {
            "video_file": os.path.basename(results[platform]["video_path"]),
            "thumbnail_file": os.path.basename(results[platform]["thumbnail_path"]),
            "predicted_engagement": prediction["predicted_engagement"],
            "engagement_level": prediction["engagement_level"]
        }
    
    # Save the summary report
    summary_path = os.path.join(OUTPUT_DIR, "summary_report.json")
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)
    
    # Changed Unicode checkmark to "+" to avoid encoding issues
    print(f"+ Summary report saved to {summary_path}")
    print("\nContent creation completed successfully!")
    
    return results

def main():
    parser = argparse.ArgumentParser(description="AI-driven YouTube content creator")
    parser.add_argument("video", help="Path to the input video file")
    parser.add_argument("--platforms", nargs="+", 
                        choices=list(PLATFORM_DIRS.keys()),
                        default=list(PLATFORM_DIRS.keys()),
                        help="Platforms to generate content for (default: all platforms)")
    parser.add_argument("--output", default=OUTPUT_DIR, 
                        help=f"Output directory (default: {OUTPUT_DIR})")
    parser.add_argument("--job_id", help="Job ID for tracking")
    
    args = parser.parse_args()
    
    # Process the video with all arguments
    process_video(
        args.video, 
        platforms=args.platforms, 
        job_id=args.job_id, 
        output_dir=args.output
    )

if __name__ == "__main__":
    main()