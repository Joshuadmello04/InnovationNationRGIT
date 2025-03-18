import cv2
import torch
from PIL import Image
from transformers import CLIPProcessor, CLIPModel

def find_engaging_moments(video_path, top_n=3):
    """
    Analyzes video frames using CLIP to identify the most engaging moments.
    
    Parameters:
    - video_path: Path to the video file
    - top_n: Number of top moments to return
    
    Returns:
    - top_moments: List of frame indices for the most engaging moments
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
    def score_frames(frames, text_queries=None):
        if text_queries is None:
            text_queries = ["exciting moment", "visually stunning scene", "emotionally powerful moment"]
        
        all_scores = []
        
        for frame in frames:
            # Convert frame to PIL image
            image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            
            frame_scores = []
            for query in text_queries:
                # Process the image and text
                inputs = processor(text=[query], images=image, return_tensors="pt", padding=True)
                outputs = model(**inputs)
                score = outputs.logits_per_image.item()
                frame_scores.append(score)
            
            # Average the scores for different queries
            all_scores.append(sum(frame_scores) / len(frame_scores))

        return all_scores

    # Extract frames
    frames = extract_frames(video_path)
    print(f"Extracted {len(frames)} frames for analysis")

    # Score frames
    scores = score_frames(frames)

    # Get the top N engaging moments
    top_moments = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_n]
    return top_moments

def frames_to_timestamps(frame_indices, video_path):
    """
    Converts frame indices to timestamps (in seconds).
    
    Parameters:
    - frame_indices: List of frame indices
    - video_path: Path to the video file
    
    Returns:
    - timestamps: List of timestamps in seconds
    """
    cap = cv2.VideoCapture(video_path)
    frame_rate = cap.get(cv2.CAP_PROP_FPS)
    cap.release()

    timestamps = [frame_index / frame_rate for frame_index in frame_indices]
    return timestamps