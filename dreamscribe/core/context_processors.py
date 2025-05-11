"""
Dreamscribe AI - Context Processors

This module contains context processors for the application that add
variables to the template context.
"""
from django.urls import resolve
from .models import Character
from .mood_analyzer import get_mood_color

def active_menu(request):
    """
    Add active menu information to context
    """
    url_name = resolve(request.path_info).url_name
    
    # Determine active section based on URL name
    active_section = None
    if url_name in ['dashboard']:
        active_section = 'dashboard'
    elif url_name in ['world_list', 'world_detail', 'world_create', 'world_edit', 'world_delete']:
        active_section = 'worlds'
    elif url_name in ['character_list', 'character_detail', 'character_chat']:
        active_section = 'characters'
    elif url_name in ['scene_generator', 'scene_detail', 'world_scenes']:
        active_section = 'scenes'
    
    return {
        'active_section': active_section,
        'url_name': url_name
    }

def character_theme(request):
    """
    Add character-based theme colors to context when viewing a character
    """
    context = {
        'theme_primary_color': None, 
        'theme_primary_color_rgb': None,
        'current_character': None,
    }
    
    # Try to get character_id from URL parameters
    url_name = resolve(request.path_info).url_name
    url_kwargs = resolve(request.path_info).kwargs
    
    if url_name in ['character_detail', 'character_chat'] and 'character_id' in url_kwargs:
        try:
            character_id = url_kwargs['character_id']
            character = Character.objects.get(id=character_id)
            
            # Get color based on character's mood
            color = get_mood_color(character.current_mood)
            
            # Convert hex to RGB for CSS variables
            hex_color = color.lstrip('#')
            rgb = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
            
            context['theme_primary_color'] = color
            context['theme_primary_color_rgb'] = f"{rgb[0]}, {rgb[1]}, {rgb[2]}"
            context['current_character'] = character
            
        except Character.DoesNotExist:
            pass
    
    return context