"""
Dreamscribe AI - Context processors

This module contains context processors for the Django application.
"""
from .models import Character
from .mood_analyzer import get_mood_colors

def mood_colors(request):
    """
    Add mood colors to the template context
    
    This context processor provides dynamic color variables
    based on the character's current mood.
    """
    character_id = None
    
    # Check if we're on a character page
    if 'character_id' in request.resolver_match.kwargs:
        character_id = request.resolver_match.kwargs['character_id']
    
    if character_id:
        try:
            # Get the character
            character = Character.objects.get(id=character_id)
            
            # Get mood colors based on character's current mood
            colors = get_mood_colors(character.current_mood, character.mood_intensity)
            
            # Convert primary color to RGB for CSS variables
            primary_hex = colors['primary'].lstrip('#')
            r, g, b = tuple(int(primary_hex[i:i+2], 16) for i in (0, 2, 4))
            
            # Add RGB values to context
            colors['primary_rgb'] = f"{r}, {g}, {b}"
            
            return {
                'mood_colors': colors,
                'character_mood': character.current_mood,
                'mood_intensity': character.mood_intensity
            }
        except Character.DoesNotExist:
            pass
    
    # Default colors (neutral mood)
    default_colors = get_mood_colors('neutral', 50)
    default_hex = default_colors['primary'].lstrip('#')
    r, g, b = tuple(int(default_hex[i:i+2], 16) for i in (0, 2, 4))
    default_colors['primary_rgb'] = f"{r}, {g}, {b}"
    
    return {
        'mood_colors': default_colors,
        'character_mood': 'neutral',
        'mood_intensity': 50
    }