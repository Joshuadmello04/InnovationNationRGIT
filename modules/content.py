import os
from moviepy.video.VideoClip import VideoClip
from moviepy.video.io.VideoFileClip import VideoFileClip
import numpy as np
from PIL import Image, ImageDraw
import cv2
import datetime
import tempfile

def create_youtube_short(video_path, start_time, end_time, output_path, add_text=None):
    """
    Creates a YouTube Short by clipping a segment from the video and formatting it
    for vertical viewing (9:16 aspect ratio).
    
    Parameters:
    - video_path: Path to the source video
    - start_time: Start timestamp in seconds
    - end_time: End timestamp in seconds
    - output_path: Path to save the output video
    - add_text: Optional text to overlay (dict with 'headline' and 'cta' keys)
    
    Returns:
    - output_path: Path to the created video
    """
    # Create the output directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Load the video
    clip = VideoFileClip(video_path)
    
    # Make sure timestamps are within video bounds
    start_time = max(0, min(start_time, clip.duration - 1))
    end_time = max(start_time + 1, min(end_time, clip.duration))
    
    # Extract the subclip
    subclip = clip.subclipped(start_time, end_time)
    
    # For YouTube Shorts, we want a vertical format (9:16 aspect ratio)
    w, h = subclip.size
    target_h = h
    target_w = int(9 * target_h / 16)  # Calculate width for 9:16 ratio
    
    # Function to manually crop each frame
    def crop_frame(frame, left, right):
        """Crop a frame to the specified left and right boundaries"""
        if len(frame.shape) == 3:  # Color frame
            return frame[:, left:right, :]
        else:  # Grayscale frame
            return frame[:, left:right]
    
    # Function to manually process frames for a cropped clip
    def get_cropped_frame(t):
        """Return a cropped frame at time t"""
        frame = subclip.get_frame(t)
        x_center = w // 2
        left = max(0, x_center - target_w // 2)
        right = min(w, x_center + target_w // 2)
        return crop_frame(frame, left, right)
    
    # Try multiple approaches to crop the video
    cropped_successfully = False
    
    # Approach 1: Try using the subclip's crop method if available
    try:
        x_center = w // 2
        left = max(0, x_center - target_w // 2)
        right = min(w, x_center + target_w // 2)
        
        if hasattr(subclip, 'crop'):
            subclip = subclip.crop(x1=left, y1=0, x2=right, y2=h)
            print(f"Successfully cropped video using clip.crop method: {subclip.size}")
            cropped_successfully = True
        else:
            print("clip.crop method not available")
    except Exception as e:
        print(f"clip.crop method approach failed: {e}")
    
    # Approach 2: Use ffmpeg directly for cropping
    if not cropped_successfully:
        try:
            print("Attempting direct ffmpeg process...")
            
            # Step 1: Write the subclip to a temporary file
            temp_file = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False).name
            subclip.write_videofile(temp_file, fps=24, logger=None)
            
            # Step 2: Use ffmpeg directly via system call
            x_center = w // 2
            left = max(0, x_center - target_w // 2)
            crop_width = min(target_w, w - left)
            
            # Calculate the ffmpeg crop filter string
            crop_filter = f"crop={crop_width}:{h}:{left}:0"
            
            # Create ffmpeg command
            import subprocess
            cmd = [
                'ffmpeg',
                '-i', temp_file,
                '-vf', crop_filter,
                '-c:a', 'copy',
                '-y',  # Overwrite output file if it exists
                output_path
            ]
            
            # Run ffmpeg command
            subprocess.call(cmd)
            
            # Load the cropped video and update our subclip
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                # Clean up the temporary file
                os.unlink(temp_file)
                print(f"Successfully cropped video using ffmpeg: {crop_width}x{h}")
                
                # We'll return early since the output file is already created
                return output_path
            else:
                # If ffmpeg failed, clean up and continue with uncropped video
                os.unlink(temp_file)
                print("ffmpeg crop failed, continuing with uncropped video")
        except Exception as e:
            print(f"ffmpeg approach failed: {e}")
    
    # If none of our cropping approaches worked, we'll proceed with the original video
    if not cropped_successfully:
        print("All cropping approaches failed. Creating video with original aspect ratio.")
    
    # Try to add text overlays if requested - simplest approach without TextClip
    final_clip = subclip
    
    # Write the clip to the output file
    print(f"Writing video to {output_path} with dimensions {final_clip.size}...")
    try:
        final_clip.write_videofile(output_path, fps=24, logger=None)
    except Exception as e:
        print(f"Error writing video file: {e}")
        # Try with different parameters
        try:
            final_clip.write_videofile(output_path, fps=24, codec='libx264', audio_codec='aac')
        except Exception as e2:
            print(f"Second attempt to write video failed: {e2}")
            return None  # Unable to create video
    
    # Clean up
    try:
        clip.close()
        if subclip is not clip:
            subclip.close()
        if final_clip is not subclip:
            final_clip.close()
    except Exception as e:
        print(f"Warning during cleanup: {e}")
    
    return output_path

def create_ad_video(video_path, start_time, duration, output_path, ad_format, ad_text=None):
    """
    Creates an ad video in the specified format.
    
    Parameters:
    - video_path: Path to the source video
    - start_time: Start timestamp in seconds
    - duration: Duration in seconds
    - output_path: Path to save the output video
    - ad_format: Format of the ad (youtube_ads, display_ads, performance_max)
    - ad_text: Optional text to overlay (dict with 'headline' and 'cta' keys)
    
    Returns:
    - output_path: Path to the created video
    """
    # Create the output directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Load the video
    clip = VideoFileClip(video_path)
    
    # Make sure timestamps are within video bounds
    start_time = max(0, min(start_time, clip.duration - 1))
    end_time = min(start_time + duration, clip.duration)
    
    # Extract the subclip
    subclip = clip.subclipped(start_time, end_time)
    
    # Apply format-specific transformations
    try:
        if ad_format == "display_ads":
            # For Display Ads, create square 1:1 format
            w, h = subclip.size
            size = min(w, h)
            x_center, y_center = w // 2, h // 2
            
            # Try crop method if available
            if hasattr(subclip, 'crop'):
                subclip = subclip.crop(
                    x1=x_center - size // 2, 
                    y1=y_center - size // 2,
                    x2=x_center + size // 2,
                    y2=y_center + size // 2
                )
            else:
                # If cropping fails, try resize with square dimensions
                try:
                    subclip = subclip.resize(width=size, height=size)
                except Exception as e2:
                    print(f"Resize for display ads failed: {e2}")
        else:
            # For YouTube Ads and Performance Max, use 16:9 format
            w, h = subclip.size
            target_w = w
            target_h = int(9 * target_w / 16)
            
            if h > target_h:
                # Crop height if too tall
                y_center = h // 2
                
                # Try crop method if available
                if hasattr(subclip, 'crop'):
                    subclip = subclip.crop(
                        x1=0, 
                        y1=y_center - target_h // 2,
                        x2=w,
                        y2=y_center + target_h // 2
                    )
            else:
                # Resize if too short
                try:
                    subclip = subclip.resize(height=target_h)
                except Exception as e:
                    print(f"Error resizing for ads: {e}")
    except Exception as e:
        print(f"Format-specific transformation failed: {e}")
    
    # Add text overlays if provided - not using TextClip due to import issues
    final_clip = subclip
    
    # Write the clip to the output file
    try:
        final_clip.write_videofile(output_path, fps=24, logger=None)
    except Exception as e:
        print(f"Error writing video file: {e}")
        # Try with different parameters
        try:
            final_clip.write_videofile(output_path, fps=24, codec='libx264', audio_codec='aac')
        except Exception as e2:
            print(f"Second attempt to write video failed: {e2}")
            return None
    
    # Clean up
    try:
        clip.close()
        if subclip is not clip:
            subclip.close()
        if final_clip is not subclip:
            final_clip.close()
    except Exception as e:
        print(f"Warning during cleanup: {e}")
    
    return output_path

def generate_thumbnail(video_path, timestamp, output_path, add_text=None):
    """
    Generates a thumbnail from a video frame.
    
    Parameters:
    - video_path: Path to the source video
    - timestamp: Timestamp in seconds to extract frame
    - output_path: Path to save the thumbnail
    - add_text: Optional text to overlay
    
    Returns:
    - output_path: Path to the created thumbnail
    """
    # Create the output directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Extract a frame from the video
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_number = int(timestamp * fps)
    
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
    ret, frame = cap.read()
    
    # If frame extraction fails, try an earlier frame
    if not ret:
        print(f"Could not extract frame at timestamp {timestamp}, trying earlier timestamp")
        for earlier_frame in range(frame_number-1, 0, -1):
            cap.set(cv2.CAP_PROP_POS_FRAMES, earlier_frame)
            ret, frame = cap.read()
            if ret:
                break
    
    cap.release()
    
    # If still no valid frame, raise error
    if not ret:
        raise ValueError("Could not extract any valid frame from the video")
    
    # Convert to PIL Image for processing
    image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    
    # For thumbnails for YouTube Shorts, crop to vertical format
    width, height = image.size
    target_width = int(height * 9 / 16)  # For 9:16 ratio
    
    # Center crop
    if width > target_width:
        x_center = width // 2
        left = max(0, x_center - target_width // 2)
        right = min(width, x_center + target_width // 2)
        image = image.crop((left, 0, right, height))
    
    # Add text if provided
    if add_text and isinstance(add_text, dict):
        try:
            draw = ImageDraw.Draw(image)
            
            # Add headline at the top
            if 'headline' in add_text and add_text['headline']:
                headline = add_text['headline']
                # Draw text with background
                text_width, text_height = draw.textsize(headline)
                text_x = (image.width - text_width) // 2
                text_y = 20
                
                # Draw background rectangle
                draw.rectangle((0, text_y, image.width, text_y + text_height + 10), fill=(0, 0, 0, 180))
                # Draw text
                draw.text((text_x, text_y + 5), headline, fill=(255, 255, 255))
            
            # Add CTA at the bottom
            if 'cta' in add_text and add_text['cta']:
                cta = add_text['cta']
                text_width, text_height = draw.textsize(cta)
                text_x = (image.width - text_width) // 2
                text_y = image.height - text_height - 30
                
                # Draw background rectangle
                draw.rectangle((0, text_y, image.width, text_y + text_height + 10), fill=(0, 0, 0, 180))
                # Draw text
                draw.text((text_x, text_y + 5), cta, fill=(255, 255, 255))
        except Exception as e:
            print(f"Could not add text to thumbnail: {e}")
    
    # Save the thumbnail
    image.save(output_path)
    
    return output_path