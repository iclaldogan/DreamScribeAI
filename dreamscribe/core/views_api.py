"""
Dreamscribe AI - API Views

This module contains API views for character mood analysis and other AJAX functionality.
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required

from .models import Character
from .mood_analyzer import analyze_character_mood, get_mood_colors, update_character_mood

@login_required
def get_character_mood(request, character_id):
    """
    API endpoint to get a character's current mood
    """
    try:
        character = Character.objects.get(id=character_id)
        
        # Get mood colors based on character's current mood
        colors = get_mood_colors(character.current_mood, character.mood_intensity)
        
        return JsonResponse({
            'success': True,
            'mood': character.current_mood,
            'intensity': character.mood_intensity,
            'colors': colors
        })
    except Character.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Character not found'
        }, status=404)

@csrf_exempt
@login_required
def analyze_mood(request, character_id):
    """
    API endpoint to analyze a text and determine mood
    """
    if request.method != 'POST':
        return JsonResponse({
            'success': False,
            'error': 'Only POST method is allowed'
        }, status=405)
    
    try:
        # Get the character
        character = Character.objects.get(id=character_id)
        
        # Get the text from the request
        text = request.POST.get('text', '')
        
        if not text:
            return JsonResponse({
                'success': False,
                'error': 'No text provided'
            }, status=400)
        
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
        character.save()
        
        return JsonResponse({
            'success': True,
            'mood': mood_data['mood'],
            'intensity': mood_data['intensity'],
            'explanation': mood_data.get('explanation', ''),
            'colors': mood_data['colors']
        })
    except Character.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Character not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
def update_character_mood_history(request, character_id):
    """
    API endpoint to update a character's mood history
    """
    if request.method != 'POST':
        return JsonResponse({
            'success': False,
            'error': 'Only POST method is allowed'
        }, status=405)
    
    try:
        # Get the character
        character = Character.objects.get(id=character_id)
        
        # Get the text from the request
        text = request.POST.get('text', '')
        
        if not text:
            return JsonResponse({
                'success': False,
                'error': 'No text provided'
            }, status=400)
        
        # Update character mood based on text
        updated_character = update_character_mood(character, text)
        
        return JsonResponse({
            'success': True,
            'mood': updated_character.current_mood,
            'intensity': updated_character.mood_intensity,
            'colors': get_mood_colors(updated_character.current_mood, updated_character.mood_intensity)
        })
    except Character.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Character not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)