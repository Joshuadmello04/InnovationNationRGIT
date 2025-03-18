#backend/modules/utils.py
import os
import json
import datetime

def ensure_dir(directory):
    """Create directory if it doesn't exist."""
    if not os.path.exists(directory):
        os.makedirs(directory)

def save_metadata(metadata, output_path):
    """
    Saves metadata to a JSON file.
    
    Parameters:
    - metadata: Dictionary containing metadata
    - output_path: Path to save the JSON file
    """
    # Create the output directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(metadata, f, indent=2)
        
def generate_output_filename(platform, extension="mp4"):
    """
    Generates a unique filename for outputs.
    
    Parameters:
    - platform: Platform name (youtube_shorts, youtube_ads, etc.)
    - extension: File extension (mp4, png, json, etc.)
    
    Returns:
    - Filename with timestamp
    """
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{platform}_{timestamp}.{extension}"

def predict_engagement(content_data, platform):
    """
    Simple rule-based prediction of content engagement.
    
    Parameters:
    - content_data: Dictionary with content details
    - platform: Target platform
    
    Returns:
    - Dictionary with engagement prediction and suggestions
    """
    # Simple rule-based scoring
    score = 60  # Default base score
    suggestions = []
    
    # Duration-based scoring
    duration = content_data.get('duration', 0)
    
    if platform == 'youtube_shorts':
        if 15 <= duration <= 60:
            score += 15
        elif duration < 15:
            score -= 10
            suggestions.append("YouTube Shorts perform better when they're at least 15 seconds long")
    elif platform == 'youtube_ads':
        if 15 <= duration <= 30:
            score += 10
        elif duration > 30:
            score -= 10
            suggestions.append("Consider shorter ad durations (15-30s) for better completion rates")
    elif platform == 'display_ads':
        if duration <= 10:
            score += 15
        else:
            score -= 15
            suggestions.append("Display ads should be very short (under 10 seconds)")
    elif platform == 'performance_max':
        if 10 <= duration <= 30:
            score += 10
        elif duration > 30:
            score -= 5
            suggestions.append("Performance Max ads work best when under 30 seconds")
    
    # Add text-based suggestions
    if 'headline' in content_data and content_data['headline']:
        headline_len = len(content_data['headline'])
        if headline_len > 50:
            suggestions.append("Consider shortening your headline for better impact")
    
    if 'call_to_action' in content_data and content_data['call_to_action']:
        cta_len = len(content_data['call_to_action'])
        if cta_len > 20:
            suggestions.append("Shorter CTAs typically drive better conversion rates")
    
    # Ensure score is in 0-100 range
    score = max(0, min(100, score))
    
    return {
        "predicted_engagement": score,
        "engagement_level": "High" if score >= 75 else "Medium" if score >= 50 else "Low",
        "suggestions": suggestions
    }