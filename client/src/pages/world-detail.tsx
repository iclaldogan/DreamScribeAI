import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Edit, UserPlus, ArrowLeft, MapPin } from "lucide-react";
import { Character, World, ActivityLog } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import CharacterCard from "@/components/character-card";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';

// Form schema for editing a world
const worldFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50, "Name must be at most 50 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description must be at most 500 characters"),
});

// Form schema for creating a character
const characterFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be at most 50 characters"),
  role: z.string().min(2, "Role must be at least 2 characters").max(50, "Role must be at most 50 characters"),
  appearance: z.string().optional(),
  personality: z.string().min(10, "Personality must be at least 10 characters"),
  backstory: z.string().optional(),
});

export default function WorldDetail() {
  const { id } = useParams<{ id: string }>();
  const worldId = parseInt(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddCharacterDialogOpen, setIsAddCharacterDialogOpen] = useState(false);

  // Fetch world details
  const { 
    data: world, 
    isLoading: isLoadingWorld,
    isError: isWorldError
  } = useQuery<World>({
    queryKey: [`/api/worlds/${worldId}`],
    enabled: !isNaN(worldId),
    staleTime: 60000,
  });

  // Fetch characters for this world
  const { 
    data: characters, 
    isLoading: isLoadingCharacters 
  } = useQuery<Character[]>({
    queryKey: [`/api/worlds/${worldId}/characters`],
    enabled: !isNaN(worldId),
    staleTime: 60000,
  });

  // Fetch activity logs for this world
  const { 
    data: activityLogs, 
    isLoading: isLoadingActivity 
  } = useQuery<ActivityLog[]>({
    queryKey: [`/api/worlds/${worldId}/activity?limit=5`],
    enabled: !isNaN(worldId),
    staleTime: 60000,
  });

  // Setup form with zod validation for world editing
  const worldForm = useForm<z.infer<typeof worldFormSchema>>({
    resolver: zodResolver(worldFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Setup form for character creation
  const characterForm = useForm<z.infer<typeof characterFormSchema>>({
    resolver: zodResolver(characterFormSchema),
    defaultValues: {
      name: "",
      role: "",
      appearance: "",
      personality: "",
      backstory: "",
    },
  });

  // Set form values when world data is loaded
  useEffect(() => {
    if (world) {
      worldForm.reset({
        name: world.name,
        description: world.description,
      });
    }
  }, [world, worldForm]);

  // Edit world mutation
  const updateWorldMutation = useMutation({
    mutationFn: async (values: z.infer<typeof worldFormSchema>) => {
      const response = await apiRequest('PATCH', `/api/worlds/${worldId}`, values);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/worlds/${worldId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/worlds'] });
      setIsEditDialogOpen(false);
      
      toast({
        title: "World Updated",
        description: "Your world has been updated successfully!",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error("Error updating world:", error);
      toast({
        title: "Error",
        description: "Failed to update world. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  // Create character mutation
  const createCharacterMutation = useMutation({
    mutationFn: async (values: z.infer<typeof characterFormSchema>) => {
      // Add worldId to the character data
      const characterData = {
        ...values,
        worldId,
        memory: { interactions: 0, events: [] }
      };
      
      const response = await apiRequest('POST', '/api/characters', characterData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/worlds/${worldId}/characters`] });
      queryClient.invalidateQueries({ queryKey: [`/api/worlds/${worldId}/activity`] });
      setIsAddCharacterDialogOpen(false);
      characterForm.reset();
      
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

  // Form submission handlers
  const onWorldSubmit = (values: z.infer<typeof worldFormSchema>) => {
    updateWorldMutation.mutate(values);
  };

  const onCharacterSubmit = (values: z.infer<typeof characterFormSchema>) => {
    createCharacterMutation.mutate(values);
  };

  const formatDate = (date: Date) => {
    try {
      return format(new Date(date), 'MMMM d, yyyy');
    } catch (error) {
      return 'Unknown date';
    }
  };

  // Get activity icon based on type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CHARACTER_CREATED':
        return <div className="text-accent font-semibold">New Character</div>;
      case 'SCENE_CREATED':
        return <div className="text-accent font-semibold">New Scene Created</div>;
      case 'CHARACTER_CHAT':
        return <div className="text-secondary font-semibold">Character Chat</div>;
      case 'WORLD_UPDATED':
        return <div className="text-secondary font-semibold">World Updated</div>;
      case 'WORLD_CREATED':
        return <div className="text-primary font-semibold">World Created</div>;
      default:
        return <div className="text-primary font-semibold">Activity</div>;
    }
  };

  if (isNaN(worldId) || isWorldError) {
    return (
      <div className="glassmorphism rounded-xl p-8 text-center border border-secondary/20">
        <h2 className="text-2xl font-bold text-secondary mb-4">World Not Found</h2>
        <p className="text-neutral-light mb-6">
          Sorry, we couldn't find the world you're looking for. It may have been deleted or never existed.
        </p>
        <Link href="/worlds">
          <Button className="bg-secondary hover:bg-secondary/80 text-primary font-bold">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Worlds
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center mb-4">
        <Link href="/worlds">
          <a className="text-secondary hover:text-accent mr-4">
            <ArrowLeft className="h-5 w-5" />
          </a>
        </Link>
        <h1 className="text-2xl font-bold text-secondary">World Details</h1>
      </div>

      <div className="glassmorphism rounded-xl p-6 border border-secondary/20 yellow-glow">
        <div className="flex items-center justify-between mb-6">
          <div>
            {isLoadingWorld ? (
              <>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-secondary">{world?.name}</h2>
                <p className="text-neutral-light">Created on {world && formatDate(world.createdAt)}</p>
              </>
            )}
          </div>
          <div className="flex space-x-4">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-transparent hover:bg-secondary/20 text-secondary border border-secondary">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="glassmorphism sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-xl text-secondary">Edit World</DialogTitle>
                </DialogHeader>
                <Form {...worldForm}>
                  <form onSubmit={worldForm.handleSubmit(onWorldSubmit)} className="space-y-4 pt-4">
                    <FormField
                      control={worldForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-secondary">World Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter a name for your world" 
                              className="bg-neutral-dark/40 text-neutral-light border-secondary/20" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={worldForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-secondary">Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your world in detail..." 
                              className="bg-neutral-dark/40 text-neutral-light border-secondary/20" 
                              rows={5}
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
                        className="bg-secondary hover:bg-secondary/80 text-primary font-bold"
                        disabled={updateWorldMutation.isPending}
                      >
                        {updateWorldMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddCharacterDialogOpen} onOpenChange={setIsAddCharacterDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/80 text-white">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Character
                </Button>
              </DialogTrigger>
              <DialogContent className="glassmorphism sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-xl text-secondary">Create New Character</DialogTitle>
                </DialogHeader>
                <Form {...characterForm}>
                  <form onSubmit={characterForm.handleSubmit(onCharacterSubmit)} className="space-y-4 pt-4">
                    <FormField
                      control={characterForm.control}
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
                      control={characterForm.control}
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
                      control={characterForm.control}
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
                      control={characterForm.control}
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
                      control={characterForm.control}
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
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-secondary mb-2">World Description</h3>
              <div className="glassmorphism p-4 rounded-lg text-neutral-light">
                {isLoadingWorld ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <p>{world?.description}</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-secondary mb-2">Characters</h3>
              {isLoadingCharacters ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="glassmorphism rounded-lg p-3 h-24">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : characters && characters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {characters.map(character => (
                    <CharacterCard key={character.id} character={character} compact />
                  ))}
                </div>
              ) : (
                <div className="glassmorphism rounded-lg p-4 text-center border border-accent/10">
                  <p className="text-neutral-light mb-4">
                    No characters have been created for this world yet.
                  </p>
                  <Button 
                    className="bg-accent/20 hover:bg-accent/30 text-accent"
                    onClick={() => setIsAddCharacterDialogOpen(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Your First Character
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-secondary mb-2">World Activity</h3>
            <div className="glassmorphism rounded-lg p-4 text-neutral-light">
              {isLoadingActivity ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="border-l-2 border-accent/50 pl-3 py-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
              ) : activityLogs && activityLogs.length > 0 ? (
                <div className="space-y-4">
                  {activityLogs.map(log => (
                    <div 
                      key={log.id} 
                      className={`border-l-2 pl-3 py-1 ${
                        log.activityType === 'CHARACTER_CREATED' || log.activityType === 'SCENE_CREATED' 
                          ? 'border-accent' 
                          : log.activityType === 'WORLD_UPDATED' || log.activityType === 'CHARACTER_CHAT'
                          ? 'border-secondary'
                          : 'border-primary'
                      }`}
                    >
                      {getActivityIcon(log.activityType)}
                      <p className="text-sm">{log.description}</p>
                      <p className="text-xs text-neutral-light/70">{formatDate(log.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-neutral-light/70">No activity has been recorded yet.</p>
              )}
              
              {activityLogs && activityLogs.length > 5 && (
                <button className="w-full mt-4 text-center text-secondary hover:text-accent text-sm">
                  View All Activity
                </button>
              )}
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-bold text-secondary mb-2">Quick Actions</h3>
              <div className="glassmorphism rounded-lg p-4 text-neutral-light space-y-3">
                <Link href="/scenes">
                  <a className="w-full bg-secondary/20 hover:bg-secondary/30 text-secondary py-2 rounded-lg transition duration-300 text-sm flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"></path>
                      <line x1="8" y1="16" x2="8.01" y2="16"></line>
                      <line x1="8" y1="20" x2="8.01" y2="20"></line>
                      <line x1="12" y1="18" x2="12.01" y2="18"></line>
                      <line x1="12" y1="22" x2="12.01" y2="22"></line>
                      <line x1="16" y1="16" x2="16.01" y2="16"></line>
                      <line x1="16" y1="20" x2="16.01" y2="20"></line>
                    </svg>
                    Create New Scene
                  </a>
                </Link>
                
                <Button
                  variant="outline"
                  className="w-full bg-accent/20 hover:bg-accent/30 text-accent py-2 rounded-lg transition duration-300 text-sm flex items-center justify-center"
                  onClick={() => setIsAddCharacterDialogOpen(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Character
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full bg-primary/20 hover:bg-primary/30 text-primary py-2 rounded-lg transition duration-300 text-sm flex items-center justify-center"
                  onClick={() => {
                    toast({
                      title: "Coming Soon",
                      description: "Location feature is coming soon!",
                      duration: 3000,
                    });
                  }}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Add Location
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
