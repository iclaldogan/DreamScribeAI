import { apiRequest } from "./queryClient";

// Character prompt template
const CHARACTER_PROMPT_TEMPLATE = `
You are playing the role of a fictional character in an interactive storytelling experience.
You are to respond as this character would, maintaining their personality, speaking style, and knowledge.

CHARACTER INFORMATION:
Name: {name}
Role: {role}
Appearance: {appearance}
Personality: {personality}
Backstory: {backstory}

MEMORY (what the character knows, remembers, or has experienced):
{memory}

GUIDELINES:
1. Stay in character at all times - respond as the character would, not as an AI.
2. Use "*action*" format to describe physical actions or emotions.
3. Consider the character's personality, knowledge, and experiences when responding.
4. Do not reference being an AI language model or that you are roleplaying.
5. Keep responses concise but with enough detail to advance the conversation.
6. If you need to show internal thoughts that wouldn't be spoken, use *thinks to self: thought* format.

USER CONTEXT:
The user is speaking directly to your character in your world setting. Respond naturally as your character would to them.
`;

// Scene prompt template
const SCENE_PROMPT_TEMPLATE = `
You are an expert storyteller who writes creative fiction for interactive narratives.
Write a scene based on the provided information. Focus on engaging narration, vivid descriptions, and authentic dialogue.

WORLD INFORMATION:
Name: {worldName}
Description: {worldDescription}

CHARACTERS INVOLVED:
{characterInfo}

SCENE TYPE: {styleType}
TONE: {tone}
LENGTH: {length}

SCENE PROMPT:
{scenePrompt}

GUIDELINES:
1. Write in the specified style and tone.
2. Include any mentioned characters with accurate personalities.
3. Create vivid imagery and sensory details appropriate to the world setting.
4. Include dialogue if applicable to the scene.
5. Aim for the appropriate length while maintaining quality.
6. Format text with appropriate paragraphs, line breaks, and dialogue formatting.
7. Do not include any meta-commentary or notes about the writing - only provide the scene itself.
`;

// Interface for character chat request
interface CharacterChatRequest {
  character: {
    name: string;
    role: string;
    appearance: string;
    personality: string;
    backstory: string;
    memory: any;
  };
  userMessage: string;
}

// Interface for scene generation request
interface SceneGenerationRequest {
  worldName: string;
  worldDescription: string;
  characters: Array<{
    name: string;
    role: string;
    personality: string;
  }>;
  styleType: string;
  tone: string;
  length: string;
  scenePrompt: string;
}

// Function to generate character response using Gemini API
export async function generateCharacterResponse(request: CharacterChatRequest): Promise<string> {
  try {
    // Convert character memory object to string format for the prompt
    const memoryText = typeof request.character.memory === 'object' 
      ? JSON.stringify(request.character.memory, null, 2) 
      : String(request.character.memory);
    
    // Prepare the prompt by filling in the template
    const prompt = CHARACTER_PROMPT_TEMPLATE
      .replace('{name}', request.character.name)
      .replace('{role}', request.character.role)
      .replace('{appearance}', request.character.appearance || 'Not specified')
      .replace('{personality}', request.character.personality)
      .replace('{backstory}', request.character.backstory || 'Not specified')
      .replace('{memory}', memoryText);
    
    // Extract the characterId from the request or the URL
    const urlParts = window.location.pathname.split('/');
    const characterId = urlParts[urlParts.length - 1]; // Get the last part of the URL which should be the character ID
    
    // Make a request to the server, which will call Gemini API
    const response = await apiRequest('POST', '/api/generate-character-response', {
      characterId: parseInt(characterId),
      prompt,
      userMessage: request.userMessage
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate character response');
    }
    
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error generating character response:', error);
    return "I seem to be having trouble finding the right words. Perhaps we can try again in a moment?";
  }
}

// Function to generate a story scene using Gemini API
export async function generateScene(request: SceneGenerationRequest): Promise<string> {
  try {
    // Format character information
    const characterInfo = request.characters.map(char => 
      `- ${char.name} (${char.role}): ${char.personality}`
    ).join('\n');
    
    // Prepare the prompt by filling in the template
    const prompt = SCENE_PROMPT_TEMPLATE
      .replace('{worldName}', request.worldName)
      .replace('{worldDescription}', request.worldDescription)
      .replace('{characterInfo}', characterInfo)
      .replace('{styleType}', request.styleType)
      .replace('{tone}', request.tone)
      .replace('{length}', request.length)
      .replace('{scenePrompt}', request.scenePrompt);
    
    // Make a request to the server, which will call Gemini API
    const response = await apiRequest('POST', '/api/generate-scene', {
      prompt
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate scene');
    }
    
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error generating scene:', error);
    return "There was an error generating your scene. Please try again later.";
  }
}
