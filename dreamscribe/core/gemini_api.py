import os
import google.generativeai as genai
from dotenv import load_dotenv
from .mood_analyzer import MoodAnalyzer

# Load environment variables and set up the API
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def generate_character_response(character, user_message):
    """
    Generate a response from a character using Gemini
    
    Args:
        character: Character model instance
        user_message: String message from the user
        
    Returns:
        String response from the character
    """
    try:
        # Get the character's memory
        memory = character.get_memory()
        memory_str = ""
        if memory:
            memory_str = "Previous conversation context:\n"
            for key, value in memory.items():
                memory_str += f"- {key}: {value}\n"
        
        # Create the prompt
        prompt = f"""
        You are roleplaying as {character.name}, a {character.role} in a fictional world.
        
        Character details:
        - Appearance: {character.appearance}
        - Personality: {character.personality}
        - Backstory: {character.backstory}
        - Current mood: {character.current_mood}
        
        {memory_str}
        
        Respond to the following message as {character.name} would, staying in character.
        Make sure your response reflects the character's current mood of {character.current_mood}.
        
        User: {user_message}
        
        {character.name}:
        """
        
        # Generate content using Gemini
        model = genai.GenerativeModel('gemini-1.5-pro')
        response = model.generate_content(prompt)
        
        # Extract the response text
        response_text = response.text.strip()
        
        # Analyze the response to determine mood
        mood, intensity = MoodAnalyzer.analyze_with_gemini(response_text)
        
        # Update the character's mood and intensity
        character.current_mood = mood
        character.mood_intensity = intensity
        character.save()
        
        # Return the generated response
        return response_text
    
    except Exception as e:
        print(f"Error generating character response: {e}")
        
        # Try the fallback keyword-based mood detection
        try:
            fallback_response = "I'm sorry, I'm having trouble responding right now."
            mood, intensity = MoodAnalyzer.analyze_with_keywords(fallback_response)
            
            # Update mood even with fallback
            character.current_mood = mood
            character.mood_intensity = intensity
            character.save()
            
            return fallback_response
        except:
            # If all else fails, don't update mood
            return "I'm sorry, I'm having trouble responding right now."

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
    try:
        # Build character information
        character_info = ""
        for char in characters:
            character_info += f"- {char['name']}: {char['role']}, {char['personality']}\n"
        
        # Create the prompt
        prompt = f"""
        Generate a scene for a fictional world with the following details:
        
        World: {world_name}
        Description: {world_description}
        
        Characters involved:
        {character_info}
        
        Style: {style_type}
        Tone: {tone}
        Length: {length}
        
        Scene prompt: {scene_prompt}
        
        Write an engaging, well-structured scene that incorporates these elements:
        """
        
        # Generate content using Gemini
        model = genai.GenerativeModel('gemini-1.5-pro')
        response = model.generate_content(prompt)
        
        # Extract and return the response
        return response.text.strip()
    
    except Exception as e:
        print(f"Error generating scene: {e}")
        return "I'm sorry, I couldn't generate that scene."