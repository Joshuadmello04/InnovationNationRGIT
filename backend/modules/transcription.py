import os
import whisper
from moviepy.video.io.VideoFileClip import VideoFileClip

def transcribe_video(video_path):
    """
    Transcribes the audio from a video file using Whisper.
    
    Parameters:
    - video_path: Path to the video file
    
    Returns:
    - transcript: The transcribed text
    """
    # Load the Whisper model
    model = whisper.load_model("base", device="cpu")  # Use "small", "medium", or "large" for better accuracy

    # Extract audio from the video
    def extract_audio(video_path, audio_path="audio.mp3"):
        video = VideoFileClip(video_path)
        video.audio.write_audiofile(audio_path)
        return audio_path

    # Transcribe the audio
    audio_path = extract_audio(video_path)

    # Explicitly set the path to FFmpeg
    os.environ["PATH"] += os.pathsep + r"C:\ffmpeg\ffmpeg-master-latest-win64-gpl-shared\bin"

    # Perform the transcription
    result = model.transcribe(audio_path)
    
    # Clean up the temporary audio file
    if os.path.exists(audio_path):
        os.remove(audio_path)
        
    return result["text"]