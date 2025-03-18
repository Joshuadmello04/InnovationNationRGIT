import requests
import json

def generate_insights(transcript):
    """
    Generates insights from the video transcript using Zephyr.
    
    Parameters:
    - transcript: The video transcript text
    
    Returns:
    - insights: Generated insights text
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

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "zephyr",
                "prompt": prompt,
                "stream": False
            }
        )
        return response.json()["response"]
    except Exception as e:
        print(f"Error generating insights: {e}")
        return "Could not generate insights. Make sure Zephyr is running and accessible."

def generate_ad_creatives(transcript, ad_format="YouTube Ads"):
    """
    Generates ad creatives (headlines, descriptions, and video snippets) using Zephyr.
    
    Parameters:
    - transcript: The video transcript text
    - ad_format: The target ad format (YouTube Ads, Display Ads, Performance Max)
    
    Returns:
    - ad_creatives: Generated ad creative text
    """
    # Customize prompt based on ad format
    if ad_format == "YouTube Ads":
        prompt_details = """
        - Compelling headline (max 60 characters)
        - Engaging description (max 90 characters)
        - Call-to-action that drives clicks
        """
    elif ad_format == "Display Ads":
        prompt_details = """
        - Short, attention-grabbing headline (max 30 characters)
        - Visually descriptive text (max 90 characters)
        - Clear call-to-action
        """
    elif ad_format == "Performance Max":
        prompt_details = """
        - Conversion-focused headline (max 30 characters)
        - Benefit-driven description (max 90 characters)
        - Strong call-to-action that drives immediate response
        """
    else:
        prompt_details = """
        - Headline
        - Description
        - Call-to-action
        """

    prompt = f"""
    Generate ad creatives for the following video transcript:
    {prompt_details}
    - Video snippet suggestions (what moments to highlight)

    Ad Format: {ad_format}
    Transcript:
    {transcript}
    
    Format the response as JSON with the following structure:
    {{
        "headline": "Your headline here",
        "description": "Your description here",
        "call_to_action": "Your CTA here",
        "video_snippets": ["Snippet 1", "Snippet 2"]
    }}
    """

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "zephyr",
                "prompt": prompt,
                "stream": False
            }
        )
        response_text = response.json()["response"]
        
        # Try to parse as JSON, but handle cases where the model doesn't return valid JSON
        try:
            creatives = json.loads(response_text)
            return creatives
        except json.JSONDecodeError:
            # If not valid JSON, return the raw text
            return {"raw_text": response_text}
            
    except Exception as e:
        print(f"Error generating ad creatives: {e}")
        return {
            "headline": f"Engaging {ad_format} Content",
            "description": "Discover what makes this content special",
            "call_to_action": "Learn More"
        }