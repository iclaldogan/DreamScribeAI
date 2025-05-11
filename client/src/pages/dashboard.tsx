import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, WandSparkles, ArrowRight } from "lucide-react";
import { World, Character, Scene } from "@shared/schema";
import WorldCard from "@/components/world-card";
import CharacterCard from "@/components/character-card";
import SceneDisplay from "@/components/scene-display";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const [username] = useState("Morgan");

  // Fetch worlds
  const { data: worlds, isLoading: isLoadingWorlds } = useQuery({
    queryKey: ['/api/worlds'],
    staleTime: 60000, // 1 minute
  });

  // Fetch characters (we'll filter them later)
  const { data: allCharacters, isLoading: isLoadingCharacters } = useQuery({
    queryKey: ['/api/worlds/1/characters'],
    staleTime: 60000,
  });

  // Fetch the most recent scene
  const { data: scenes, isLoading: isLoadingScenes } = useQuery({
    queryKey: ['/api/worlds/3/scenes'], // Corsair's Realm world ID
    staleTime: 60000,
  });

  const handleNewWorld = () => {
    // For demo purposes, this will just show a toast
    toast({
      title: "Create New World",
      description: "This feature is coming soon!",
      duration: 3000,
    });
  };

  const handleGenerateStoryIdea = () => {
    // For demo purposes, this will just show a toast
    toast({
      title: "Generate Story Idea",
      description: "This feature is coming soon!",
      duration: 3000,
    });
  };

  // Get characters count for each world
  const getCharacterCount = (worldId: number) => {
    if (!allCharacters) return 0;
    return allCharacters.filter((char: Character) => char.worldId === worldId).length;
  };

  // Get most recent scene
  const mostRecentScene = scenes && scenes.length > 0 ? scenes[0] : null;

  return (
    <section className="space-y-6">
      {/* Welcome & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <div className="lg:col-span-2 glassmorphism rounded-xl p-6 border border-secondary/20 yellow-glow">
          <h2 className="text-2xl font-bold text-secondary mb-2">Ahoy, Captain {username}!</h2>
          <p className="text-neutral-light mb-4">
            Your storytelling adventure awaits. Create new worlds, breathe life into characters, and weave tales untold.
          </p>
          
          <div className="flex flex-wrap gap-4 mt-6">
            <Button
              className="bg-secondary hover:bg-secondary/80 text-primary font-bold py-2 px-6 rounded-full flex items-center space-x-2"
              onClick={handleNewWorld}
            >
              <Plus className="h-4 w-4" />
              <span>New World</span>
            </Button>
            <Button
              variant="outline"
              className="bg-transparent hover:bg-accent/20 text-accent border border-accent font-bold py-2 px-6 rounded-full flex items-center space-x-2"
              onClick={handleGenerateStoryIdea}
            >
              <WandSparkles className="h-4 w-4" />
              <span>Generate Story Idea</span>
            </Button>
          </div>
        </div>
        
        {/* Stats Card */}
        <div className="glassmorphism rounded-xl p-6 border border-secondary/20 text-neutral-light yellow-glow">
          <h3 className="text-xl font-bold text-secondary mb-4">Your Journey</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Worlds Created</span>
              <span className="text-2xl font-bold text-secondary">
                {isLoadingWorlds ? <Skeleton className="h-8 w-8" /> : worlds?.length || 0}
              </span>
            </div>
            <div className="w-full bg-neutral-dark/50 rounded-full h-2">
              <div 
                className="bg-secondary h-2 rounded-full" 
                style={{ width: isLoadingWorlds ? '0%' : `${Math.min((worlds?.length || 0) * 20, 100)}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Characters</span>
              <span className="text-2xl font-bold text-accent">
                {isLoadingCharacters ? <Skeleton className="h-8 w-8" /> : allCharacters?.length || 0}
              </span>
            </div>
            <div className="w-full bg-neutral-dark/50 rounded-full h-2">
              <div 
                className="bg-accent h-2 rounded-full" 
                style={{ width: isLoadingCharacters ? '0%' : `${Math.min((allCharacters?.length || 0) * 8, 100)}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Stories Written</span>
              <span className="text-2xl font-bold text-primary">
                {isLoadingScenes ? <Skeleton className="h-8 w-8" /> : scenes?.length || 0}
              </span>
            </div>
            <div className="w-full bg-neutral-dark/50 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: isLoadingScenes ? '0%' : `${Math.min((scenes?.length || 0) * 15, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recently Visited Worlds */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-secondary">Recently Visited</h2>
          <Link href="/worlds">
            <a className="text-accent hover:text-accent/80 text-sm">View All Worlds</a>
          </Link>
        </div>
        
        {isLoadingWorlds ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="h-64">
                <Skeleton className="h-40 w-full" />
                <div className="p-4 space-y-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {worlds?.map((world: World) => (
              <WorldCard 
                key={world.id} 
                world={world} 
                characterCount={getCharacterCount(world.id)} 
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Characters Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-secondary">Your Characters</h2>
          <Link href="/characters">
            <a className="text-accent hover:text-accent/80 text-sm">View All Characters</a>
          </Link>
        </div>
        
        {isLoadingCharacters ? (
          <div className="flex gap-6 overflow-x-auto pb-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="flex-shrink-0 w-64 h-64">
                <div className="p-4 flex items-center space-x-3 border-b">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
            {allCharacters?.map((character: Character) => (
              <CharacterCard key={character.id} character={character} />
            ))}
          </div>
        )}
      </div>
      
      {/* Recent Scenes */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-secondary">Recent Scenes</h2>
          <Link href="/scenes">
            <a className="text-accent hover:text-accent/80 text-sm">Create New Scene</a>
          </Link>
        </div>
        
        {isLoadingScenes || !mostRecentScene ? (
          <Card className="h-64 p-6">
            <Skeleton className="h-8 w-1/3 mb-4" />
            <Skeleton className="h-4 w-1/4 mb-6" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </Card>
        ) : (
          <SceneDisplay scene={mostRecentScene} />
        )}
      </div>
    </section>
  );
}
