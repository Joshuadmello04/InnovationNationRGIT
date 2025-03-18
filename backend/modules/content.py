#backend/modules/content.py
import os
import numpy as np
import cv2
import tempfile
import subprocess
import traceback
from PIL import Image, ImageDraw, ImageFont
from moviepy.video.io.VideoFileClip import VideoFileClip
from moviepy.video.VideoClip import VideoClip
from moviepy.video.VideoClip import ImageClip
from moviepy.video.compositing.CompositeVideoClip import CompositeVideoClip

def create_youtube_short(video_path, start_time, end_time, output_path, add_text=None, smart_format=True, add_subtitles=True):
    """
    Creates a YouTube Short by clipping a segment from the video and formatting it
    for vertical viewing (9:16 aspect ratio) using intelligent content preservation.
    
    Parameters:
    - video_path: Path to the source video
    - start_time: Start timestamp in seconds
    - end_time: End timestamp in seconds
    - output_path: Path to save the output video
    - add_text: Optional text to overlay (dict with 'headline' and 'cta' keys)
    - smart_format: Whether to use intelligent formatting (True) or simple center crop (False)
    - add_subtitles: Whether to automatically generate and add subtitles (True/False)
    
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
    
    # Flag to track if formatting was successful
    formatting_successful = False
    
    # Approach 1: Smart formatting with content preservation
    if smart_format:
        try:
            print("Attempting smart formatting to preserve important content...")
            
            # Sample frames for content analysis
            sample_times = np.linspace(0, subclip.duration, num=min(10, int(subclip.duration) + 1))
            
            # Function to detect important content regions in a frame
            def detect_important_regions(frame):
                # Convert to grayscale
                gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
                
                # Edge detection to find areas with details
                edges = cv2.Canny(gray, 100, 200)
                
                # Dilate to connect nearby edges
                kernel = np.ones((5, 5), np.uint8)
                dilated = cv2.dilate(edges, kernel, iterations=2)
                
                # Find contours in the edge-detected image
                contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                
                # Only keep contours that are reasonably sized (not noise)
                significant_contours = [c for c in contours if cv2.contourArea(c) > 500]
                
                # Get bounding rectangles for all significant contours
                boxes = [cv2.boundingRect(c) for c in significant_contours]
                
                return boxes
            
            # Find important regions across sample frames
            all_regions = []
            for t in sample_times:
                frame = subclip.get_frame(t)
                regions = detect_important_regions(frame)
                all_regions.extend(regions)
            
            # If we found important regions, determine optimal crop window
            if all_regions:
                # Find left and right boundaries of important content
                left_bounds = [x for (x, y, w, h) in all_regions]
                right_bounds = [x + w for (x, y, w, h) in all_regions]
                
                # Calculate the content center
                left_edge = min(left_bounds)
                right_edge = max(right_bounds)
                content_width = right_edge - left_edge
                content_center = left_edge + content_width // 2
                
                # Handle different content width scenarios
                if content_width <= target_w:
                    # Content fits within target width - center it
                    crop_left = max(0, content_center - target_w // 2)
                    crop_right = min(w, crop_left + target_w)
                    
                    # Adjust if we're at the frame edges
                    if crop_left == 0:
                        crop_right = target_w
                    elif crop_right == w:
                        crop_left = w - target_w
                else:
                    # Content wider than target - use hybrid approach
                    if smart_format == "background_extension":
                        # Use background extension instead of cropping
                        return create_youtube_short_with_background(
                            video_path, start_time, end_time, output_path, add_text, add_subtitles)
                    else:
                        # Content too wide, prioritize the center of the content
                        crop_left = max(0, content_center - target_w // 2)
                        crop_right = min(w, crop_left + target_w)
                
                # Function to crop frame based on determined boundaries
                def smart_crop_frame(frame):
                    if len(frame.shape) == 3:  # Color frame
                        return frame[:, crop_left:crop_right, :]
                    else:  # Grayscale frame
                        return frame[:, crop_left:crop_right]
                
                # Create new clip with smart cropping
                def make_frame(t):
                    frame = subclip.get_frame(t)
                    return smart_crop_frame(frame)
                
                smart_clip = VideoClip(make_frame, duration=subclip.duration)
                smart_clip.audio = subclip.audio
                
                # Write to output file
                smart_clip.write_videofile(output_path, fps=24, logger=None)
                
                # Clean up
                smart_clip.close()
                formatting_successful = True
                print(f"Smart formatting successful - content centered from x={crop_left} to x={crop_right}")
            else:
                print("No significant content regions detected, falling back to other methods.")
        except Exception as e:
            print(f"Smart formatting failed: {e}")
            print(traceback.format_exc())
    
    # Approach 2: Try using FFMPEG for direct cropping if smart formatting failed
    if not formatting_successful:
        try:
            print("Attempting FFMPEG-based cropping...")
            
            # Write the subclip to a temporary file
            temp_file = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False).name
            subclip.write_videofile(temp_file, fps=24, logger=None)
            
            # Calculate center crop boundaries
            x_center = w // 2
            crop_left = max(0, x_center - target_w // 2)
            crop_width = min(target_w, w - crop_left)
            
            # Create the FFMPEG command
            crop_filter = f"crop={crop_width}:{h}:{crop_left}:0"
            cmd = [
                'ffmpeg',
                '-i', temp_file,
                '-vf', crop_filter,
                '-c:a', 'copy',
                '-y',
                output_path
            ]
            
            # Run FFMPEG
            subprocess.call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            # Verify output was created successfully
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                os.unlink(temp_file)
                formatting_successful = True
                print(f"FFMPEG cropping successful with dimensions {crop_width}x{h}")
            else:
                os.unlink(temp_file)
                print("FFMPEG cropping failed to create a valid output file.")
        except Exception as e:
            print(f"FFMPEG approach failed: {e}")
            print(traceback.format_exc())
    
    # Approach 3: Background extension as a last resort
    if not formatting_successful:
        try:
            print("Attempting background extension approach...")
            formatting_successful = create_youtube_short_with_background(
                video_path, start_time, end_time, output_path, add_text, add_subtitles)
        except Exception as e:
            print(f"Background extension approach failed: {e}")
            print(traceback.format_exc())
    
    # If all approaches failed, just write the original subclip
    if not formatting_successful:
        print("All formatting approaches failed. Creating video with original aspect ratio.")
        subclip.write_videofile(output_path, fps=24, logger=None)
    
    # Clean up
    try:
        clip.close()
        subclip.close()
    except Exception as e:
        print(f"Warning during cleanup: {e}")
    
    # Try to add text overlays to the final video if requested
    if add_text and os.path.exists(output_path):
        try:
            # Try the enhanced text overlay function
            overlay_result = add_text_overlay_with_images(output_path, add_text)
            
            if not overlay_result and isinstance(add_text, dict):
                # If the overlay failed but we have text, try the simple subtitle approach
                if 'headline' in add_text and add_text['headline']:
                    print("Trying alternative subtitle method with headline text")
                    add_subtitle_overlay(output_path, add_text['headline'], position='top')
                elif 'cta' in add_text and add_text['cta']:
                    print("Trying alternative subtitle method with CTA text")
                    add_subtitle_overlay(output_path, add_text['cta'], position='bottom')
            
            # If add_text is a string, treat it as a simple subtitle
            elif isinstance(add_text, str) and add_text.strip():
                print("Adding subtitle overlay with text string")
                add_subtitle_overlay(output_path, add_text)
        except Exception as e:
            print(f"Could not add text overlays: {e}")
            print(traceback.format_exc())
    
    # Add auto-generated subtitles if requested
    if add_subtitles and os.path.exists(output_path):
        try:
            print("Adding auto-generated subtitles to the video...")
            add_subtitles_to_shorts(output_path)
        except Exception as e:
            print(f"Could not add auto-generated subtitles: {e}")
            print(traceback.format_exc())
    
    return output_path

def create_youtube_short_with_background(video_path, start_time, end_time, output_path, add_text=None, add_subtitles=False):
    """
    Creates a YouTube Short by placing the original video on a background
    to preserve 9:16 aspect ratio without cropping content.
    """
    # Load the video
    clip = VideoFileClip(video_path)
    subclip = clip.subclipped(start_time, end_time)
    
    # Calculate dimensions
    w, h = subclip.size
    target_h = h
    target_w = int(9 * target_h / 16)
    
    # Create a frame processing function
    def process_frame(frame):
        # Create a blurred version of the frame for background
        blurred = cv2.GaussianBlur(frame, (151, 151), 0)
        
        # Create target frame with proper dimensions
        target_frame = np.zeros((target_h, target_w, 3), dtype=np.uint8)
        
        # Fill with blurred background, stretched to fill
        background = cv2.resize(blurred, (target_w, target_h))
        target_frame[:] = background
        
        # Calculate scaling for original content
        scale_factor = min(target_w / w, target_h / h) * 0.9  # 90% to leave margins
        new_w, new_h = int(w * scale_factor), int(h * scale_factor)
        
        # Resize original frame
        resized = cv2.resize(frame, (new_w, new_h))
        
        # Center the resized frame in the target
        y_offset = (target_h - new_h) // 2
        x_offset = (target_w - new_w) // 2
        
        # Place original content on background
        target_frame[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = resized
        
        return target_frame
    
    # Create a new clip with the processed frames
    def make_frame(t):
        frame = subclip.get_frame(t)
        return process_frame(frame)
    
    # Create and write the new clip
    final_clip = VideoClip(make_frame, duration=subclip.duration)
    final_clip.audio = subclip.audio
    
    final_clip.write_videofile(output_path, fps=24, logger=None)
    
    # Clean up
    clip.close()
    subclip.close()
    final_clip.close()
    
    print(f"Created video with background extension to {target_w}x{target_h}")
    
    # Add text if provided
    if add_text and os.path.exists(output_path):
        try:
            # Try the enhanced text overlay function
            overlay_result = add_text_overlay_with_images(output_path, add_text)
            
            if not overlay_result and isinstance(add_text, dict):
                # If the overlay failed but we have text, try the simple subtitle approach
                if 'headline' in add_text and add_text['headline']:
                    add_subtitle_overlay(output_path, add_text['headline'], position='top')
                elif 'cta' in add_text and add_text['cta']:
                    add_subtitle_overlay(output_path, add_text['cta'], position='bottom')
            
            # If add_text is a string, treat it as a simple subtitle
            elif isinstance(add_text, str) and add_text.strip():
                add_subtitle_overlay(output_path, add_text)
        except Exception as e:
            print(f"Could not add text overlays: {e}")
    
    # Add auto-generated subtitles if requested
    if add_subtitles and os.path.exists(output_path):
        try:
            print("Adding auto-generated subtitles to the video...")
            add_subtitles_to_shorts(output_path)
        except Exception as e:
            print(f"Could not add auto-generated subtitles: {e}")
            print(traceback.format_exc())
    
    return True

def add_text_overlay_with_images(video_path, text_data):
    """
    Creates text overlays on a video by using direct FFmpeg commands.
    Uses improved text processing and error handling.
    
    Parameters:
    - video_path: Path to the video file to modify
    - text_data: Dictionary containing 'headline' and/or 'cta' text to overlay
    
    Returns:
    - Boolean indicating success or failure
    """
    try:
        # Print the text data for debugging
        print(f"Attempting to add text overlays with data: {text_data}")
        
        if not text_data:
            print("No text data provided for overlay.")
            return False
            
        if isinstance(text_data, str):
            # Convert string to dictionary format
            text_data = {'headline': text_data}
        elif not isinstance(text_data, dict):
            print(f"Invalid text_data type: {type(text_data)}. Expected dict or string.")
            return False
            
        # Create a temporary file for the output
        temp_output = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False).name
        
        # Process headline text
        headline_filter = None
        if 'headline' in text_data and text_data['headline']:
            headline = text_data['headline']
            
            # Limit headline length
            if len(headline) > 60:
                headline = headline[:57] + "..."
                
            # Escape special characters for FFmpeg
            headline = headline.replace("'", "'\\''").replace(":", "\\:").replace(",", "\\,")
            print(f"Adding headline text: '{headline}'")
            
            headline_filter = f"drawtext=text='{headline}':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.8:x=20:y=30"
        
        # Process CTA text
        cta_filter = None
        if 'cta' in text_data and text_data['cta']:
            cta = text_data['cta']
            
            # Limit CTA length
            if len(cta) > 80:
                cta = cta[:77] + "..."
                
            # Escape special characters for FFmpeg
            cta = cta.replace("'", "'\\''").replace(":", "\\:").replace(",", "\\,")
            print(f"Adding CTA text: '{cta}'")
            
            cta_filter = f"drawtext=text='{cta}':fontcolor=white:fontsize=20:box=1:boxcolor=black@0.8:x=20:y=h-60"
        
        # Apply filters in sequence if both are present
        if headline_filter and cta_filter:
            filter_complex = f"{headline_filter},{cta_filter}"
        elif headline_filter:
            filter_complex = headline_filter
        elif cta_filter:
            filter_complex = cta_filter
        else:
            print("No valid text to add.")
            return False
        
        # Run FFmpeg with error capture
        cmd = [
            'ffmpeg',
            '-i', video_path,
            '-vf', filter_complex,
            '-c:a', 'copy',
            '-y',
            temp_output
        ]
        
        # Capture FFmpeg output for debugging
        process = subprocess.Popen(
            cmd, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE
        )
        stdout, stderr = process.communicate()
        
        if process.returncode != 0:
            print(f"FFmpeg error: {stderr.decode('utf-8', errors='ignore')}")
            if os.path.exists(temp_output):
                os.unlink(temp_output)
            return False
        
        # Check output
        if os.path.exists(temp_output) and os.path.getsize(temp_output) > 0:
            os.replace(temp_output, video_path)
            print("Successfully added text overlays using FFmpeg")
            return True
        else:
            print("FFmpeg failed to create a valid output file.")
            return False
            
    except Exception as e:
        print(f"Error in text overlay: {e}")
        import traceback
        print(traceback.format_exc())
        
        # Clean up temporary file if it exists
        if 'temp_output' in locals() and os.path.exists(temp_output):
            try:
                os.unlink(temp_output)
            except:
                pass
        
        return False

def add_subtitle_overlay(video_path, subtitle_text, position='bottom'):
    """
    Adds a single subtitle to a video using FFmpeg.
    Improved version with better error handling and text processing.
    
    Parameters:
    - video_path: Path to the video file
    - subtitle_text: Text to display as subtitle
    - position: Position of subtitle ('bottom', 'top', 'center')
    
    Returns:
    - Boolean indicating success
    """
    if not subtitle_text:
        print("No subtitle text provided.")
        return False
        
    try:
        print(f"Adding subtitle overlay: '{subtitle_text}' at position '{position}'")
        
        # Create a temporary file for output
        temp_output = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False).name
        
        # Limit text length
        if len(subtitle_text) > 80:
            subtitle_text = subtitle_text[:77] + "..."
        
        # Escape special characters
        subtitle_text = subtitle_text.replace("'", "'\\''").replace(":", "\\:").replace(",", "\\,")
        
        # Calculate position based on parameter
        y_position = "h-70"  # Default bottom
        if position == 'top':
            y_position = "30"
        elif position == 'center':
            y_position = "(h-text_h)/2"
        
        # Create FFmpeg filter for subtitle
        filter_text = f"drawtext=text='{subtitle_text}':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.8:x=20:y={y_position}"
        
        # Run FFmpeg with error capture
        cmd = [
            'ffmpeg',
            '-i', video_path,
            '-vf', filter_text,
            '-c:a', 'copy',
            '-y',
            temp_output
        ]
        
        # Capture FFmpeg output for debugging
        process = subprocess.Popen(
            cmd, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE
        )
        stdout, stderr = process.communicate()
        
        if process.returncode != 0:
            print(f"FFmpeg error: {stderr.decode('utf-8', errors='ignore')}")
            if os.path.exists(temp_output):
                os.unlink(temp_output)
            return False
        
        # Check output
        if os.path.exists(temp_output) and os.path.getsize(temp_output) > 0:
            os.replace(temp_output, video_path)
            print(f"Successfully added subtitle: '{subtitle_text}'")
            return True
        else:
            print("FFmpeg failed to create a valid output file.")
            return False
        
    except Exception as e:
        print(f"Error adding subtitle overlay: {e}")
        import traceback
        print(traceback.format_exc())
        
        # Clean up temp file if it exists
        if 'temp_output' in locals() and os.path.exists(temp_output):
            try:
                os.unlink(temp_output)
            except:
                pass
                
        return False

def transcribe_with_timestamps(video_path):
    """
    Transcribes a video with timestamps using whisper.
    
    Returns a list of segments with start_time, end_time, and text.
    """
    try:
        import whisper
        
        print("Loading Whisper model for transcription...")
        # Load the whisper model (use 'base' for faster processing, 'medium' or 'large' for better accuracy)
        model = whisper.load_model("base")
        
        print("Transcribing audio with word timestamps...")
        # Transcribe with word timestamps
        result = model.transcribe(video_path, word_timestamps=True)
        
        # Extract segments with timing
        segments = []
        for segment in result["segments"]:
            segments.append({
                "start": segment["start"],
                "end": segment["end"],
                "text": segment["text"].strip()
            })
        
        print(f"Transcription complete - extracted {len(segments)} segments")
        return segments
    
    except Exception as e:
        print(f"Error in transcription: {e}")
        print(traceback.format_exc())
        return []

def process_segments_for_shorts(segments, max_words_per_segment=7, max_chars_per_line=35):
    """
    Processes transcript segments to be more suitable for short-form content.
    - Breaks segments into shorter phrases based on natural language breaks
    - Limits words per segment for better readability
    - Ensures proper timing
    
    Parameters:
    - segments: List of transcript segments with start/end times and text
    - max_words_per_segment: Maximum number of words to show at once
    - max_chars_per_line: Maximum characters per line for formatting
    
    Returns:
    - List of processed subtitle segments
    """
    processed_segments = []
    
    # Early exit if no segments
    if not segments:
        return []
    
    for segment in segments:
        # Get the original text and timing
        text = segment["text"].strip()
        start_time = segment["start"]
        end_time = segment["end"]
        
        # Skip very short segments
        if len(text) < 2:
            continue
            
        # Split text into sentences
        import re
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        # Handle each sentence
        for sentence in sentences:
            # Skip empty sentences
            if not sentence.strip():
                continue
                
            # Split sentence into words
            words = sentence.split()
            
            # Group words into smaller chunks
            word_chunks = []
            current_chunk = []
            current_length = 0
            
            for word in words:
                # Check if adding this word would exceed the limit
                if len(current_chunk) >= max_words_per_segment or current_length + len(word) > max_chars_per_line:
                    # Save current chunk and start a new one
                    word_chunks.append(' '.join(current_chunk))
                    current_chunk = [word]
                    current_length = len(word)
                else:
                    # Add word to current chunk
                    current_chunk.append(word)
                    current_length += len(word) + 1  # +1 for space
            
            # Add the last chunk if not empty
            if current_chunk:
                word_chunks.append(' '.join(current_chunk))
            
            # Calculate time per chunk (distribute the sentence time evenly)
            if word_chunks:
                time_per_chunk = (end_time - start_time) / len(word_chunks)
                
                # Create a segment for each chunk
                for i, chunk in enumerate(word_chunks):
                    chunk_start = start_time + (i * time_per_chunk)
                    chunk_end = chunk_start + time_per_chunk
                    
                    processed_segments.append({
                        "start": chunk_start,
                        "end": chunk_end,
                        "text": chunk
                    })
    
    return processed_segments

def add_subtitles_to_video(video_path, subtitles_data, output_path=None):
    """
    Adds subtitles to a video with improved styling for short-form content.
    
    Parameters:
    - video_path: Path to the video file
    - subtitles_data: List of dictionaries with 'text', 'start', and 'end' keys
    - output_path: Optional path to save the output video. If None, modifies in place
    
    Returns:
    - Path to the output video
    """
    if not subtitles_data:
        print("No subtitle data provided.")
        return video_path
    
    if output_path is None:
        temp_output = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False).name
        final_output = video_path
    else:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        temp_output = output_path
        final_output = output_path
    
    try:
        # Create a temporary subtitle file in ASS format with improved styling
        subtitle_file = tempfile.NamedTemporaryFile(suffix='.ass', delete=False, mode='w', encoding='utf-8')
        
        # Write ASS header with improved styling for short-form content
        subtitle_file.write("""[Script Info]
ScriptType: v4.00+
PlayResX: 384
PlayResY: 288
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,18,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,1.5,0.5,2,10,10,15,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""")
        
        # Write subtitle events with shorter display times
        for subtitle in subtitles_data:
            # Format start and end times as h:mm:ss.cc
            start = format_time(subtitle['start'])
            end = format_time(subtitle['end'])
            
            # Escape commas in text for ASS format
            text = subtitle['text'].replace(',', '\\,')
            
            # Write the subtitle event line with proper styling
            subtitle_file.write(f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}\n")
        
        subtitle_file.close()
        
        # Use FFmpeg to burn subtitles into the video
        cmd = [
            'ffmpeg',
            '-i', video_path,
            '-vf', f"ass={subtitle_file.name}",
            '-c:a', 'copy',
            '-y',
            temp_output
        ]
        
        # Run FFmpeg with error capture
        process = subprocess.Popen(
            cmd, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE
        )
        stdout, stderr = process.communicate()
        
        # Check if successful
        if process.returncode != 0:
            print(f"FFmpeg error: {stderr.decode('utf-8', errors='ignore')}")
            
            # Try an alternative approach using drawtext if ASS fails
            return add_subtitles_with_drawtext(video_path, subtitles_data, output_path)
        
        # Replace original if needed
        if output_path is None and os.path.exists(temp_output):
            os.replace(temp_output, video_path)
            print("Successfully added subtitles to the video")
            
        # Clean up subtitle file
        try:
            os.unlink(subtitle_file.name)
        except:
            pass
            
        return final_output
        
    except Exception as e:
        print(f"Error adding subtitles to video: {e}")
        print(traceback.format_exc())
        
        # Clean up temp files
        if 'subtitle_file' in locals() and os.path.exists(subtitle_file.name):
            try:
                os.unlink(subtitle_file.name)
            except:
                pass
                
        if 'temp_output' in locals() and output_path is None and os.path.exists(temp_output):
            try:
                os.unlink(temp_output)
            except:
                pass
        
        # Try alternative approach for adding subtitles
        try:
            return add_subtitles_with_drawtext(video_path, subtitles_data, output_path)
        except:
            return video_path

def add_subtitles_with_drawtext(video_path, subtitles_data, output_path=None):
    """
    Alternative method to add subtitles using FFmpeg's drawtext filter.
    Used as a fallback if ASS subtitle method fails.
    
    Parameters:
    - video_path: Path to the video file
    - subtitles_data: List of dictionaries with 'text', 'start', and 'end' keys
    - output_path: Optional path to save the output video
    
    Returns:
    - Path to the output video
    """
    if output_path is None:
        temp_output = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False).name
        final_output = video_path
    else:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        temp_output = output_path
        final_output = output_path
    
    try:
        # Skip if no subtitles
        if not subtitles_data:
            return video_path
            
        # Create filter expressions for each subtitle
        filter_expressions = []
        
        for subtitle in subtitles_data:
            # Limit text length
            text = subtitle['text']
            if len(text) > 35:
                text = text[:32] + "..."
                
            # Escape special characters
            text = text.replace("'", "'\\''").replace(":", "\\:").replace(",", "\\,")
            
            # Convert timestamps to seconds for enable/disable calculations
            start_time = float(subtitle['start'])
            end_time = float(subtitle['end'])
            
            # Create the drawtext filter with timing conditions and improved styling
            filter_expr = (
                f"drawtext=text='{text}':fontcolor=white:fontsize=18:"
                f"box=1:boxcolor=black@0.7:boxborderw=3:x=(w-text_w)/2:y=h-60:"
                f"enable='between(t,{start_time},{end_time})'"
            )
            
            filter_expressions.append(filter_expr)
        
        # Combine all filter expressions with commas
        if filter_expressions:
            filter_complex = ",".join(filter_expressions)
            
            # Build FFmpeg command
            cmd = [
                'ffmpeg',
                '-i', video_path,
                '-vf', filter_complex,
                '-c:a', 'copy',
                '-y',
                temp_output
            ]
            
            # Run FFmpeg
            process = subprocess.Popen(
                cmd, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE
            )
            stdout, stderr = process.communicate()
            
            # Check if successful
            if process.returncode != 0:
                print(f"FFmpeg drawtext error: {stderr.decode('utf-8', errors='ignore')}")
                return video_path
            
            # Replace original if needed
            if output_path is None and os.path.exists(temp_output):
                os.replace(temp_output, video_path)
                print("Successfully added subtitles using drawtext method")
                return video_path
            else:
                return temp_output
        
        return video_path
        
    except Exception as e:
        print(f"Error adding subtitles with drawtext: {e}")
        print(traceback.format_exc())
        
        # Clean up temp file if it exists
        if 'temp_output' in locals() and output_path is None and os.path.exists(temp_output):
            try:
                os.unlink(temp_output)
            except:
                pass
                
        return video_path

def format_time(seconds):
    """Converts seconds to h:mm:ss.cc format for ASS subtitles."""
    h = int(seconds / 3600)
    m = int((seconds % 3600) / 60)
    s = int(seconds % 60)
    cs = int((seconds - int(seconds)) * 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"

def add_subtitles_to_shorts(video_path, output_path=None):
    """
    Adds auto-generated subtitles to a YouTube Short video.
    
    Parameters:
    - video_path: Path to the video
    - output_path: Optional output path (if None, modifies in place)
    
    Returns:
    - Path to the video with subtitles
    """
    try:
        print("Starting subtitle generation for YouTube Short...")
        
        # Get transcript with timestamps
        segments = transcribe_with_timestamps(video_path)
        
        if not segments:
            print("No transcript segments were generated.")
            return video_path
            
        # Process segments for short-form content
        processed_segments = process_segments_for_shorts(segments)
        
        if not processed_segments:
            print("No processed segments were created.")
            return video_path
            
        print(f"Generated {len(processed_segments)} subtitle segments for the Short")
        
        # Add subtitles to video
        return add_subtitles_to_video(video_path, processed_segments, output_path)
        
    except Exception as e:
        print(f"Error in subtitle generation: {e}")
        print(traceback.format_exc())
        return video_path

def add_subtitle_to_frame(frame, text, font=None, position='bottom'):
    """
    Utility function to add a subtitle to a single frame.
    Useful for custom subtitle positioning and styling.
    
    Parameters:
    - frame: NumPy array representing the video frame
    - text: Text to add as subtitle
    - font: PIL ImageFont to use (or None for default)
    - position: Where to position the subtitle ('bottom', 'top', 'center')
    
    Returns:
    - Modified frame with subtitle
    """
    # Convert frame to PIL Image
    img = Image.fromarray(frame)
    width, height = img.size
    
    # Create drawing object
    draw = ImageDraw.Draw(img)
    
    # Use default font if none provided
    if font is None:
        try:
            # Try common system fonts first
            font_paths = [
                "Arial", "Helvetica", "DejaVuSans",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                "/Library/Fonts/Arial.ttf",
                "C:\\Windows\\Fonts\\arial.ttf"
            ]
            
            for path in font_paths:
                try:
                    font = ImageFont.truetype(path, 28)
                    break
                except:
                    continue
                    
            # Fall back to default if needed
            if font is None:
                font = ImageFont.load_default()
        except:
            font = ImageFont.load_default()
    
    # Measure text dimensions
    try:
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
    except AttributeError:
        text_width, text_height = draw.textsize(text, font=font)
    
    # Define background area based on position
    margin = 20
    bg_left = max(0, (width - text_width) // 2 - margin)
    bg_right = min(width, bg_left + text_width + 2 * margin)
    
    if position == 'bottom':
        bg_bottom = height - 40
        bg_top = bg_bottom - text_height - margin
    elif position == 'top':
        bg_top = 40
        bg_bottom = bg_top + text_height + margin
    else:  # center
        bg_top = (height - text_height - margin) // 2
        bg_bottom = bg_top + text_height + margin
    
    # Draw semi-transparent background
    draw.rectangle(
        (bg_left, bg_top, bg_right, bg_bottom),
        fill=(0, 0, 0, 180)
    )
    
    # Draw text centered in the background
    text_position = ((width - text_width) // 2, bg_top + margin // 2)
    draw.text(text_position, text, fill=(255, 255, 255, 255), font=font)
    
    # Convert back to NumPy array
    return np.array(img)

def add_text_overlay_to_video(video_path, text_data):
    """
    DEPRECATED: This function is kept for backwards compatibility.
    Please use add_text_overlay_with_images or add_subtitle_overlay instead.
    
    Adds text overlays to an existing video file using FFMPEG.
    """
    print("Warning: Using deprecated text overlay method. Consider using add_text_overlay_with_images instead.")
    
    # Create temporary file for output
    temp_output = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False).name
    
    # Build FFMPEG filters for text overlays
    filters = []
    
    if 'headline' in text_data and text_data['headline']:
        headline = text_data['headline'].replace("'", "'\\''")  # Escape single quotes
        headline_filter = f"drawtext=text='{headline}':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=30"
        filters.append(headline_filter)
    
    if 'cta' in text_data and text_data['cta']:
        cta = text_data['cta'].replace("'", "'\\''")  # Escape single quotes
        cta_filter = f"drawtext=text='{cta}':fontcolor=white:fontsize=20:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=h-60"
        filters.append(cta_filter)
    
    if filters:
        # Combine all filters
        filter_complex = ','.join(filters)
        
        # Build and run FFMPEG command
        cmd = [
            'ffmpeg',
            '-i', video_path,
            '-vf', filter_complex,
            '-c:a', 'copy',
            '-y',
            temp_output
        ]
        
        subprocess.call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Replace original with the version containing text
        if os.path.exists(temp_output) and os.path.getsize(temp_output) > 0:
            os.replace(temp_output, video_path)
            return True
        else:
            os.unlink(temp_output)
            print("Warning: Text overlay failed to produce valid output")
            return False
    
    return False

def create_ad_video(video_path, start_time, duration, output_path, ad_format, ad_text=None, add_subtitles=False):
    """
    Creates an ad video in the specified format with intelligent formatting.
    
    Parameters:
    - video_path: Path to the source video
    - start_time: Start timestamp in seconds
    - duration: Duration in seconds
    - output_path: Path to save the output video
    - ad_format: Format of the ad (youtube_ads, display_ads, performance_max)
    - ad_text: Optional text to overlay (dict with 'headline' and 'cta' keys)
    - add_subtitles: Whether to automatically generate and add subtitles
    
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
    
    # Track if formatting was successful
    formatting_successful = False
    
    # Apply format-specific transformations
    try:
        if ad_format == "display_ads":
            # For Display Ads, create square 1:1 format
            w, h = subclip.size
            size = min(w, h)
            x_center, y_center = w // 2, h // 2
            
            # Try different approaches to create square format
            try:
                # Approach 1: Try FFMPEG cropping
                temp_file = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False).name
                subclip.write_videofile(temp_file, fps=24, logger=None)
                
                # Create square crop filter
                crop_filter = f"crop={size}:{size}:{x_center - size//2}:{y_center - size//2}"
                
                # FFMPEG command
                cmd = [
                    'ffmpeg',
                    '-i', temp_file,
                    '-vf', crop_filter,
                    '-c:a', 'copy',
                    '-y',
                    output_path
                ]
                
                # Run FFMPEG
                subprocess.call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                
                # Check success
                if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                    os.unlink(temp_file)
                    formatting_successful = True
                    print(f"Successfully created square format using FFMPEG: {size}x{size}")
                else:
                    os.unlink(temp_file)
                    print("FFMPEG square crop failed, trying alternative method.")
            except Exception as e:
                print(f"FFMPEG approach for square format failed: {e}")
                
            # Approach 2: Create square manually if FFMPEG failed
            if not formatting_successful:
                try:
                    # Create frame processing function for square crop
                    def make_square_frame(t):
                        frame = subclip.get_frame(t)
                        h, w = frame.shape[:2]
                        size = min(w, h)
                        x = (w - size) // 2
                        y = (h - size) // 2
                        return frame[y:y+size, x:x+size]
                    
                    # Create and write new clip
                    square_clip = VideoClip(make_square_frame, duration=subclip.duration)
                    square_clip.audio = subclip.audio
                    
                    square_clip.write_videofile(output_path, fps=24, logger=None)
                    
                    square_clip.close()
                    formatting_successful = True
                    print(f"Successfully created square format using manual approach: {size}x{size}")
                except Exception as e:
                    print(f"Manual square crop failed: {e}")
        else:
            # For YouTube Ads and Performance Max, use 16:9 format
            w, h = subclip.size
            target_w = w
            target_h = int(9 * target_w / 16)
            
            if h > target_h:
                # Try FFMPEG approach first
                try:
                    # Create temporary file
                    temp_file = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False).name
                    subclip.write_videofile(temp_file, fps=24, logger=None)
                    
                    # Calculate crop
                    y_center = h // 2
                    crop_filter = f"crop={w}:{target_h}:0:{y_center - target_h//2}"
                    
                    # FFMPEG command
                    cmd = [
                        'ffmpeg',
                        '-i', temp_file,
                        '-vf', crop_filter,
                        '-c:a', 'copy',
                        '-y',
                        output_path
                    ]
                    
                    # Run FFMPEG
                    subprocess.call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    
                    # Check success
                    if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                        os.unlink(temp_file)
                        formatting_successful = True
                        print(f"Successfully created 16:9 format using FFMPEG: {w}x{target_h}")
                    else:
                        os.unlink(temp_file)
                        print("FFMPEG 16:9 crop failed, trying alternative method.")
                except Exception as e:
                    print(f"FFMPEG approach for 16:9 format failed: {e}")
                
                # Manual approach if FFMPEG failed
                if not formatting_successful:
                    try:
                        # Create frame processing function for 16:9 crop
                        def make_16_9_frame(t):
                            frame = subclip.get_frame(t)
                            h, w = frame.shape[:2]
                            target_h = int(w * 9 / 16)
                            y_center = h // 2
                            y1 = max(0, y_center - target_h // 2)
                            y2 = min(h, y1 + target_h)
                            return frame[y1:y2, :]
                        
                        # Create and write new clip
                        widescreen_clip = VideoClip(make_16_9_frame, duration=subclip.duration)
                        widescreen_clip.audio = subclip.audio
                        
                        widescreen_clip.write_videofile(output_path, fps=24, logger=None)
                        
                        widescreen_clip.close()
                        formatting_successful = True
                        print(f"Successfully created 16:9 format using manual approach: {w}x{target_h}")
                    except Exception as e:
                        print(f"Manual 16:9 crop failed: {e}")
            else:
                # Video already has correct proportions or needs padding
                try:
                    # Just output the subclip as-is if in correct proportion
                    subclip.write_videofile(output_path, fps=24, logger=None)
                    formatting_successful = True
                    print(f"Video already has appropriate dimensions, no formatting needed: {w}x{h}")
                except Exception as e:
                    print(f"Error writing video: {e}")
    except Exception as e:
        print(f"Format-specific transformation failed: {e}")
        print(traceback.format_exc())
    
    # If all formatting approaches failed, just output original subclip
    if not formatting_successful:
        print("All formatting approaches failed. Writing original subclip.")
        try:
            subclip.write_videofile(output_path, fps=24, logger=None)
        except Exception as e:
            print(f"Error writing fallback video: {e}")
            return None
    
    # Add text overlays if provided
    if ad_text and os.path.exists(output_path):
        try:
            # Try enhanced text overlay approach first
            overlay_result = add_text_overlay_with_images(output_path, ad_text)
            
            # If that fails, try simpler subtitle approach
            if not overlay_result and isinstance(ad_text, dict):
                if 'headline' in ad_text and ad_text['headline']:
                    add_subtitle_overlay(output_path, ad_text['headline'], position='top')
                elif 'cta' in ad_text and ad_text['cta']:
                    add_subtitle_overlay(output_path, ad_text['cta'], position='bottom')
        except Exception as e:
            print(f"Could not add text overlays: {e}")
            print(traceback.format_exc())
    
    # Add auto-generated subtitles if requested
    if add_subtitles and os.path.exists(output_path):
        try:
            print("Adding auto-generated subtitles to the video...")
            add_subtitles_to_shorts(output_path)
        except Exception as e:
            print(f"Could not add auto-generated subtitles: {e}")
            print(traceback.format_exc())
    
    # Clean up
    try:
        clip.close()
        subclip.close()
    except Exception as e:
        print(f"Warning during cleanup: {e}")
    
    return output_path

def generate_thumbnail(video_path, timestamp, output_path, add_text=None):
    """
    Generates a thumbnail from a video frame, formatted for vertical display.
    
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
    
    # Get original dimensions
    width, height = image.size
    target_width = int(height * 9 / 16)  # For 9:16 ratio
    
    # Use similar content detection as video function for consistency
    # Simple edge detection to find important content
    gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray_frame, 100, 200)
    kernel = np.ones((5, 5), np.uint8)
    dilated = cv2.dilate(edges, kernel, iterations=2)
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Get bounding boxes for significant contours
    boxes = [cv2.boundingRect(c) for c in contours if cv2.contourArea(c) > 500]
    
    # If we found important content
    if boxes:
        # Find content bounds
        left_bounds = [x for (x, y, w, h) in boxes]
        right_bounds = [x + w for (x, y, w, h) in boxes]
        content_left = min(left_bounds)
        content_right = max(right_bounds)
        content_center = content_left + (content_right - content_left) // 2
        
        # Create crop boundaries centered on content
        left = max(0, content_center - target_width // 2)
        right = min(width, left + target_width)
        
        # Adjust if at frame edges
        if left == 0:
            right = min(width, target_width)
        elif right == width:
            left = max(0, width - target_width)
    else:
        # No significant content found, use center crop
        x_center = width // 2
        left = max(0, x_center - target_width // 2)
        right = min(width, left + target_width)
    
    # Perform the crop
    if width > target_width:  # Only crop if needed
        image = image.crop((left, 0, right, height))
    
    # Add text using the same approach as video overlays for consistency
    if add_text and isinstance(add_text, dict):
        try:
            # Try to find a common font
            try:
                for font_name in ["Arial", "Helvetica", "DejaVuSans", "FreeSans", "Liberation Sans"]:
                    try:
                        font_paths = [
                            f"{font_name}",
                            f"/usr/share/fonts/truetype/{font_name}.ttf",
                            f"/Library/Fonts/{font_name}.ttf",
                            f"C:\\Windows\\Fonts\\{font_name}.ttf"
                        ]
                        
                        headline_font = None
                        cta_font = None
                        
                        # Try each potential path
                        for path in font_paths:
                            try:
                                headline_font = ImageFont.truetype(path, 24)
                                cta_font = ImageFont.truetype(path, 20)
                                break
                            except:
                                continue
                        
                        if headline_font and cta_font:
                            break
                    except:
                        continue
                
                # If we still don't have fonts, use default
                if not headline_font:
                    headline_font = ImageFont.load_default()
                    cta_font = ImageFont.load_default()
            except:
                # Fallback to default font
                headline_font = ImageFont.load_default()
                cta_font = ImageFont.load_default()
            
            draw = ImageDraw.Draw(image)
            
            # Add headline at the top
            if 'headline' in add_text and add_text['headline']:
                headline = add_text['headline']
                
                # Get text dimensions
                try:
                    text_bbox = draw.textbbox((0, 0), headline, font=headline_font)
                    text_width = text_bbox[2] - text_bbox[0]
                    text_height = text_bbox[3] - text_bbox[1]
                except AttributeError:
                    text_width, text_height = draw.textsize(headline, font=headline_font)
                
                text_x = (image.width - text_width) // 2
                text_y = 20
                
                # Draw background rectangle
                draw.rectangle(
                    (0, text_y, image.width, text_y + text_height + 10), 
                    fill=(0, 0, 0, 180)
                )
                # Draw text
                draw.text((text_x, text_y + 5), headline, fill=(255, 255, 255), font=headline_font)
            
            # Add CTA at the bottom
            if 'cta' in add_text and add_text['cta']:
                cta = add_text['cta']
                
                # Get text dimensions
                try:
                    text_bbox = draw.textbbox((0, 0), cta, font=cta_font)
                    text_width = text_bbox[2] - text_bbox[0]
                    text_height = text_bbox[3] - text_bbox[1]
                except AttributeError:
                    text_width, text_height = draw.textsize(cta, font=cta_font)
                
                text_x = (image.width - text_width) // 2
                text_y = image.height - text_height - 30
                
                # Draw background rectangle
                draw.rectangle(
                    (0, text_y, image.width, text_y + text_height + 10), 
                    fill=(0, 0, 0, 180)
                )
                # Draw text
                draw.text((text_x, text_y + 5), cta, fill=(255, 255, 255), font=cta_font)
        except Exception as e:
            print(f"Could not add text to thumbnail: {e}")
            print(traceback.format_exc())
    
    # Save the thumbnail
    image.save(output_path)
    
    return output_path