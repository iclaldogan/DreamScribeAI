import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertWorldSchema, 
  insertCharacterSchema, 
  insertSceneSchema, 
  insertChatMessageSchema,
  insertActivityLogSchema
} from "@shared/schema";
import { generateCharacterResponse, analyzeMoodFromText } from "./ai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // API Routes
  // All routes prefixed with /api
  const apiRouter = app.route('/api');

  // ---------------
  // Worlds endpoints
  // ---------------
  
  // Get all worlds (for a user)
  app.get('/api/worlds', async (req: Request, res: Response) => {
    try {
      // For demo purposes, hardcode userId to 1
      const userId = 1;
      const worlds = await storage.getWorldsByUser(userId);
      res.json(worlds);
    } catch (error) {
      console.error('Error fetching worlds:', error);
      res.status(500).json({ message: 'Error fetching worlds' });
    }
  });

  // Get a single world by ID
  app.get('/api/worlds/:id', async (req: Request, res: Response) => {
    try {
      const worldId = parseInt(req.params.id);
      const world = await storage.getWorld(worldId);
      
      if (!world) {
        return res.status(404).json({ message: 'World not found' });
      }
      
      res.json(world);
    } catch (error) {
      console.error('Error fetching world:', error);
      res.status(500).json({ message: 'Error fetching world' });
    }
  });

  // Create a new world
  app.post('/api/worlds', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertWorldSchema.parse({
        ...req.body,
        userId: 1 // For demo purposes, hardcode userId to 1
      });
      
      const newWorld = await storage.createWorld(validatedData);
      
      // Create activity log
      await storage.createActivityLog({
        worldId: newWorld.id,
        activityType: 'WORLD_CREATED',
        entityId: newWorld.id,
        description: `Created world ${newWorld.name}`
      });
      
      res.status(201).json(newWorld);
    } catch (error) {
      console.error('Error creating world:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Error creating world' });
    }
  });

  // Update a world
  app.patch('/api/worlds/:id', async (req: Request, res: Response) => {
    try {
      const worldId = parseInt(req.params.id);
      const world = await storage.getWorld(worldId);
      
      if (!world) {
        return res.status(404).json({ message: 'World not found' });
      }
      
      const updatedWorld = await storage.updateWorld(worldId, req.body);
      
      // Create activity log
      await storage.createActivityLog({
        worldId: worldId,
        activityType: 'WORLD_UPDATED',
        entityId: worldId,
        description: `Updated world ${world.name}`
      });
      
      res.json(updatedWorld);
    } catch (error) {
      console.error('Error updating world:', error);
      res.status(500).json({ message: 'Error updating world' });
    }
  });

  // Delete a world
  app.delete('/api/worlds/:id', async (req: Request, res: Response) => {
    try {
      const worldId = parseInt(req.params.id);
      const world = await storage.getWorld(worldId);
      
      if (!world) {
        return res.status(404).json({ message: 'World not found' });
      }
      
      const success = await storage.deleteWorld(worldId);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: 'Failed to delete world' });
      }
    } catch (error) {
      console.error('Error deleting world:', error);
      res.status(500).json({ message: 'Error deleting world' });
    }
  });

  // -----------------
  // Characters endpoints
  // -----------------
  
  // Get all characters
  app.get('/api/characters', async (req: Request, res: Response) => {
    try {
      // For demo purposes, get all characters across all worlds
      const worlds = await storage.getWorldsByUser(1); // Hardcoded userId for demo
      
      if (worlds.length === 0) {
        return res.json([]);
      }
      
      // Get characters from all worlds
      const allCharactersPromises = worlds.map(world => 
        storage.getCharactersByWorld(world.id)
      );
      
      const charactersNestedArray = await Promise.all(allCharactersPromises);
      // Flatten the array of arrays
      const allCharacters = charactersNestedArray.flat();
      
      res.json(allCharacters);
    } catch (error) {
      console.error('Error fetching all characters:', error);
      res.status(500).json({ message: 'Error fetching all characters' });
    }
  });
  
  // Get all characters for a world
  app.get('/api/worlds/:worldId/characters', async (req: Request, res: Response) => {
    try {
      const worldId = parseInt(req.params.worldId);
      const world = await storage.getWorld(worldId);
      
      if (!world) {
        return res.status(404).json({ message: 'World not found' });
      }
      
      const characters = await storage.getCharactersByWorld(worldId);
      res.json(characters);
    } catch (error) {
      console.error('Error fetching characters:', error);
      res.status(500).json({ message: 'Error fetching characters' });
    }
  });

  // Get a single character
  app.get('/api/characters/:id', async (req: Request, res: Response) => {
    try {
      const characterId = parseInt(req.params.id);
      const character = await storage.getCharacter(characterId);
      
      if (!character) {
        return res.status(404).json({ message: 'Character not found' });
      }
      
      res.json(character);
    } catch (error) {
      console.error('Error fetching character:', error);
      res.status(500).json({ message: 'Error fetching character' });
    }
  });

  // Create a new character
  app.post('/api/characters', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertCharacterSchema.parse(req.body);
      
      const newCharacter = await storage.createCharacter(validatedData);
      
      // Create activity log
      await storage.createActivityLog({
        worldId: newCharacter.worldId,
        activityType: 'CHARACTER_CREATED',
        entityId: newCharacter.id,
        description: `Created character ${newCharacter.name}`
      });
      
      res.status(201).json(newCharacter);
    } catch (error) {
      console.error('Error creating character:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Error creating character' });
    }
  });

  // Update a character
  app.patch('/api/characters/:id', async (req: Request, res: Response) => {
    try {
      const characterId = parseInt(req.params.id);
      const character = await storage.getCharacter(characterId);
      
      if (!character) {
        return res.status(404).json({ message: 'Character not found' });
      }
      
      const updatedCharacter = await storage.updateCharacter(characterId, req.body);
      
      // Create activity log
      await storage.createActivityLog({
        worldId: character.worldId,
        activityType: 'CHARACTER_UPDATED',
        entityId: characterId,
        description: `Updated character ${character.name}`
      });
      
      res.json(updatedCharacter);
    } catch (error) {
      console.error('Error updating character:', error);
      res.status(500).json({ message: 'Error updating character' });
    }
  });

  // Update character memory
  app.patch('/api/characters/:id/memory', async (req: Request, res: Response) => {
    try {
      const characterId = parseInt(req.params.id);
      const character = await storage.getCharacter(characterId);
      
      if (!character) {
        return res.status(404).json({ message: 'Character not found' });
      }
      
      // Get current memory and merge with new memory data
      const currentMemory = character.memory || {};
      const newMemory = { ...currentMemory, ...req.body };
      
      const updatedCharacter = await storage.updateCharacterMemory(characterId, newMemory);
      
      res.json(updatedCharacter);
    } catch (error) {
      console.error('Error updating character memory:', error);
      res.status(500).json({ message: 'Error updating character memory' });
    }
  });

  // Delete a character
  app.delete('/api/characters/:id', async (req: Request, res: Response) => {
    try {
      const characterId = parseInt(req.params.id);
      const character = await storage.getCharacter(characterId);
      
      if (!character) {
        return res.status(404).json({ message: 'Character not found' });
      }
      
      const success = await storage.deleteCharacter(characterId);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: 'Failed to delete character' });
      }
    } catch (error) {
      console.error('Error deleting character:', error);
      res.status(500).json({ message: 'Error deleting character' });
    }
  });

  // --------------------
  // Chat messages endpoints
  // --------------------
  
  // Get chat messages for a character
  app.get('/api/characters/:characterId/messages', async (req: Request, res: Response) => {
    try {
      const characterId = parseInt(req.params.characterId);
      const character = await storage.getCharacter(characterId);
      
      if (!character) {
        return res.status(404).json({ message: 'Character not found' });
      }
      
      const messages = await storage.getChatMessagesByCharacter(characterId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Error fetching messages' });
    }
  });

  // Create a new chat message
  app.post('/api/chat-messages', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertChatMessageSchema.parse({
        ...req.body,
        userId: 1 // For demo purposes, hardcode userId to 1
      });
      
      const newMessage = await storage.createChatMessage(validatedData);
      
      // Get the character
      const character = await storage.getCharacter(validatedData.characterId);
      
      if (character) {
        // Create activity log if it's a user message (only log the start of conversations)
        if (validatedData.isUserMessage) {
          const existingMessages = await storage.getChatMessagesByCharacter(validatedData.characterId);
          // If this is the first message or first message after a while, log it
          if (existingMessages.length <= 1) {
            await storage.createActivityLog({
              worldId: character.worldId,
              activityType: 'CHARACTER_CHAT',
              entityId: character.id,
              description: `Conversation with ${character.name}`
            });
          }
        }
      }
      
      res.status(201).json(newMessage);
    } catch (error) {
      console.error('Error creating chat message:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Error creating chat message' });
    }
  });

  // -------------------------
  // Character AI Response endpoint
  // -------------------------
  
  // Generate a character response
  app.post('/api/generate-character-response', async (req: Request, res: Response) => {
    try {
      const { characterId } = req.body;
      
      if (!characterId) {
        return res.status(400).json({ message: 'Missing characterId' });
      }
      
      // Get the character
      const character = await storage.getCharacter(parseInt(characterId));
      
      if (!character) {
        return res.status(404).json({ message: 'Character not found' });
      }
      
      // Get recent messages
      const messages = await storage.getChatMessagesByCharacter(character.id);
      
      // Generate the response
      const response = await generateCharacterResponse(character, messages);
      
      // Analyze the mood from the response
      const moodAnalysis = await analyzeMoodFromText(response);
      
      // Create a new message with the generated response
      const newMessage = await storage.createChatMessage({
        characterId: character.id,
        userId: 1, // Hardcoded for demo
        isUserMessage: false,
        content: response,
        mood: moodAnalysis.mood,
        moodIntensity: moodAnalysis.intensity,
        moodColor: moodAnalysis.dominantColor
      });
      
      // Update character's current mood
      await storage.updateCharacter(character.id, {
        currentMood: moodAnalysis.mood,
        currentMoodIntensity: moodAnalysis.intensity,
        currentMoodColor: moodAnalysis.dominantColor
      });
      
      // Return the generated response
      res.json({
        message: response,
        mood: moodAnalysis
      });
    } catch (error) {
      console.error('Error generating character response:', error);
      res.status(500).json({ message: 'Error generating character response' });
    }
  });
  
  // --------------
  // Scenes endpoints
  // --------------
  
  // Get all scenes for a world
  app.get('/api/worlds/:worldId/scenes', async (req: Request, res: Response) => {
    try {
      const worldId = parseInt(req.params.worldId);
      const world = await storage.getWorld(worldId);
      
      if (!world) {
        return res.status(404).json({ message: 'World not found' });
      }
      
      const scenes = await storage.getScenesByWorld(worldId);
      res.json(scenes);
    } catch (error) {
      console.error('Error fetching scenes:', error);
      res.status(500).json({ message: 'Error fetching scenes' });
    }
  });

  // Get a single scene
  app.get('/api/scenes/:id', async (req: Request, res: Response) => {
    try {
      const sceneId = parseInt(req.params.id);
      const scene = await storage.getScene(sceneId);
      
      if (!scene) {
        return res.status(404).json({ message: 'Scene not found' });
      }
      
      res.json(scene);
    } catch (error) {
      console.error('Error fetching scene:', error);
      res.status(500).json({ message: 'Error fetching scene' });
    }
  });

  // Create a new scene
  app.post('/api/scenes', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertSceneSchema.parse(req.body);
      
      const newScene = await storage.createScene(validatedData);
      
      // Create activity log
      await storage.createActivityLog({
        worldId: newScene.worldId,
        activityType: 'SCENE_CREATED',
        entityId: newScene.id,
        description: `Created scene ${newScene.title}`
      });
      
      res.status(201).json(newScene);
    } catch (error) {
      console.error('Error creating scene:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Error creating scene' });
    }
  });

  // Update a scene
  app.patch('/api/scenes/:id', async (req: Request, res: Response) => {
    try {
      const sceneId = parseInt(req.params.id);
      const scene = await storage.getScene(sceneId);
      
      if (!scene) {
        return res.status(404).json({ message: 'Scene not found' });
      }
      
      const updatedScene = await storage.updateScene(sceneId, req.body);
      
      // Create activity log
      await storage.createActivityLog({
        worldId: scene.worldId,
        activityType: 'SCENE_UPDATED',
        entityId: sceneId,
        description: `Updated scene ${scene.title}`
      });
      
      res.json(updatedScene);
    } catch (error) {
      console.error('Error updating scene:', error);
      res.status(500).json({ message: 'Error updating scene' });
    }
  });

  // Delete a scene
  app.delete('/api/scenes/:id', async (req: Request, res: Response) => {
    try {
      const sceneId = parseInt(req.params.id);
      const scene = await storage.getScene(sceneId);
      
      if (!scene) {
        return res.status(404).json({ message: 'Scene not found' });
      }
      
      const success = await storage.deleteScene(sceneId);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: 'Failed to delete scene' });
      }
    } catch (error) {
      console.error('Error deleting scene:', error);
      res.status(500).json({ message: 'Error deleting scene' });
    }
  });

  // -----------------
  // Activity logs endpoints
  // -----------------
  
  // Get activity logs for a world
  app.get('/api/worlds/:worldId/activity', async (req: Request, res: Response) => {
    try {
      const worldId = parseInt(req.params.worldId);
      const world = await storage.getWorld(worldId);
      
      if (!world) {
        return res.status(404).json({ message: 'World not found' });
      }
      
      // Get limit from query params
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const logs = await storage.getActivityLogsByWorld(worldId, limit);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      res.status(500).json({ message: 'Error fetching activity logs' });
    }
  });

  return httpServer;
}
