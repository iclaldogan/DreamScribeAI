from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, authenticate
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib import messages
from django.db.models import Count

from .models import World, Character, Scene, ChatMessage, ActivityLog
from .forms import WorldForm, CharacterForm, SceneForm, ChatMessageForm, SceneGeneratorForm, SignUpForm
from .gemini_api import generate_character_response, generate_scene
from .mood_analyzer import MoodAnalyzer

def home(request):
    """Landing page"""
    return render(request, 'core/home.html')

def signup(request):
    """User registration"""
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, "Account created successfully!")
            return redirect('dashboard')
    else:
        form = SignUpForm()
    return render(request, 'core/signup.html', {'form': form})

@login_required
def dashboard(request):
    """Main dashboard showing worlds and characters"""
    worlds = World.objects.filter(user=request.user).annotate(character_count=Count('characters'))
    characters = Character.objects.filter(world__user=request.user)
    
    return render(request, 'core/dashboard.html', {
        'worlds': worlds,
        'characters': characters,
    })

@login_required
def world_list(request):
    """List all worlds"""
    worlds = World.objects.filter(user=request.user).annotate(character_count=Count('characters'))
    
    if request.method == 'POST':
        form = WorldForm(request.POST)
        if form.is_valid():
            world = form.save(commit=False)
            world.user = request.user
            world.save()
            
            # Create activity log
            ActivityLog.objects.create(
                world=world,
                activity_type='WORLD_CREATED',
                description=f"Created new world: {world.name}"
            )
            
            messages.success(request, f"World '{world.name}' created successfully!")
            return redirect('world_detail', world_id=world.id)
    else:
        form = WorldForm()
        
    return render(request, 'core/world_list.html', {
        'worlds': worlds,
        'form': form
    })

@login_required
def world_detail(request, world_id):
    """World detail view"""
    world = get_object_or_404(World, id=world_id, user=request.user)
    characters = Character.objects.filter(world=world)
    scenes = Scene.objects.filter(world=world)
    activity_logs = ActivityLog.objects.filter(world=world)[:10]
    
    if request.method == 'POST':
        form = WorldForm(request.POST, instance=world)
        if form.is_valid():
            form.save()
            
            # Create activity log
            ActivityLog.objects.create(
                world=world,
                activity_type='WORLD_UPDATED',
                description=f"Updated world: {world.name}"
            )
            
            messages.success(request, f"World '{world.name}' updated successfully!")
            return redirect('world_detail', world_id=world.id)
    else:
        form = WorldForm(instance=world)
        
    return render(request, 'core/world_detail.html', {
        'world': world,
        'characters': characters,
        'scenes': scenes,
        'activity_logs': activity_logs,
        'form': form
    })

@login_required
def delete_world(request, world_id):
    """Delete a world"""
    world = get_object_or_404(World, id=world_id, user=request.user)
    
    if request.method == 'POST':
        world_name = world.name
        world.delete()
        messages.success(request, f"World '{world_name}' deleted successfully!")
        return redirect('world_list')
        
    return render(request, 'core/delete_world.html', {'world': world})

@login_required
def character_list(request, world_id=None):
    """Character list, optionally filtered by world"""
    if world_id:
        world = get_object_or_404(World, id=world_id, user=request.user)
        characters = Character.objects.filter(world=world)
        worlds = [world]
    else:
        characters = Character.objects.filter(world__user=request.user)
        worlds = World.objects.filter(user=request.user)
    
    if request.method == 'POST':
        form = CharacterForm(request.POST)
        if form.is_valid():
            character = form.save(commit=False)
            # Ensure character belongs to a world owned by the user
            if character.world.user != request.user:
                messages.error(request, "You can only add characters to your own worlds.")
                return redirect('character_list')
                
            character.save()
            
            # Create activity log
            ActivityLog.objects.create(
                world=character.world,
                activity_type='CHARACTER_CREATED',
                description=f"Created new character: {character.name}",
                related_character=character
            )
            
            messages.success(request, f"Character '{character.name}' created successfully!")
            return redirect('character_detail', character_id=character.id)
    else:
        initial_data = {'world': world_id} if world_id else {}
        form = CharacterForm(initial=initial_data)
        if world_id:
            form.fields['world'].queryset = World.objects.filter(id=world_id, user=request.user)
        else:
            form.fields['world'].queryset = World.objects.filter(user=request.user)
        
    return render(request, 'core/character_list.html', {
        'characters': characters,
        'worlds': worlds,
        'selected_world_id': world_id,
        'form': form
    })

@login_required
def character_detail(request, character_id):
    """Character detail view"""
    character = get_object_or_404(Character, id=character_id, world__user=request.user)
    
    if request.method == 'POST':
        form = CharacterForm(request.POST, instance=character)
        if form.is_valid():
            # Ensure character belongs to a world owned by the user
            if form.cleaned_data['world'].user != request.user:
                messages.error(request, "You can only add characters to your own worlds.")
                return redirect('character_detail', character_id=character.id)
                
            form.save()
            
            # Create activity log
            ActivityLog.objects.create(
                world=character.world,
                activity_type='CHARACTER_UPDATED',
                description=f"Updated character: {character.name}",
                related_character=character
            )
            
            messages.success(request, f"Character '{character.name}' updated successfully!")
            return redirect('character_detail', character_id=character.id)
    else:
        form = CharacterForm(instance=character)
        form.fields['world'].queryset = World.objects.filter(user=request.user)
        
    return render(request, 'core/character_detail.html', {
        'character': character,
        'form': form
    })

@login_required
def delete_character(request, character_id):
    """Delete a character"""
    character = get_object_or_404(Character, id=character_id, world__user=request.user)
    
    if request.method == 'POST':
        world = character.world
        character_name = character.name
        character.delete()
        
        messages.success(request, f"Character '{character_name}' deleted successfully!")
        return redirect('character_list', world_id=world.id)
        
    return render(request, 'core/delete_character.html', {'character': character})

@login_required
def character_chat(request, character_id):
    """Chat with a character"""
    character = get_object_or_404(Character, id=character_id, world__user=request.user)
    messages_history = ChatMessage.objects.filter(character=character)
    
    if request.method == 'POST':
        form = ChatMessageForm(request.POST)
        if form.is_valid():
            # Create user message
            user_message = form.save(commit=False)
            user_message.character = character
            user_message.user = request.user
            user_message.is_user_message = True
            user_message.save()
            
            # Generate AI response
            ai_response = generate_character_response(character, user_message.content)
            
            # Create AI message
            ai_message = ChatMessage.objects.create(
                character=character,
                user=request.user,
                is_user_message=False,
                content=ai_response
            )
            
            # Create activity log
            ActivityLog.objects.create(
                world=character.world,
                activity_type='CHAT_SESSION',
                description=f"Chat session with {character.name}",
                related_character=character
            )
            
            # If this is an AJAX request
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'success',
                    'response': ai_response
                })
            
            return redirect('character_chat', character_id=character_id)
    else:
        form = ChatMessageForm()
        
    return render(request, 'core/character_chat.html', {
        'character': character,
        'messages': messages_history,
        'form': form
    })

@login_required
def scene_generator(request):
    """Generate scenes using AI"""
    generated_content = None
    
    if request.method == 'POST':
        form = SceneGeneratorForm(request.POST)
        form.fields['world'].queryset = World.objects.filter(user=request.user)
        
        if 'generate' in request.POST:
            if form.is_valid():
                world = form.cleaned_data['world']
                included_characters = form.cleaned_data['included_characters']
                
                # Format characters for the API
                characters_data = []
                for character in included_characters:
                    characters_data.append({
                        'name': character.name,
                        'role': character.role,
                        'personality': character.personality
                    })
                
                # Generate scene
                generated_content = generate_scene(
                    world_name=world.name,
                    world_description=world.description,
                    characters=characters_data,
                    style_type=form.cleaned_data['style_type'],
                    tone=form.cleaned_data['tone'],
                    length=form.cleaned_data['length'],
                    scene_prompt=form.cleaned_data['scene_prompt']
                )
                
                # If AJAX request
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({
                        'status': 'success',
                        'content': generated_content
                    })
                
        elif 'save' in request.POST and request.POST.get('generated_content'):
            # Create a new scene from the generated content
            scene = Scene(
                world_id=form.data.get('world'),
                title=form.data.get('title'),
                content=request.POST.get('generated_content'),
                style_type=form.data.get('style_type'),
                tone=form.data.get('tone')
            )
            scene.save()
            
            # Add included characters if any
            if form.data.get('included_characters'):
                character_ids = request.POST.getlist('included_characters')
                for char_id in character_ids:
                    scene.included_characters.add(char_id)
            
            # Create activity log
            ActivityLog.objects.create(
                world_id=scene.world_id,
                activity_type='SCENE_CREATED',
                description=f"Created new scene: {scene.title}",
                related_scene=scene
            )
            
            messages.success(request, f"Scene '{scene.title}' saved successfully!")
            return redirect('scene_detail', scene_id=scene.id)
    else:
        form = SceneGeneratorForm()
        form.fields['world'].queryset = World.objects.filter(user=request.user)
    
    # Get a few recent scenes to display
    recent_scenes = Scene.objects.filter(world__user=request.user).order_by('-created_at')[:5]
        
    return render(request, 'core/scene_generator.html', {
        'form': form,
        'generated_content': generated_content,
        'recent_scenes': recent_scenes
    })

@login_required
def scene_list(request, world_id=None):
    """List all scenes, optionally filtered by world"""
    if world_id:
        world = get_object_or_404(World, id=world_id, user=request.user)
        scenes = Scene.objects.filter(world=world)
        worlds = [world]
    else:
        scenes = Scene.objects.filter(world__user=request.user)
        worlds = World.objects.filter(user=request.user)
    
    return render(request, 'core/scene_list.html', {
        'scenes': scenes,
        'worlds': worlds,
        'selected_world_id': world_id
    })

@login_required
def scene_detail(request, scene_id):
    """Scene detail view"""
    scene = get_object_or_404(Scene, id=scene_id, world__user=request.user)
    
    if request.method == 'POST':
        form = SceneForm(request.POST, instance=scene)
        form.fields['world'].queryset = World.objects.filter(user=request.user)
        
        if form.is_valid():
            form.save()
            messages.success(request, f"Scene '{scene.title}' updated successfully!")
            return redirect('scene_detail', scene_id=scene.id)
    else:
        form = SceneForm(instance=scene)
        form.fields['world'].queryset = World.objects.filter(user=request.user)
        
    return render(request, 'core/scene_detail.html', {
        'scene': scene,
        'form': form
    })

@login_required
def delete_scene(request, scene_id):
    """Delete a scene"""
    scene = get_object_or_404(Scene, id=scene_id, world__user=request.user)
    
    if request.method == 'POST':
        world = scene.world
        scene_title = scene.title
        scene.delete()
        
        messages.success(request, f"Scene '{scene_title}' deleted successfully!")
        return redirect('scene_list', world_id=world.id)
        
    return render(request, 'core/delete_scene.html', {'scene': scene})

@login_required
def character_mood_api(request, character_id):
    """AJAX endpoint for getting character mood information"""
    character = get_object_or_404(Character, id=character_id, world__user=request.user)
    
    # Get the mood colors
    colors = MoodAnalyzer.get_mood_colors(character.current_mood, character.mood_intensity)
    
    # Manually analyze new text if provided
    if request.method == 'POST' and request.POST.get('text'):
        try:
            text = request.POST.get('text')
            mood, intensity = MoodAnalyzer.analyze_with_gemini(text)
            
            # Update character's mood
            character.current_mood = mood
            character.mood_intensity = intensity
            character.save()
            
            # Get updated colors
            colors = MoodAnalyzer.get_mood_colors(mood, intensity)
            
            return JsonResponse({
                'success': True,
                'message': 'Mood updated successfully',
                'mood': mood,
                'intensity': intensity,
                'colors': colors
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Error analyzing mood: {str(e)}'
            }, status=400)
    
    # For GET requests, just return current mood info
    return JsonResponse({
        'success': True,
        'mood': character.current_mood,
        'intensity': character.mood_intensity,
        'colors': colors
    })
