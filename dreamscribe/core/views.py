"""
Dreamscribe AI - Core views

This module contains the main view functions for the application.
"""
import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login
from django.http import JsonResponse
from django.utils import timezone
from django.contrib import messages

from .models import World, Character, Scene, ChatMessage, ActivityLog
from .forms import WorldForm, CharacterForm, SceneForm, ChatMessageForm, SignUpForm, SceneGeneratorForm
from .gemini_api import generate_character_response, generate_scene, analyze_text_for_contextual_facts, add_fact_to_character_memory

@login_required
def dashboard(request):
    """
    User dashboard view showing recent worlds, characters, and activities
    """
    # Get user's worlds
    worlds = World.objects.filter(user=request.user).order_by('-updated_at')
    
    # Get recently updated characters across all user's worlds
    recent_characters = Character.objects.filter(
        world__user=request.user
    ).order_by('-updated_at')[:5]
    
    # Get recent activity
    recent_activity = ActivityLog.objects.filter(
        world__user=request.user
    ).order_by('-timestamp')[:10]
    
    context = {
        'worlds': worlds,
        'recent_characters': recent_characters,
        'recent_activity': recent_activity,
    }
    
    return render(request, 'core/dashboard.html', context)

@login_required
def world_detail(request, world_id):
    """
    Detail view for a specific world
    """
    world = get_object_or_404(World, id=world_id, user=request.user)
    
    # Get characters in this world
    characters = Character.objects.filter(world=world).order_by('name')
    
    # Get scenes in this world
    scenes = Scene.objects.filter(world=world).order_by('-created_at')
    
    # Get recent activity
    recent_activity = ActivityLog.objects.filter(world=world).order_by('-timestamp')[:5]
    
    context = {
        'world': world,
        'characters': characters,
        'scenes': scenes,
        'recent_activity': recent_activity,
    }
    
    return render(request, 'core/world_detail.html', context)

@login_required
def world_list(request):
    """
    List all worlds belonging to the user
    """
    # Create new world form
    if request.method == 'POST':
        form = WorldForm(request.POST)
        if form.is_valid():
            world = form.save(commit=False)
            world.user = request.user
            world.save()
            
            # Log the activity
            ActivityLog.objects.create(
                world=world,
                activity_type='WORLD_CREATED',
                details=f"World '{world.name}' created"
            )
            
            messages.success(request, f"World '{world.name}' created successfully!")
            return redirect('world_detail', world_id=world.id)
    else:
        form = WorldForm()
    
    worlds = World.objects.filter(user=request.user).order_by('-updated_at')
    
    context = {
        'worlds': worlds,
        'form': form,
    }
    
    return render(request, 'core/world_list.html', context)

@login_required
def world_create(request):
    """
    Create a new world
    """
    if request.method == 'POST':
        form = WorldForm(request.POST)
        if form.is_valid():
            world = form.save(commit=False)
            world.user = request.user
            world.save()
            
            # Log the activity
            ActivityLog.objects.create(
                world=world,
                activity_type='WORLD_CREATED',
                details=f"World '{world.name}' created"
            )
            
            messages.success(request, f"World '{world.name}' created successfully!")
            return redirect('world_detail', world_id=world.id)
    else:
        form = WorldForm()
    
    context = {
        'form': form,
        'mode': 'create',
    }
    
    return render(request, 'core/world_form.html', context)

@login_required
def character_list(request):
    """
    List all characters across all worlds
    """
    # Fetch all characters from user's worlds
    characters = Character.objects.filter(
        world__user=request.user
    ).select_related('world').order_by('name')
    
    # Create new character form
    if request.method == 'POST':
        form = CharacterForm(request.POST, user=request.user)
        if form.is_valid():
            character = form.save()
            
            # Log the activity
            ActivityLog.objects.create(
                world=character.world,
                character=character,
                activity_type='CHARACTER_CREATED',
                details=f"Character '{character.name}' created"
            )
            
            messages.success(request, f"Character '{character.name}' created successfully!")
            return redirect('character_detail', character_id=character.id)
    else:
        form = CharacterForm(user=request.user)
    
    # Get all worlds for filtering
    worlds = World.objects.filter(user=request.user)
    
    context = {
        'characters': characters,
        'form': form,
        'worlds': worlds,
        'selected_world_id': None,
    }
    
    return render(request, 'core/character_list.html', context)

@login_required
def world_characters(request, world_id):
    """
    List all characters in a specific world
    """
    world = get_object_or_404(World, id=world_id, user=request.user)
    
    # Fetch characters in this world
    characters = Character.objects.filter(world=world).order_by('name')
    
    # Create new character form
    if request.method == 'POST':
        form = CharacterForm(request.POST, initial={'world': world}, user=request.user)
        if form.is_valid():
            character = form.save()
            
            # Log the activity
            ActivityLog.objects.create(
                world=world,
                character=character,
                activity_type='CHARACTER_CREATED',
                details=f"Character '{character.name}' created"
            )
            
            messages.success(request, f"Character '{character.name}' created successfully!")
            return redirect('character_detail', character_id=character.id)
    else:
        form = CharacterForm(initial={'world': world}, user=request.user)
    
    # Get all worlds for filtering
    worlds = World.objects.filter(user=request.user)
    
    context = {
        'characters': characters,
        'world': world,
        'form': form,
        'worlds': worlds,
        'selected_world_id': world.id,
    }
    
    return render(request, 'core/character_list.html', context)

@login_required
def character_detail(request, character_id):
    """
    Detail view for a specific character
    """
    character = get_object_or_404(Character, id=character_id, world__user=request.user)
    
    # Fetch recent messages
    recent_messages = ChatMessage.objects.filter(character=character).order_by('-created_at')[:10]
    
    # Fetch scenes this character appears in
    scenes = Scene.objects.filter(included_characters=character).order_by('-created_at')
    
    # Memory facts (if any)
    memory_facts = []
    if character.memory and 'facts' in character.memory:
        memory_facts = character.memory['facts']
    
    context = {
        'character': character,
        'recent_messages': recent_messages,
        'scenes': scenes,
        'memory_facts': memory_facts,
    }
    
    return render(request, 'core/character_detail.html', context)

@login_required
def character_chat(request, character_id):
    """
    Chat with a character
    """
    character = get_object_or_404(Character, id=character_id, world__user=request.user)
    
    # Get or create chat history
    messages = ChatMessage.objects.filter(character=character).order_by('created_at')
    
    if request.method == 'POST':
        form = ChatMessageForm(request.POST)
        if form.is_valid():
            # Create user message
            user_message = form.cleaned_data['content']
            chat_message = ChatMessage.objects.create(
                character=character,
                user=request.user,
                content=user_message,
                is_user_message=True
            )
            
            # Generate character response
            character_response = generate_character_response(character, user_message)
            
            # Create character message
            ChatMessage.objects.create(
                character=character,
                user=request.user,
                content=character_response,
                is_user_message=False
            )
            
            # Extract facts from user message and add to character memory
            facts = analyze_text_for_contextual_facts(user_message, character)
            for fact in facts:
                add_fact_to_character_memory(character, fact)
            
            # Log the activity
            ActivityLog.objects.create(
                world=character.world,
                character=character,
                activity_type='CHARACTER_CHAT',
                details=f"Chat with '{character.name}'"
            )
            
            return redirect('character_chat', character_id=character_id)
    else:
        form = ChatMessageForm()
    
    context = {
        'character': character,
        'messages': messages,
        'form': form,
    }
    
    return render(request, 'core/character_chat.html', context)

@login_required
def scene_generator(request):
    """
    Generate a new scene using AI
    """
    if request.method == 'POST':
        form = SceneGeneratorForm(request.POST, user=request.user)
        if form.is_valid():
            world = form.cleaned_data['world']
            title = form.cleaned_data['title']
            included_characters = form.cleaned_data['included_characters']
            scene_prompt = form.cleaned_data['scene_prompt']
            style_type = form.cleaned_data['style_type']
            tone = form.cleaned_data['tone']
            length = form.cleaned_data['length']
            
            # Format characters for the API
            characters_data = []
            for character in included_characters:
                characters_data.append({
                    'name': character.name,
                    'role': character.role,
                    'personality': character.personality
                })
            
            # Generate the scene
            content = generate_scene(
                world.name,
                world.description,
                characters_data,
                style_type,
                tone,
                length,
                scene_prompt
            )
            
            # Create the scene
            scene = Scene.objects.create(
                world=world,
                title=title,
                content=content,
                style_type=style_type,
                tone=tone,
            )
            
            # Add characters to the scene
            for character in included_characters:
                scene.included_characters.add(character)
            
            # Log the activity
            ActivityLog.objects.create(
                world=world,
                scene=scene,
                activity_type='SCENE_CREATED',
                details=f"Scene '{scene.title}' generated"
            )
            
            return redirect('scene_detail', scene_id=scene.id)
    else:
        world_id = request.GET.get('world_id')
        initial = {}
        if world_id:
            try:
                world = World.objects.get(id=world_id, user=request.user)
                initial['world'] = world
            except World.DoesNotExist:
                pass
        
        form = SceneGeneratorForm(user=request.user, initial=initial)
    
    context = {
        'form': form,
    }
    
    return render(request, 'core/scene_generator.html', context)

@login_required
def scene_detail(request, scene_id):
    """
    Detail view for a specific scene
    """
    scene = get_object_or_404(Scene, id=scene_id, world__user=request.user)
    
    context = {
        'scene': scene,
    }
    
    return render(request, 'core/scene_detail.html', context)

@login_required
def world_scenes(request, world_id):
    """
    List all scenes in a specific world
    """
    world = get_object_or_404(World, id=world_id, user=request.user)
    
    # Fetch scenes in this world
    scenes = Scene.objects.filter(world=world).order_by('-created_at')
    
    context = {
        'world': world,
        'scenes': scenes,
    }
    
    return render(request, 'core/world_scenes.html', context)

def signup(request):
    """
    User signup view
    """
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('dashboard')
    else:
        form = SignUpForm()
    
    return render(request, 'core/signup.html', {'form': form})

def index(request):
    """
    Home page view
    """
    if request.user.is_authenticated:
        return redirect('dashboard')
    
    return render(request, 'core/index.html')