"""
Dreamscribe AI - Mood Analyzer

This module analyzes character responses to determine their mood and intensity.
It is used to dynamically update character moods during conversations.
"""
import os
import json
import random
import google.generativeai as genai
from django.conf import settings

# Configure the Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)

# Define mood categories and their associated descriptors
MOOD_CATEGORIES = {
    'neutral': ['neutral', 'calm', 'balanced', 'composed', 'steady', 'reserved'],
    'happy': ['happy', 'joyful', 'pleased', 'delighted', 'cheerful', 'content', 'excited', 'elated', 'ecstatic', 'thrilled'],
    'sad': ['sad', 'melancholy', 'gloomy', 'depressed', 'somber', 'downcast', 'unhappy', 'miserable', 'sorrowful', 'grieving'],
    'angry': ['angry', 'irritated', 'annoyed', 'enraged', 'furious', 'hostile', 'aggravated', 'indignant', 'outraged', 'resentful'],
    'fearful': ['fearful', 'afraid', 'anxious', 'nervous', 'terrified', 'scared', 'apprehensive', 'worried', 'uneasy', 'panicked'],
    'curious': ['curious', 'inquisitive', 'interested', 'intrigued', 'questioning', 'wondering', 'fascinated', 'investigative', 'probing', 'attentive'],
    'excited': ['excited', 'enthusiastic', 'eager', 'energetic', 'animated', 'lively', 'stimulated', 'exhilarated', 'thrilled', 'zealous'],
    'thoughtful': ['thoughtful', 'contemplative', 'reflective', 'pensive', 'meditative', 'philosophical', 'analytical', 'pondering', 'deliberative', 'introspective'],
    'confused': ['confused', 'bewildered', 'puzzled', 'perplexed', 'disoriented', 'uncertain', 'ambivalent', 'baffled', 'befuddled', 'muddled'],
}

def update_character_mood(character, text):
    """
    Update a character's mood based on text analysis
    
    Args:
        character: Character model instance
        text: Text to analyze for mood (usually character's response)
        
    Returns:
        Tuple (mood, intensity) of the updated mood
    """
    mood_data = analyze_mood(text)
    
    if mood_data:
        # Update character's mood
        character.current_mood = mood_data['mood']
        character.mood_intensity = mood_data['intensity']
        character.save()
        
        return mood_data['mood'], mood_data['intensity']
    
    return character.current_mood, character.mood_intensity

def analyze_mood(text):
    """
    Analyze text to determine mood and intensity
    
    Args:
        text: Text to analyze
        
    Returns:
        Dictionary with mood and intensity
    """
    # If development mode or no API key, return a random mood (for testing)
    if settings.DEBUG and not settings.GEMINI_API_KEY:
        return {
            'mood': random.choice(list(MOOD_CATEGORIES.keys())),
            'intensity': random.randint(40, 90)
        }
    
    # Prepare prompt for AI
    prompt = f"""
Analyze the following text and determine the emotional mood of the speaker and its intensity.

Text: "{text}"

Respond with ONLY a JSON object in this format:
{{
  "mood": "one of [neutral, happy, sad, angry, fearful, curious, excited, thoughtful, confused]", 
  "intensity": "a number between 1 and 100 indicating the intensity of the mood"
}}

For example: {{"mood": "happy", "intensity": 85}}
"""

    try:
        # Generate response with Gemini
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Extract the JSON object
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1
        
        if start_idx >= 0 and end_idx > start_idx:
            json_str = response_text[start_idx:end_idx]
            mood_data = json.loads(json_str)
            
            # Validate the mood category
            if 'mood' in mood_data and mood_data['mood'] in MOOD_CATEGORIES:
                # Ensure intensity is within bounds
                if 'intensity' in mood_data:
                    intensity = int(mood_data['intensity'])
                    mood_data['intensity'] = max(1, min(100, intensity))
                    return mood_data
        
        # Fallback to simple keyword analysis
        return analyze_mood_keywords(text)
    
    except Exception as e:
        print(f"Error analyzing mood: {e}")
        return analyze_mood_keywords(text)

def analyze_mood_keywords(text):
    """
    Analyze text to determine mood using keyword matching (fallback method)
    
    Args:
        text: Text to analyze
        
    Returns:
        Dictionary with mood and intensity
    """
    text = text.lower()
    mood_scores = {mood: 0 for mood in MOOD_CATEGORIES}
    
    # Count occurrences of mood-related words
    for mood, keywords in MOOD_CATEGORIES.items():
        for keyword in keywords:
            if keyword in text:
                mood_scores[mood] += 1
    
    # Find the dominant mood
    dominant_mood = max(mood_scores.items(), key=lambda x: x[1])
    
    # If no mood detected, default to neutral
    if dominant_mood[1] == 0:
        return {
            'mood': 'neutral',
            'intensity': 50
        }
    
    # Calculate intensity based on word frequency and text length
    # Higher word frequency and shorter text = higher intensity
    word_count = len(text.split())
    frequency = dominant_mood[1]
    intensity = min(100, max(20, int(frequency * 20 + 30 * (50 / max(word_count, 1)))))
    
    return {
        'mood': dominant_mood[0],
        'intensity': intensity
    }

def get_mood_color(mood, intensity=None):
    """
    Get a color hex code for a given mood and intensity
    
    Args:
        mood: Mood string (one of the MOOD_CATEGORIES keys)
        intensity: Optional intensity value (1-100)
        
    Returns:
        Hex color code
    """
    base_colors = {
        'neutral': '#A0A0A0',  # Gray
        'happy': '#FFD700',    # Gold
        'sad': '#6495ED',      # Cornflower Blue
        'angry': '#FF4500',    # Red-Orange
        'fearful': '#800080',  # Purple
        'curious': '#32CD32',  # Lime Green
        'excited': '#FF1493',  # Deep Pink
        'thoughtful': '#4682B4', # Steel Blue
        'confused': '#FF8C00',  # Dark Orange
    }
    
    if mood not in base_colors:
        return base_colors['neutral']
    
    if intensity is None:
        return base_colors[mood]
    
    # Adjust color saturation based on intensity
    # This is a simple implementation; more sophisticated color adjustment is possible
    return base_colors[mood]