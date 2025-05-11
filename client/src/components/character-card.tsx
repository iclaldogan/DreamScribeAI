import { Link } from "wouter";
import { Character } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CharacterCardProps {
  character: Character;
  compact?: boolean;
  className?: string;
}

export default function CharacterCard({ character, compact = false, className }: CharacterCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  
  // Delete character mutation
  const deleteCharacterMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/characters/${character.id}`);
      return response;
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/characters'] });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/worlds/${character.worldId}/characters`] 
      });
      
      toast({
        title: "Character Deleted",
        description: `${character.name} has been removed successfully.`,
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error("Error deleting character:", error);
      toast({
        title: "Error",
        description: "Failed to delete the character. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });
  
  const handleDelete = () => {
    deleteCharacterMutation.mutate();
    setIsOpen(false);
  };
  
  const getCharacterImage = (role: string, name: string) => {
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
  };

  const getInteractionCount = () => {
    if (character.memory && typeof character.memory === 'object' && 'interactions' in character.memory) {
      return character.memory.interactions;
    }
    return 0;
  };

  const interactionCount = getInteractionCount();

  if (compact) {
    return (
      <div className={cn(
        "glassmorphism rounded-lg p-3 border border-accent/10 hover:orange-glow transition-all duration-300",
        className
      )}>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-accent flex-shrink-0">
            <img 
              src={getCharacterImage(character.role, character.name)} 
              alt={character.name} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-accent">{character.name}</h4>
            <p className="text-xs text-neutral-light">{character.role} • {interactionCount} memories</p>
          </div>
          <div className="flex items-center space-x-2">
            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-500 hover:bg-red-500/10">
                  <Trash2 size={18} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Character</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {character.name}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Link href={`/chat/${character.id}`}>
              <a className="text-accent hover:text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </a>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "glassmorphism flex-shrink-0 w-64 rounded-xl overflow-hidden border border-accent/20 hover:orange-glow transition-all duration-300 snap-start",
      className
    )}>
      <div className="p-4 flex items-center space-x-3 border-b border-accent/10">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-accent">
          <img 
            src={getCharacterImage(character.role, character.name)} 
            alt={character.name} 
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h3 className="font-bold text-accent">{character.name}</h3>
          <p className="text-xs text-neutral-light">{character.role}</p>
        </div>
      </div>
      <div className="p-4">
        <p className="text-neutral-light text-sm mb-3 line-clamp-3">{character.personality}</p>
        <div className="text-xs text-neutral-light/80 mb-4">
          <div className="flex justify-between mb-1">
            <span>Memory</span>
            <span>{interactionCount} interactions</span>
          </div>
          <div className="w-full bg-neutral-dark/50 rounded-full h-1.5">
            <div 
              className="bg-accent h-1.5 rounded-full" 
              style={{ width: `${Math.min(interactionCount * 3, 100)}%` }}
            ></div>
          </div>
        </div>
        <div className="flex space-x-2">
          <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="flex-1">
                <Trash2 size={16} className="mr-1" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Character</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {character.name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Link href={`/chat/${character.id}`}>
            <a className="flex-1 bg-accent/20 hover:bg-accent/30 text-accent py-2 rounded-lg transition duration-300 text-sm text-center">
              Chat with {character.name.split(' ')[0]}
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
