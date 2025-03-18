# app.py

# Install dependencies first:
# pip install openai-whisper moviepy torch torchvision transformers pillow opencv-python requests
import os
import whisper
from moviepy.video.io.VideoFileClip import VideoFileClip
import torch
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import cv2
import requests

# ----------------------------
# Step 1.1: Transcribe the video using Whisper
# ----------------------------

def transcribe_video(video_path):
    """
    Transcribes the audio from a video file using Whisper.
    """
    # Load the Whisper model
    model = whisper.load_model("base",device="cpu")  # Use "small", "medium", or "large" for better accuracy

    # Extract audio from the video
    def extract_audio(video_path, audio_path="audio.mp3"):
        video = VideoFileClip(video_path)
        video.audio.write_audiofile(audio_path)
        return audio_path

    # Transcribe the audio
    audio_path = extract_audio(video_path)

    # Explicitly set the path to FFmpeg (if needed)
    os.environ["PATH"] += os.pathsep + "C:\\ffmpeg\\bin"  # Replace with your FFmpeg path

    result = model.transcribe(audio_path)
    return result["text"]

# ----------------------------
# Step 1.2: Analyze video frames using CLIP to find engaging moments
# ----------------------------

def find_engaging_moments(video_path, top_n=3):
    """
    Analyzes video frames using CLIP to identify the most engaging moments.
    """
    # Load the CLIP model and processor
    model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

    # Extract frames from the video
    def extract_frames(video_path, fps=1):
        cap = cv2.VideoCapture(video_path)
        frames = []
        frame_count = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break
            if frame_count % int(cap.get(cv2.CAP_PROP_FPS) / fps) == 0:
                frames.append(frame)
            frame_count += 1

        cap.release()
        return frames

    # Score frames based on engagement
    def score_frames(frames, text_query="exciting moment"):
        scores = []
        for frame in frames:
            # Convert frame to PIL image
            image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

            # Process the image and text
            inputs = processor(text=[text_query], images=image, return_tensors="pt", padding=True)
            outputs = model(**inputs)
            logits_per_image = outputs.logits_per_image
            scores.append(logits_per_image.item())

        return scores

    # Extract frames
    frames = extract_frames(video_path)

    # Score frames
    scores = score_frames(frames)

    # Get the top N engaging moments
    top_moments = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_n]
    return top_moments

# ----------------------------
# Step 1.3: Map frame indices to timestamps
# ----------------------------

def frames_to_timestamps(frame_indices, video_path):
    """
    Converts frame indices to timestamps (in seconds).
    """
    cap = cv2.VideoCapture(video_path)
    frame_rate = cap.get(cv2.CAP_PROP_FPS)
    cap.release()

    timestamps = [frame_index / frame_rate for frame_index in frame_indices]
    return timestamps

# ----------------------------
# Step 2: Generate Insights with Zephyr
# ----------------------------

def generate_insights(transcript):
    """
    Generates insights from the video transcript using Zephyr.
    """
    prompt = f"""
    Analyze the following video transcript and generate insights:
    - Key themes
    - High-impact moments
    - Audience engagement points
    - Content performance predictions

    Transcript:
    {transcript}
    """

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "zephyr",
            "prompt": prompt,
            "stream": False
        }
    )
    return response.json()["response"]

# ----------------------------
# Step 3: Generate Ad Creatives with Zephyr
# ----------------------------

def generate_ad_creatives(transcript, ad_format="YouTube Ads"):
    """
    Generates ad creatives (headlines, descriptions, and video snippets) using Zephyr.
    """
    prompt = f"""
    Generate ad creatives for the following video transcript:
    - Headline
    - Description
    - Video snippet ideas

    Ad Format: {ad_format}
    Transcript:
    {transcript}
    """

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "zephyr",
            "prompt": prompt,
            "stream": False
        }
    )
    return response.json()["response"]

# ----------------------------
# Step 4: Create YouTube Shorts
# ----------------------------

def create_youtube_short(video_path, start_time, end_time, output_path):
    """
    Creates a YouTube Short by clipping a segment from the video.
    """
    # Load the video
    clip = VideoFileClip(video_path)

    # Extract the subclip
    subclip = clip.subclipped(start_time, end_time)

    # Write the subclip to the output file
    subclip.write_videofile(output_path, fps=24)

    # Close the clips to free up resources
    clip.close()
    subclip.close()

# ----------------------------
# Step 5: Generate Thumbnails
# ----------------------------

def generate_thumbnail(prompt):
    """
    Generates a thumbnail using Stable Diffusion.
    """
    from diffusers import StableDiffusionPipeline

    pipe = StableDiffusionPipeline.from_pretrained("stabilityai/stable-diffusion-2-1")
    pipe = pipe.to("cuda")

    image = pipe(prompt).images[0]
    return image

# ----------------------------
# Main Workflow
# ----------------------------

def main(video_path):
    """
    Main workflow to transcribe a video, generate insights, and create YouTube Shorts and ad creatives.
    """
    # Step 1.1: Transcribe the video
    print("Transcribing video...")
    transcript = transcribe_video(video_path)
    print("\nTranscript:")
    print(transcript)

    # Step 1.2: Identify engaging moments
    print("\nAnalyzing video for engaging moments...")
    engaging_moments = find_engaging_moments(video_path, top_n=3)
    print("Engaging moments (frame indices):", engaging_moments)

    # Step 1.3: Convert frame indices to timestamps
    timestamps = frames_to_timestamps(engaging_moments, video_path)
    print("Engaging moments (timestamps in seconds):", timestamps)

    # Step 2: Generate Insights
    print("\nGenerating insights...")
    insights = generate_insights(transcript)
    print("\nInsights:")
    print(insights)

    # Step 3: Generate Ad Creatives
    print("\nGenerating ad creatives...")
    ad_creatives = generate_ad_creatives(transcript, ad_format="YouTube Ads")
    print("\nAd Creatives:")
    print(ad_creatives)

    # Step 4: Create YouTube Shorts
    print("\nCreating YouTube Shorts...")
    start_time = timestamps[0]  # Use the first engaging moment
    end_time = start_time + 15  # Create a 15-second short
    output_path = "youtube_short.mp4"
    create_youtube_short(video_path, start_time, end_time, output_path)
    print(f"\nYouTube Short created: {output_path}")

    # Step 5: Generate Thumbnails
    print("\nGenerating thumbnail...")
    thumbnail_prompt = "A futuristic AI-powered video editing tool"
    thumbnail = generate_thumbnail(thumbnail_prompt)
    thumbnail.save("thumbnail.png")
    print("Thumbnail saved: thumbnail.png")

# ----------------------------
# Run the script
# ----------------------------

if __name__ == "__main__":
    # Input video path
    video_path = "your_video.mp4"  # Replace with your video file path

    # Run the main workflow
    main(video_path)