import {
  User, InsertUser, World, InsertWorld, Character, InsertCharacter,
  Scene, InsertScene, ChatMessage, InsertChatMessage, ActivityLog, InsertActivityLog
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // World operations
  getWorld(id: number): Promise<World | undefined>;
  getWorldsByUser(userId: number): Promise<World[]>;
  createWorld(world: InsertWorld): Promise<World>;
  updateWorld(id: number, data: Partial<World>): Promise<World | undefined>;
  deleteWorld(id: number): Promise<boolean>;

  // Character operations
  getCharacter(id: number): Promise<Character | undefined>;
  getCharactersByWorld(worldId: number): Promise<Character[]>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: number, data: Partial<Character>): Promise<Character | undefined>;
  updateCharacterMemory(id: number, memory: any): Promise<Character | undefined>;
  deleteCharacter(id: number): Promise<boolean>;

  // Scene operations
  getScene(id: number): Promise<Scene | undefined>;
  getScenesByWorld(worldId: number): Promise<Scene[]>;
  createScene(scene: InsertScene): Promise<Scene>;
  updateScene(id: number, data: Partial<Scene>): Promise<Scene | undefined>;
  deleteScene(id: number): Promise<boolean>;

  // Chat message operations
  getChatMessagesByCharacter(characterId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Activity log operations
  getActivityLogsByWorld(worldId: number, limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private worlds: Map<number, World>;
  private characters: Map<number, Character>;
  private scenes: Map<number, Scene>;
  private chatMessages: Map<number, ChatMessage>;
  private activityLogs: Map<number, ActivityLog>;
  
  private userIdCounter: number;
  private worldIdCounter: number;
  private characterIdCounter: number;
  private sceneIdCounter: number;
  private chatMessageIdCounter: number;
  private activityLogIdCounter: number;

  constructor() {
    this.users = new Map();
    this.worlds = new Map();
    this.characters = new Map();
    this.scenes = new Map();
    this.chatMessages = new Map();
    this.activityLogs = new Map();
    
    this.userIdCounter = 1;
    this.worldIdCounter = 1;
    this.characterIdCounter = 1;
    this.sceneIdCounter = 1;
    this.chatMessageIdCounter = 1;
    this.activityLogIdCounter = 1;
    
    // Add demo data
    this.initDemoData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // World operations
  async getWorld(id: number): Promise<World | undefined> {
    return this.worlds.get(id);
  }

  async getWorldsByUser(userId: number): Promise<World[]> {
    return Array.from(this.worlds.values()).filter(world => world.userId === userId);
  }

  async createWorld(insertWorld: InsertWorld): Promise<World> {
    const id = this.worldIdCounter++;
    const world: World = { 
      ...insertWorld, 
      id, 
      createdAt: new Date() 
    };
    this.worlds.set(id, world);
    return world;
  }

  async updateWorld(id: number, data: Partial<World>): Promise<World | undefined> {
    const world = this.worlds.get(id);
    if (!world) return undefined;
    
    const updatedWorld = { ...world, ...data };
    this.worlds.set(id, updatedWorld);
    return updatedWorld;
  }

  async deleteWorld(id: number): Promise<boolean> {
    return this.worlds.delete(id);
  }

  // Character operations
  async getCharacter(id: number): Promise<Character | undefined> {
    return this.characters.get(id);
  }

  async getCharactersByWorld(worldId: number): Promise<Character[]> {
    return Array.from(this.characters.values()).filter(char => char.worldId === worldId);
  }

  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const id = this.characterIdCounter++;
    const character: Character = { 
      ...insertCharacter, 
      id, 
      createdAt: new Date() 
    };
    this.characters.set(id, character);
    return character;
  }

  async updateCharacter(id: number, data: Partial<Character>): Promise<Character | undefined> {
    const character = this.characters.get(id);
    if (!character) return undefined;
    
    const updatedCharacter = { ...character, ...data };
    this.characters.set(id, updatedCharacter);
    return updatedCharacter;
  }

  async updateCharacterMemory(id: number, memory: any): Promise<Character | undefined> {
    const character = this.characters.get(id);
    if (!character) return undefined;
    
    const updatedCharacter = { ...character, memory };
    this.characters.set(id, updatedCharacter);
    return updatedCharacter;
  }

  async deleteCharacter(id: number): Promise<boolean> {
    return this.characters.delete(id);
  }

  // Scene operations
  async getScene(id: number): Promise<Scene | undefined> {
    return this.scenes.get(id);
  }

  async getScenesByWorld(worldId: number): Promise<Scene[]> {
    return Array.from(this.scenes.values())
      .filter(scene => scene.worldId === worldId)
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async createScene(insertScene: InsertScene): Promise<Scene> {
    const id = this.sceneIdCounter++;
    const scene: Scene = { 
      ...insertScene, 
      id, 
      createdAt: new Date() 
    };
    this.scenes.set(id, scene);
    return scene;
  }

  async updateScene(id: number, data: Partial<Scene>): Promise<Scene | undefined> {
    const scene = this.scenes.get(id);
    if (!scene) return undefined;
    
    const updatedScene = { ...scene, ...data };
    this.scenes.set(id, updatedScene);
    return updatedScene;
  }

  async deleteScene(id: number): Promise<boolean> {
    return this.scenes.delete(id);
  }

  // Chat message operations
  async getChatMessagesByCharacter(characterId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(msg => msg.characterId === characterId)
      .sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatMessageIdCounter++;
    const message: ChatMessage = { 
      ...insertMessage, 
      id, 
      createdAt: new Date() 
    };
    this.chatMessages.set(id, message);
    return message;
  }

  // Activity log operations
  async getActivityLogsByWorld(worldId: number, limit?: number): Promise<ActivityLog[]> {
    let logs = Array.from(this.activityLogs.values())
      .filter(log => log.worldId === worldId)
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    
    if (limit) {
      logs = logs.slice(0, limit);
    }
    
    return logs;
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.activityLogIdCounter++;
    const log: ActivityLog = { 
      ...insertLog, 
      id, 
      createdAt: new Date() 
    };
    this.activityLogs.set(id, log);
    return log;
  }

  // Initialize demo data
  private initDemoData() {
    // Create demo user
    const demoUser: User = {
      id: this.userIdCounter++,
      username: 'demouser',
      password: 'password' // In a real app, this would be hashed
    };
    this.users.set(demoUser.id, demoUser);

    // Create demo worlds
    const etherealIsles: World = {
      id: this.worldIdCounter++,
      userId: demoUser.id,
      name: 'Ethereal Isles',
      description: 'A realm of floating islands connected by magical bridges, where gravity is a suggestion and dragons soar between crystal formations.',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
    };
    this.worlds.set(etherealIsles.id, etherealIsles);

    const neonDistrict: World = {
      id: this.worldIdCounter++,
      userId: demoUser.id,
      name: 'Neon District',
      description: 'A sprawling metropolis where corporations rule and hackers are the new pirates, sailing the digital seas in search of valuable data.',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
    };
    this.worlds.set(neonDistrict.id, neonDistrict);

    const corsairsRealm: World = {
      id: this.worldIdCounter++,
      userId: demoUser.id,
      name: 'Corsair\'s Realm',
      description: 'A world of endless oceans and uncharted islands, where pirate crews battle for treasure and naval powers fight for control of the seas.',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    };
    this.worlds.set(corsairsRealm.id, corsairsRealm);

    // Create demo characters
    const lyra: Character = {
      id: this.characterIdCounter++,
      worldId: etherealIsles.id,
      name: 'Lyra Nightshade',
      role: 'Rogue Elf',
      appearance: 'A tall elven woman with silver hair and violet eyes. Dressed in dark leather with a cloak that seems to shift colors in the light.',
      personality: 'Cunning, distrustful, and witty. Values freedom above all else and has a soft spot for underdogs despite her tough exterior.',
      backstory: 'Raised in the floating forest settlements, Lyra turned to thievery after her home was destroyed by crystal miners. Now she steals magical artifacts from the wealthy and powerful.',
      memory: {
        interactions: 24,
        events: [
          { type: 'background', content: 'Master thief with a mysterious past, known for stealing magical artifacts without leaving a trace' },
          { type: 'knowledge', content: 'Knows the secret passages of the Crystal Tower' },
          { type: 'relationship', content: 'Distrusts authority figures, especially the Skyguard' }
        ]
      },
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 14 days ago
    };
    this.characters.set(lyra.id, lyra);

    const cipher: Character = {
      id: this.characterIdCounter++,
      worldId: neonDistrict.id,
      name: 'Cipher_9',
      role: 'Netrunner',
      appearance: 'Slender figure with cybernetic implants visible along the temples. Often wears a reflective visor and dark clothing with glowing circuit patterns.',
      personality: 'Analytical, paranoid, and brilliant. Speaks in technical jargon and views the world as a system to be hacked.',
      backstory: 'Former corporate programmer who discovered dark secrets in the code and went rogue. Now sells information to the highest bidder while avoiding corporate hunters.',
      memory: {
        interactions: 15,
        events: [
          { type: 'background', content: 'Legendary hacker who can breach any system, has illegal neural implants' },
          { type: 'knowledge', content: 'Knows about the backdoor into MegaTech\'s mainframe' },
          { type: 'relationship', content: 'Has a grudge against Director Chen of CyberSec Division' }
        ]
      },
      createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000) // 9 days ago
    };
    this.characters.set(cipher.id, cipher);

    const blackthorne: Character = {
      id: this.characterIdCounter++,
      worldId: corsairsRealm.id,
      name: 'Capt. Blackthorne',
      role: 'Pirate Captain',
      appearance: 'Tall, broad-shouldered with a weather-beaten face. Has a scar across his right eye and wears a leather tricorn hat adorned with a single raven feather.',
      personality: 'Bold, honorable among thieves, and superstitious. Commands loyalty through fairness rather than fear.',
      backstory: 'Once a naval officer who mutinied when ordered to attack innocent merchants. Now captains The Crimson Serpent, searching for the legendary Kraken\'s Pearl.',
      memory: {
        interactions: 31,
        events: [
          { type: 'background', content: 'Fearsome yet honorable pirate captain with a cursed ship and loyal crew' },
          { type: 'possession', content: 'Currently has the Kraken\'s Pearl hidden in his quarters' },
          { type: 'goal', content: 'Searching for the legendary treasure that can control the seas' }
        ]
      },
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
    };
    this.characters.set(blackthorne.id, blackthorne);

    // Create demo scenes
    const krakenScene: Scene = {
      id: this.sceneIdCounter++,
      worldId: corsairsRealm.id,
      title: 'The Kraken\'s Call',
      content: `Captain Blackthorne stood at the helm of The Crimson Serpent, his weathered hands gripping the wheel as the storm raged around them. Lightning split the sky, illuminating the churning waves that threatened to swallow the ship whole.

"Cap'n!" shouted Quartermaster Reed from the main deck. "The men say they heard it again—the call of the Kraken!"

Blackthorne's scarred face remained impassive, but his knuckles whitened against the wheel. "Tell them to hold steady. No creature of the deep will claim my ship this night."

But even as the words left his lips, he felt it—a vibration through the hull that was neither thunder nor wave. Something ancient and terrible was rising from the abyss, drawn to the legendary relic hidden in the captain's quarters.

The Kraken's Pearl pulsed with an eerie blue light, visible even through the locked chest where Blackthorne had secured it. The artifact was said to control the seas themselves, but at what cost?

As tentacles began to emerge from the darkness below, Blackthorne made his decision. Some treasures were never meant to be claimed by mortal men...`,
      styleType: 'Novel - Descriptive',
      tone: 'Dramatic',
      includedCharacters: [blackthorne.id],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    };
    this.scenes.set(krakenScene.id, krakenScene);

    // Create activity logs
    const activities = [
      {
        worldId: etherealIsles.id,
        activityType: 'CHARACTER_CREATED',
        entityId: lyra.id,
        description: 'Created character Lyra Nightshade',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      },
      {
        worldId: neonDistrict.id,
        activityType: 'CHARACTER_CREATED',
        entityId: cipher.id,
        description: 'Created character Cipher_9',
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
      },
      {
        worldId: corsairsRealm.id,
        activityType: 'CHARACTER_CREATED',
        entityId: blackthorne.id,
        description: 'Created character Capt. Blackthorne',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      },
      {
        worldId: corsairsRealm.id,
        activityType: 'SCENE_CREATED',
        entityId: krakenScene.id,
        description: 'Created scene The Kraken\'s Call',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        worldId: etherealIsles.id,
        activityType: 'CHARACTER_CHAT',
        entityId: lyra.id,
        description: 'Conversation with Lyra',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        worldId: etherealIsles.id,
        activityType: 'WORLD_UPDATED',
        entityId: etherealIsles.id,
        description: 'Added Floating Bazaar location',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];

    for (const activity of activities) {
      const id = this.activityLogIdCounter++;
      const log: ActivityLog = { ...activity, id };
      this.activityLogs.set(id, log);
    }

    // Create demo chat messages
    const chatMessages = [
      {
        characterId: lyra.id,
        userId: demoUser.id,
        isUserMessage: false,
        content: "*Lyra leans against a crystal formation, twirling a small dagger between her fingers*\n\nWell, look who finally decided to show up. I was beginning to think you'd gotten lost in the lower mists again. Not many people can find me when I don't want to be found.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 600000)
      },
      {
        characterId: lyra.id,
        userId: demoUser.id,
        isUserMessage: true,
        content: "I've been looking for someone with your particular skills, Lyra. They say you're the only thief who's ever infiltrated the Crystal Tower.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 540000)
      },
      {
        characterId: lyra.id,
        userId: demoUser.id,
        isUserMessage: false,
        content: "*Her eyes narrow slightly, the dagger suddenly still in her hand*\n\nThat's quite a reputation to have. And what if I told you those rumors were just that—rumors? Though I must admit, I'm curious what you'd want from the Tower. The Skyguard doesn't take kindly to thieves, and the magical defenses... well, let's just say they're creative in their punishments.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 480000)
      },
      {
        characterId: lyra.id,
        userId: demoUser.id,
        isUserMessage: true,
        content: "I'm not interested in stealing anything. I need information. There's an ancient map hidden in the archives that could lead to something valuable—something that might interest even you.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 420000)
      },
      {
        characterId: lyra.id,
        userId: demoUser.id,
        isUserMessage: false,
        content: "*Lyra laughs, a musical sound that echoes off the floating rocks around you*\n\nInformation can be more valuable than gold—and often more dangerous. What makes you think I'd risk my neck for a map that might lead to something valuable? I deal in certainties, not possibilities.\n\nBut I'm listening. What exactly is this \"something valuable\" that has you seeking out a notorious thief?",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 360000)
      }
    ];

    for (const message of chatMessages) {
      const id = this.chatMessageIdCounter++;
      const chatMessage: ChatMessage = { ...message, id };
      this.chatMessages.set(id, chatMessage);
    }
  }
}

export const storage = new MemStorage();
