from .mood_analyzer import MoodAnalyzer

def mood_colors(request):
    """
    Add mood colors to the template context
    """
    # Get the character from the request if it exists (for character detail/chat pages)
    character = None
    if hasattr(request, 'resolver_match') and request.resolver_match:
        if request.resolver_match.kwargs.get('character_id'):
            from .models import Character
            try:
                character_id = request.resolver_match.kwargs.get('character_id')
                character = Character.objects.filter(
                    id=character_id, 
                    world__user=request.user
                ).first()
            except:
                character = None
    
    if character:
        # Get colors based on character's current mood
        colors = MoodAnalyzer.get_mood_colors(character.current_mood, character.mood_intensity)
        mood_data = {
            'character_mood': character.current_mood,
            'mood_intensity': character.mood_intensity,
            'mood_colors': colors
        }
    else:
        # Default colors when no character is active
        colors = MoodAnalyzer.get_mood_colors('neutral', 50)
        mood_data = {
            'character_mood': 'neutral',
            'mood_intensity': 50,
            'mood_colors': colors
        }
    
    return mood_data