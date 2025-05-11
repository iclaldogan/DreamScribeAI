import { ChatMessage, Character } from '@shared/schema';

interface MoodAnalysis {
  mood: string;
  intensity: number;
  dominantColor: string;
}

/**
 * Generates a response from a character using the Gemini API
 * @param character The character information
 * @param messages The conversation history
 * @returns The character's response
 */
export async function generateCharacterResponse(character: Character, messages: ChatMessage[]): Promise<string> {
  try {
    // Check if we have the API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('Missing GEMINI_API_KEY environment variable');
      return "I seem to be having trouble finding the right words. Perhaps we can try again in a moment?";
    }
    
    // Filter messages to only include recent ones (last 10)
    const recentMessages = messages.slice(-10);
    
    // Format messages for the API
    const formattedMessages = recentMessages.map(msg => {
      return {
        role: msg.isUserMessage ? 'user' : 'assistant',
        content: msg.content
      };
    });
    
    // Create a system prompt that describes the character
    const characterDescription = `
      You are ${character.name}, a character with the following traits:
      - Role: ${character.role}
      - Appearance: ${character.appearance}
      - Personality: ${character.personality}
      - Backstory: ${character.backstory}
      
      Remember these key facts about yourself:
      ${character.memory && character.memory.facts 
        ? Object.entries(character.memory.facts).map(([key, value]) => `- ${value}`).join('\n')
        : '- You have no specific memories yet.'
      }
      
      Always respond in first person, as if you are ${character.name}.
      Stay in character at all times and reflect your personality in your responses.
    `;
    
    // Build the complete prompt
    const prompt = {
      role: 'system',
      content: characterDescription
    };
    
    // Fetch response from the Gemini API using fetch
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: characterDescription }]
          },
          ...formattedMessages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
          }))
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        }
      })
    });
    
    const data = await response.json();
    
    // Check if there was an error with the API request
    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
      console.error('Error generating character response:', data);
      return "I seem to be having trouble finding the right words. Perhaps we can try again in a moment?";
    }
    
    // Extract the text response
    const textResponse = data.candidates[0].content.parts[0].text;
    return textResponse;
    
  } catch (error) {
    console.error('Error generating character response:', error);
    return "I seem to be having trouble finding the right words. Perhaps we can try again in a moment?";
  }
}

/**
 * Analyzes the mood of text using the Gemini API
 * @param text The text to analyze
 * @returns A mood analysis object
 */
export async function analyzeMoodFromText(text: string): Promise<MoodAnalysis> {
  try {
    // Check if we have the API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('Missing GEMINI_API_KEY environment variable');
      return { mood: 'neutral', intensity: 0.5, dominantColor: '#808080' };
    }
    
    const prompt = `
      Analyze the mood of the following text and provide a JSON response with these fields:
      1. mood: A single word describing the emotional tone (e.g., happy, sad, angry, etc.)
      2. intensity: A number from 0 to 1 indicating how strong the emotion is
      3. dominantColor: A hex color code that represents this mood (warm colors for positive moods, cool colors for negative moods)
      
      Text to analyze: "${text}"
      
      Format your response as valid JSON only.
    `;
    
    // Fetch response from the Gemini API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 200,
        }
      })
    });
    
    const data = await response.json();
    
    // Check if there was an error with the API request
    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
      console.error('Error analyzing mood:', data);
      return { mood: 'neutral', intensity: 0.5, dominantColor: '#808080' };
    }
    
    // Extract the text response which should be JSON
    const textResponse = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON string
    let moodAnalysis: MoodAnalysis;
    try {
      // Remove any markdown code blocks if present
      const jsonText = textResponse.replace(/```json|```/g, '').trim();
      moodAnalysis = JSON.parse(jsonText);
    } catch (error) {
      console.error('Error parsing mood analysis JSON:', error, textResponse);
      return { mood: 'neutral', intensity: 0.5, dominantColor: '#808080' };
    }
    
    return moodAnalysis;
    
  } catch (error) {
    console.error('Error analyzing mood:', error);
    return { mood: 'neutral', intensity: 0.5, dominantColor: '#808080' };
  }
}