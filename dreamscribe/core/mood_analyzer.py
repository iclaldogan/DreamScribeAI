"""
Dreamscribe AI - Mood Analyzer Module

This module analyzes character responses to determine their emotional state,
then provides mood information and associated color schemes.
"""
import os
import json
import google.generativeai as genai
from django.conf import settings
from django.utils import timezone

# Configure the Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)

# Base mood colors with different intensities
MOOD_COLORS = {
    'neutral': {
        'primary': '#6B7280',  # Gray
        'secondary': '#4B5563',
        'accent': '#374151',
        'text': '#F3F4F6'
    },
    'happy': {
        'primary': '#FFB703',  # Golden Yellow
        'secondary': '#FB8500',
        'accent': '#FAA307',
        'text': '#FFFFFF'
    },
    'excited': {
        'primary': '#F59E0B',  # Amber
        'secondary': '#D97706',
        'accent': '#B45309',
        'text': '#FFFFFF'
    },
    'angry': {
        'primary': '#EF4444',  # Red
        'secondary': '#DC2626',
        'accent': '#B91C1C',
        'text': '#FFFFFF'
    },
    'sad': {
        'primary': '#3B82F6',  # Blue
        'secondary': '#2563EB',
        'accent': '#1D4ED8',
        'text': '#FFFFFF'
    },
    'thoughtful': {
        'primary': '#8B5CF6',  # Purple
        'secondary': '#7C3AED',
        'accent': '#6D28D9',
        'text': '#FFFFFF'
    },
    'confused': {
        'primary': '#10B981',  # Emerald
        'secondary': '#059669',
        'accent': '#047857',
        'text': '#FFFFFF'
    },
    'scared': {
        'primary': '#EC4899',  # Pink
        'secondary': '#DB2777',
        'accent': '#BE185D',
        'text': '#FFFFFF'
    }
}

def adjust_color_intensity(hex_color, intensity_factor):
    """
    Adjust color intensity based on the mood intensity
    
    Args:
        hex_color: The base hex color
        intensity_factor: Factor to adjust (0-1, where 1 is full intensity)
        
    Returns:
        New hex color with adjusted intensity
    """
    # Convert hex to RGB
    hex_color = hex_color.lstrip('#')
    r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
    
    # Get background color for blending (assuming dark theme)
    bg_r, bg_g, bg_b = 30, 30, 35  # Dark background
    
    # Blend with background based on intensity
    new_r = int(r * intensity_factor + bg_r * (1 - intensity_factor))
    new_g = int(g * intensity_factor + bg_g * (1 - intensity_factor))
    new_b = int(b * intensity_factor + bg_b * (1 - intensity_factor))
    
    # Convert back to hex
    return f'#{new_r:02x}{new_g:02x}{new_b:02x}'

def get_mood_colors(mood, intensity):
    """
    Get color scheme for a specific mood with adjusted intensity
    
    Args:
        mood: The mood name (string)
        intensity: The intensity value (0-100)
        
    Returns:
        Dict with color values
    """
    if mood not in MOOD_COLORS:
        mood = 'neutral'
        
    # Get base colors for this mood
    base_colors = MOOD_COLORS[mood]
    
    # Calculate intensity factor (0-1)
    intensity_factor = min(max(intensity / 100, 0), 1)
    
    # Only adjust if intensity is less than 100%
    if intensity_factor < 1:
        return {
            'primary': adjust_color_intensity(base_colors['primary'], intensity_factor),
            'secondary': adjust_color_intensity(base_colors['secondary'], intensity_factor),
            'accent': adjust_color_intensity(base_colors['accent'], intensity_factor),
            'text': base_colors['text']
        }
    
    return base_colors

def analyze_character_mood(text, character_info=None):
    """
    Analyze text to determine character's mood
    
    Args:
        text: The character's response text
        character_info: Optional dict with character information
        
    Returns:
        Dict with mood information
    """
    # Default response in case API call fails
    default_response = {
        'mood': 'neutral',
        'intensity': 50,
        'explanation': 'No mood detected.'
    }
    
    try:
        # Prepare prompt for Gemini
        prompt = f"""
        Analyze the emotional state/mood in this character response:
        
        "{text}"
        
        Respond with a JSON object with the following structure:
        {{
            "mood": "one of [happy, sad, angry, excited, thoughtful, confused, scared, neutral]",
            "intensity": "number between 0-100 representing the intensity of the mood",
            "explanation": "brief explanation of why you determined this mood"
        }}
        
        Only output the JSON object, nothing else.
        """
        
        if character_info:
            prompt += f"""
            
            Additional character context:
            - Name: {character_info.get('name', 'Unknown')}
            - Personality: {character_info.get('personality', 'Not provided')}
            - Base temperament: {character_info.get('temperament', 'Not provided')}
            """
        
        # Get response from Gemini
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        response_text = response.text
        
        # Try to parse the JSON response
        try:
            # Find JSON object in the response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                mood_data = json.loads(json_str)
                
                # Validate the response
                if 'mood' in mood_data and 'intensity' in mood_data:
                    # Ensure mood is a valid option
                    valid_moods = ['happy', 'sad', 'angry', 'excited', 'thoughtful', 'confused', 'scared', 'neutral']
                    if mood_data['mood'].lower() not in valid_moods:
                        mood_data['mood'] = 'neutral'
                    else:
                        mood_data['mood'] = mood_data['mood'].lower()
                    
                    # Ensure intensity is in range 0-100
                    mood_data['intensity'] = min(max(float(mood_data['intensity']), 0), 100)
                    
                    # Get colors based on mood and intensity
                    mood_data['colors'] = get_mood_colors(mood_data['mood'], mood_data['intensity'])
                    
                    return mood_data
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Error parsing mood analysis response: {e}")
            print(f"Response was: {response_text}")
        
        return default_response
        
    except Exception as e:
        print(f"Error in mood analysis: {e}")
        return default_response

def update_character_mood(character, text):
    """
    Update a character's mood based on their response
    
    Args:
        character: Character model instance
        text: The character's response text
        
    Returns:
        Updated character
    """
    # Get character info for context
    character_info = {
        'name': character.name,
        'personality': character.personality
    }
    
    # Analyze mood
    mood_data = analyze_character_mood(text, character_info)
    
    # Update character's mood
    character.current_mood = mood_data['mood']
    character.mood_intensity = int(mood_data['intensity'])
    
    # If character memory is missing a mood_history array, create it
    if not character.memory:
        character.memory = {}
    
    if 'mood_history' not in character.memory:
        character.memory['mood_history'] = []
    
    # Add to mood history (limit to last 10)
    mood_entry = {
        'mood': mood_data['mood'],
        'intensity': mood_data['intensity'],
        'timestamp': str(timezone.now().isoformat()),
        'trigger_text': text[:100] + '...' if len(text) > 100 else text
    }
    
    character.memory['mood_history'].append(mood_entry)
    
    # Keep only the last 10 entries
    if len(character.memory['mood_history']) > 10:
        character.memory['mood_history'] = character.memory['mood_history'][-10:]
    
    # Save the character
    character.save()
    
    return character