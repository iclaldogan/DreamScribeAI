"""
Dreamscribe AI - Gemini API Integration

This module handles integration with the Gemini API for AI-generated responses,
scene generation, and other AI-powered features.
"""
import os
import json
import google.generativeai as genai
from django.conf import settings
from .mood_analyzer import update_character_mood

# Configure the Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)

def generate_character_response(character, user_message):
    """
    Generate a response from a character using Gemini
    
    Args:
        character: Character model instance
        user_message: String message from the user
        
    Returns:
        String response from the character
    """
    # Get character details
    name = character.name
    role = character.role
    personality = character.personality
    backstory = character.backstory
    world_name = character.world.name
    world_description = character.world.description
    
    # Get memory context - limit to prevent token overflow
    memory_context = ""
    if character.memory and 'conversations' in character.memory:
        # Get the last 5 conversations from memory
        recent_conversations = character.memory['conversations'][-5:]
        for i, convo in enumerate(recent_conversations):
            memory_context += f"Previous exchange {i+1}:\n"
            memory_context += f"User: {convo['user_message']}\n"
            memory_context += f"{name}: {convo['character_response']}\n\n"
    
    # Added facts from memory (if any)
    facts_context = ""
    if character.memory and 'facts' in character.memory:
        facts_context = "Important facts I know:\n"
        for fact in character.memory['facts']:
            facts_context += f"- {fact}\n"
    
    # Build prompt
    prompt = f"""
You are roleplaying as {name}, {role} in the world of {world_name}.

World context: {world_description}

Your personality: {personality}

Your backstory: {backstory}

Your current mood: {character.current_mood.capitalize()}
Mood intensity: {character.mood_intensity}%

{facts_context}

{memory_context}

Please respond to the following message from the user. Stay in character as {name} throughout your response. Your response should reflect your personality, backstory, and current mood.

User: {user_message}

{name}:
"""

    try:
        # Generate response with Gemini
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        character_response = response.text.strip()
        
        # Update character's mood based on the response
        update_character_mood(character, character_response)
        
        # Store the conversation in character memory
        character.store_conversation(user_message, character_response)
        
        return character_response
    
    except Exception as e:
        print(f"Error generating character response: {e}")
        return "I'm sorry, I seem to be having trouble forming a response right now. Could we try again in a moment?"

def add_fact_to_character_memory(character, fact):
    """
    Add a new fact to the character's memory
    
    Args:
        character: Character model instance
        fact: String containing a new fact for the character to remember
        
    Returns:
        Updated character instance
    """
    if not character.memory:
        character.memory = {}
    
    if 'facts' not in character.memory:
        character.memory['facts'] = []
    
    character.memory['facts'].append(fact)
    character.save()
    
    return character

def generate_scene(world_name, world_description, characters, style_type, tone, length, scene_prompt):
    """
    Generate a scene using Gemini
    
    Args:
        world_name: Name of the world
        world_description: Description of the world
        characters: List of character dictionaries (name, role, personality)
        style_type: Style of writing
        tone: Tone of the scene
        length: Length of the scene (short, medium, long)
        scene_prompt: User's prompt describing the scene
        
    Returns:
        String containing the generated scene
    """
    # Format characters information
    characters_info = ""
    for idx, char in enumerate(characters):
        characters_info += f"Character {idx+1}: {char['name']}, {char['role']}\n"
        characters_info += f"Personality: {char['personality']}\n\n"
    
    # Determine word count based on selected length
    word_count = "250"
    if length == "Medium (500 words)":
        word_count = "500"
    elif length == "Long (1000 words)":
        word_count = "1000"
    
    prompt = f"""
You are an expert creative writer tasked with generating a scene for a fictional world.

World: {world_name}
World Description: {world_description}

Characters in the scene:
{characters_info}

Style: {style_type}
Tone: {tone}
Length: Approximately {word_count} words

Scene Prompt: {scene_prompt}

Write a compelling scene that includes the specified characters and fits the world description. 
The scene should match the requested style and tone, while addressing the scene prompt.
Give the scene a descriptive title as the first line.
"""

    try:
        # Generate scene with Gemini
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        return response.text.strip()
    
    except Exception as e:
        print(f"Error generating scene: {e}")
        return "Error generating scene. Please try again later."

def analyze_text_for_contextual_facts(text, character=None):
    """
    Analyze text for important facts that a character should remember
    
    Args:
        text: Text to analyze
        character: Optional Character model instance for context
        
    Returns:
        List of facts extracted from the text
    """
    character_context = ""
    if character:
        character_context = f"""
The facts should be relevant to {character.name}, a {character.role} in the world of {character.world.name}.
Consider {character.name}'s personality: {character.personality}
"""

    prompt = f"""
Extract important facts from the following text that would be relevant for a character to remember in future conversations.
Focus on personal details, preferences, history, and narrative elements.
Extract only clear facts, not assumptions or speculations.

{character_context}

Text to analyze:
"{text}"

Return ONLY a JSON array of string facts, with each fact being a complete, standalone statement.
Example: ["User's name is Alex", "User lives in Seattle", "User has a dog named Max"]
"""

    try:
        # Use Gemini to extract facts
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Extract the JSON array
        start_idx = response_text.find('[')
        end_idx = response_text.rfind(']') + 1
        
        if start_idx >= 0 and end_idx > start_idx:
            json_str = response_text[start_idx:end_idx]
            facts = json.loads(json_str)
            return facts
        
        return []
    
    except Exception as e:
        print(f"Error analyzing text for facts: {e}")
        return []