import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Character, ChatMessage, World } from "@shared/schema";
import { ArrowLeft, Info, VolumeX, Volume2, Send, Mic, WandSparkles, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { generateCharacterResponse } from "@/lib/gemini";

export default function CharacterChat() {
  const { id } = useParams<{ id: string }>();
  const characterId = parseInt(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userMessage, setUserMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch character details
  const { 
    data: character, 
    isLoading: isLoadingCharacter,
    isError: isCharacterError
  } = useQuery<Character>({
    queryKey: [`/api/characters/${characterId}`],
    enabled: !isNaN(characterId),
    staleTime: 60000,
  });

  // Fetch world details for the character
  const { data: world } = useQuery<World>({
    queryKey: [`/api/worlds/${character?.worldId}`],
    enabled: !!character?.worldId,
    staleTime: 60000,
  });

  // Fetch chat messages for this character
  const { 
    data: messages, 
    isLoading: isLoadingMessages 
  } = useQuery<ChatMessage[]>({
    queryKey: [`/api/characters/${characterId}/messages`],
    enabled: !isNaN(characterId),
    staleTime: 60000,
  });

  // Create chat message mutation
  const createMessageMutation = useMutation({
    mutationFn: async (message: { characterId: number; isUserMessage: boolean; content: string }) => {
      const response = await apiRequest('POST', '/api/chat-messages', {
        ...message,
        userId: 1, // For demo purposes, hardcode userId to 1
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${characterId}/messages`] });
    },
    onError: (error) => {
      console.error("Error creating message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  // Handle send message
  const handleSendMessage = async () => {
    if (!userMessage.trim() || !character) return;
    
    // Create user message
    createMessageMutation.mutate({
      characterId,
      isUserMessage: true,
      content: userMessage,
    });
    
    // Clear input
    setUserMessage("");
    
    // Generate AI response
    try {
      setIsGenerating(true);
      
      // Get AI response using Gemini API
      const aiResponse = await generateCharacterResponse({
        character: {
          name: character.name,
          role: character.role,
          appearance: character.appearance || "",
          personality: character.personality,
          backstory: character.backstory || "",
          memory: character.memory,
        },
        userMessage,
        characterId, // Pass the characterId for the API request
      });
      
      // Create AI message
      createMessageMutation.mutate({
        characterId,
        isUserMessage: false,
        content: aiResponse,
      });
      
      // Update character memory
      // In a real implementation, you would extract relevant information from the conversation
      // and update the character's memory
      
    } catch (error) {
      console.error("Error generating AI response:", error);
      toast({
        title: "AI Error",
        description: "Failed to generate character response. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Enter key to send message
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    toast({
      title: isAudioEnabled ? "Audio Disabled" : "Audio Enabled",
      description: isAudioEnabled 
        ? "Character voice responses have been disabled."
        : "Character voice responses have been enabled.",
      duration: 3000,
    });
  };

  // Suggest responses
  const suggestResponses = () => {
    toast({
      title: "AI Suggestions",
      description: "Response suggestions feature is coming soon!",
      duration: 3000,
    });
  };

  // Save conversation
  const saveConversation = () => {
    toast({
      title: "Conversation Saved",
      description: "This conversation has been saved to your collection.",
      duration: 3000,
    });
  };

  // Voice recording
  const recordVoice = () => {
    toast({
      title: "Voice Recording",
      description: "Voice recording feature is coming soon!",
      duration: 3000,
    });
  };

  if (isNaN(characterId) || isCharacterError) {
    return (
      <div className="glassmorphism rounded-xl p-8 text-center border border-secondary/20">
        <h2 className="text-2xl font-bold text-secondary mb-4">Character Not Found</h2>
        <p className="text-neutral-light mb-6">
          Sorry, we couldn't find the character you're looking for. They may have been deleted or never existed.
        </p>
        <Link href="/characters">
          <Button className="bg-secondary hover:bg-secondary/80 text-primary font-bold">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Characters
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <section className="h-[calc(100vh-130px)] flex flex-col overflow-hidden">
      <div className="flex flex-col h-full">
        {/* Character header */}
        <div className="glassmorphism rounded-t-xl p-4 border-b border-accent/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isLoadingCharacter ? (
              <>
                <Skeleton className="w-12 h-12 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-accent">
                  <img 
                    src={getCharacterImage(character?.role || "", character?.name || "")} 
                    alt={character?.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-accent">{character?.name}</h3>
                  <p className="text-xs text-neutral-light">
                    {character?.role} • {world?.name}
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-neutral-light hover:text-accent"
              onClick={toggleAudio}
              title={isAudioEnabled ? "Disable audio" : "Enable audio"}
            >
              {isAudioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-neutral-light hover:text-accent"
              onClick={() => {
                toast({
                  title: "Character Info",
                  description: "Character information panel is coming soon!",
                  duration: 3000,
                });
              }}
              title="Character information"
            >
              <Info className="h-5 w-5" />
            </Button>
            <Link href="/characters">
              <Button
                variant="ghost"
                size="icon"
                className="text-neutral-light hover:text-accent"
                title="Close chat"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Messages area */}
        <div className="flex-1 glassmorphism p-4 overflow-y-auto">
          {isLoadingMessages ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className={`flex items-start space-x-3 ${i % 2 === 0 ? 'justify-end' : ''}`}>
                  {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />}
                  <Skeleton className={`h-24 w-4/5 rounded-xl ${i % 2 === 0 ? 'rounded-tr-none' : 'rounded-tl-none'}`} />
                  {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />}
                </div>
              ))}
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map(message => (
                <div key={message.id} className={`flex items-start ${message.isUserMessage ? 'justify-end space-x-3' : 'space-x-3'}`}>
                  {!message.isUserMessage && (
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-accent flex-shrink-0">
                      <img 
                        src={getCharacterImage(character?.role || "", character?.name || "")} 
                        alt={character?.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div 
                    className={`p-3 rounded-xl max-w-[80%] ${
                      message.isUserMessage 
                        ? 'bg-accent/30 text-white rounded-tr-none' 
                        : 'bg-neutral-dark/40 text-neutral-light rounded-tl-none'
                    }`}
                  >
                    <div className="whitespace-pre-line">{message.content}</div>
                  </div>
                  {message.isUserMessage && (
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-secondary flex-shrink-0">
                      <img 
                        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100" 
                        alt="User" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
              {isGenerating && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-accent flex-shrink-0">
                    <img 
                      src={getCharacterImage(character?.role || "", character?.name || "")}
                      alt={character?.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="bg-neutral-dark/40 p-3 rounded-xl rounded-tl-none text-neutral-light">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 bg-neutral-light/50 rounded-full animate-pulse"></div>
                      <div className="h-2 w-2 bg-neutral-light/50 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                      <div className="h-2 w-2 bg-neutral-light/50 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-neutral-light/70 text-center p-6">
              <p className="mb-2">
                Start a conversation with {character?.name || "this character"}.
              </p>
              <p className="text-sm">
                They will respond based on their personality and memories.
              </p>
            </div>
          )}
        </div>
        
        {/* Input area */}
        <div className="glassmorphism rounded-b-xl p-4 border-t border-accent/20">
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <Textarea
                className="w-full bg-neutral-dark/40 text-neutral-light rounded-xl p-3 border border-accent/10 focus:border-accent focus:outline-none resize-none"
                placeholder={`Type your message to ${character?.name || "character"}...`}
                rows={2}
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isGenerating}
              />
            </div>
            <Button
              className="bg-accent hover:bg-accent/80 text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0"
              onClick={handleSendMessage}
              disabled={!userMessage.trim() || isGenerating}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex justify-between mt-3 text-xs text-neutral-light">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-1 hover:text-accent p-0 h-auto"
              onClick={recordVoice}
            >
              <Mic className="h-3 w-3" />
              <span>Record Voice</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-1 hover:text-accent p-0 h-auto"
              onClick={suggestResponses}
            >
              <WandSparkles className="h-3 w-3" />
              <span>Suggest Responses</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-1 hover:text-accent p-0 h-auto"
              onClick={saveConversation}
            >
              <Save className="h-3 w-3" />
              <span>Save Conversation</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Helper function to get character image based on role and name
function getCharacterImage(role: string, name: string) {
  // Return different profile images based on character role or name
  if (role.toLowerCase().includes('elf') || name.toLowerCase().includes('lyra')) {
    return 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100';
  } else if (role.toLowerCase().includes('net') || role.toLowerCase().includes('hacker') || name.toLowerCase().includes('cipher')) {
    return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100';
  } else if (role.toLowerCase().includes('captain') || role.toLowerCase().includes('pirate') || name.toLowerCase().includes('blackthorne')) {
    return 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100';
  } else if (role.toLowerCase().includes('mage') || name.toLowerCase().includes('orrin')) {
    return 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100';
  } else if (name.toLowerCase().includes('nayla')) {
    return 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100';
  } else {
    // Default image
    return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100';
  }
}
