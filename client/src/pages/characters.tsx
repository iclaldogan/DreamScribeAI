import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Character, World } from "@shared/schema";
import { Plus, Filter, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import CharacterCard from "@/components/character-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";

// Form schema for creating a character
const characterFormSchema = z.object({
  worldId: z.string().min(1, "World must be selected"),
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be at most 50 characters"),
  role: z.string().min(2, "Role must be at least 2 characters").max(50, "Role must be at most 50 characters"),
  appearance: z.string().optional(),
  personality: z.string().min(10, "Personality must be at least 10 characters"),
  backstory: z.string().optional(),
});

export default function Characters() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [worldFilter, setWorldFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch all characters
  const { data: allCharacters, isLoading: isLoadingCharacters } = useQuery<Character[]>({
    queryKey: ['/api/characters'], // Now using the dedicated endpoint for all characters
    staleTime: 60000,
  });
  
  // Fetch all worlds for the filter and form
  const { data: worlds, isLoading: isLoadingWorlds } = useQuery<World[]>({
    queryKey: ['/api/worlds'],
    staleTime: 60000,
  });

  // Setup form for character creation
  const form = useForm<z.infer<typeof characterFormSchema>>({
    resolver: zodResolver(characterFormSchema),
    defaultValues: {
      worldId: "",
      name: "",
      role: "",
      appearance: "",
      personality: "",
      backstory: "",
    },
  });

  // Create character mutation
  const createCharacterMutation = useMutation({
    mutationFn: async (values: z.infer<typeof characterFormSchema>) => {
      // Convert worldId to number
      const characterData = {
        ...values,
        worldId: parseInt(values.worldId),
        memory: { interactions: 0, events: [] }
      };
      
      const response = await apiRequest('POST', '/api/characters', characterData);
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate all character queries
      queryClient.invalidateQueries({ queryKey: ['/api/characters'] });
      
      // Also invalidate the specific world characters query to ensure consistency
      if (data.worldId) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/worlds/${data.worldId}/characters`] 
        });
      }
      
      setIsDialogOpen(false);
      form.reset();
      
      toast({
        title: "Character Created",
        description: "Your new character has been created successfully!",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error("Error creating character:", error);
      toast({
        title: "Error",
        description: "Failed to create character. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: z.infer<typeof characterFormSchema>) => {
    createCharacterMutation.mutate(values);
  };

  // Filter characters by world and search query
  const filteredCharacters = allCharacters?.filter(character => {
    const matchesWorld = !worldFilter || character.worldId.toString() === worldFilter;
    const matchesSearch = !searchQuery || 
      character.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      character.role.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesWorld && matchesSearch;
  });

  // Get world name by ID
  const getWorldName = (worldId: number) => {
    if (!worlds) return "Unknown World";
    const world = worlds.find(w => w.id === worldId);
    return world ? world.name : "Unknown World";
  };

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-secondary">Characters</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/80 text-white font-bold">
              <Plus className="h-4 w-4 mr-2" />
              New Character
            </Button>
          </DialogTrigger>
          <DialogContent className="glassmorphism sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl text-secondary">Create New Character</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="worldId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary">World</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-neutral-dark/40 text-neutral-light border-secondary/20">
                            <SelectValue placeholder="Select a world" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {worlds?.map(world => (
                            <SelectItem key={world.id} value={world.id.toString()}>
                              {world.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary">Character Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter character name" 
                          className="bg-neutral-dark/40 text-neutral-light border-secondary/20" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary">Role or Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Pirate Captain, Rogue Elf" 
                          className="bg-neutral-dark/40 text-neutral-light border-secondary/20" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="appearance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary">Appearance (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe how your character looks..." 
                          className="bg-neutral-dark/40 text-neutral-light border-secondary/20" 
                          rows={2}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="personality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary">Personality</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your character's personality traits..." 
                          className="bg-neutral-dark/40 text-neutral-light border-secondary/20" 
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="backstory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary">Backstory (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Share your character's history and background..." 
                          className="bg-neutral-dark/40 text-neutral-light border-secondary/20" 
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    className="bg-accent hover:bg-accent/80 text-white font-bold"
                    disabled={createCharacterMutation.isPending}
                  >
                    {createCharacterMutation.isPending ? "Creating..." : "Create Character"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <p className="text-neutral-light">
        Create and chat with unique characters from your worlds. Each character has their own personality and memories.
      </p>
      
      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search" className="text-secondary mb-2 block">Search Characters</Label>
          <div className="relative">
            <Input
              id="search"
              placeholder="Search by name or role..."
              className="bg-neutral-dark/40 text-neutral-light border-secondary/20 pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 absolute left-3 top-2.5 text-neutral-light/50" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>
        <div className="sm:w-64">
          <Label htmlFor="world-filter" className="text-secondary mb-2 block">Filter by World</Label>
          <Select onValueChange={value => setWorldFilter(value === "all" ? null : value)}>
            <SelectTrigger id="world-filter" className="bg-neutral-dark/40 text-neutral-light border-secondary/20">
              <SelectValue placeholder="All Worlds" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Worlds</SelectItem>
              {worlds?.map(world => (
                <SelectItem key={world.id} value={world.id.toString()}>
                  {world.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoadingCharacters || isLoadingWorlds ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glassmorphism rounded-xl overflow-hidden border border-accent/20 h-64">
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
            </div>
          ))}
        </div>
      ) : filteredCharacters && filteredCharacters.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCharacters.map(character => (
            <div key={character.id} className="flex flex-col h-full">
              <CharacterCard character={character} />
              <div className="mt-2 text-xs text-neutral-light/70 text-center">
                {getWorldName(character.worldId)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glassmorphism rounded-xl p-8 text-center border border-accent/20">
          <h3 className="text-xl font-bold text-accent mb-4">No Characters Found</h3>
          {worldFilter || searchQuery ? (
            <p className="text-neutral-light mb-6">
              No characters match your current filters. Try adjusting your search or filter criteria.
            </p>
          ) : (
            <p className="text-neutral-light mb-6">
              You haven't created any characters yet. Characters bring your worlds to life!
            </p>
          )}
          <Button 
            className="bg-accent hover:bg-accent/80 text-white font-bold"
            onClick={() => setIsDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Create Your First Character
          </Button>
        </div>
      )}
    </section>
  );
}
