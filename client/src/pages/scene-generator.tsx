import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { World, Character, Scene } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { WandSparkles, Save, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generateScene } from "@/lib/gemini";
import SceneDisplay from "@/components/scene-display";

// Form schema for generating a scene
const sceneFormSchema = z.object({
  worldId: z.string().min(1, "World must be selected"),
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be at most 100 characters"),
  includedCharacters: z.array(z.string()).optional(),
  scenePrompt: z.string().min(10, "Prompt must be at least 10 characters"),
  styleType: z.string().min(1, "Style must be selected"),
  tone: z.string().min(1, "Tone must be selected"),
  length: z.string().min(1, "Length must be selected"),
});

export default function SceneGenerator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generatedScene, setGeneratedScene] = useState<string | null>(null);
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  
  // Fetch all worlds
  const { data: worlds, isLoading: isLoadingWorlds } = useQuery<World[]>({
    queryKey: ['/api/worlds'],
    staleTime: 60000,
  });

  // Get selected world ID
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);
  
  // Fetch characters for selected world
  const { data: characters, isLoading: isLoadingCharacters } = useQuery<Character[]>({
    queryKey: [`/api/worlds/${selectedWorldId}/characters`],
    enabled: !!selectedWorldId && selectedWorldId !== "0",
    staleTime: 60000,
  });

  // Fetch recent scenes
  const { data: recentScenes, isLoading: isLoadingScenes } = useQuery<Scene[]>({
    queryKey: [`/api/worlds/${selectedWorldId || "1"}/scenes`],
    enabled: !!selectedWorldId || true, // Always fetch some scenes for the UI
    staleTime: 60000,
  });

  // Setup form with zod validation
  const form = useForm<z.infer<typeof sceneFormSchema>>({
    resolver: zodResolver(sceneFormSchema),
    defaultValues: {
      worldId: "",
      title: "",
      includedCharacters: [],
      scenePrompt: "",
      styleType: "Novel - Descriptive",
      tone: "Dramatic",
      length: "Medium (500 words)",
    },
  });

  // Update selectedWorldId when form value changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "worldId" && value.worldId) {
        setSelectedWorldId(value.worldId);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Create scene mutation
  const createSceneMutation = useMutation({
    mutationFn: async (sceneData: any) => {
      const response = await apiRequest('POST', '/api/scenes', sceneData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/worlds/${selectedWorldId}/scenes`] });
      
      toast({
        title: "Scene Created",
        description: "Your new scene has been created successfully!",
        duration: 3000,
      });
      
      // Reset form
      form.reset({
        worldId: form.getValues("worldId"),
        title: "",
        includedCharacters: [],
        scenePrompt: "",
        styleType: form.getValues("styleType"),
        tone: form.getValues("tone"),
        length: form.getValues("length"),
      });
      
      // Clear generated scene
      setGeneratedScene(null);
    },
    onError: (error) => {
      console.error("Error creating scene:", error);
      toast({
        title: "Error",
        description: "Failed to save scene. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  // Handle generate scene
  const handleGenerateScene = async (values: z.infer<typeof sceneFormSchema>) => {
    try {
      setIsGeneratingScene(true);
      
      // Find the selected world
      const selectedWorld = worlds?.find(w => w.id.toString() === values.worldId);
      if (!selectedWorld) {
        throw new Error("Selected world not found");
      }
      
      // Find the selected characters
      const selectedCharacters = characters?.filter(c => 
        values.includedCharacters?.includes(c.id.toString())
      ) || [];
      
      // Generate scene using Gemini API
      const content = await generateScene({
        worldName: selectedWorld.name,
        worldDescription: selectedWorld.description,
        characters: selectedCharacters.map(c => ({
          name: c.name,
          role: c.role,
          personality: c.personality,
        })),
        styleType: values.styleType,
        tone: values.tone,
        length: values.length,
        scenePrompt: values.scenePrompt,
      });
      
      // Set generated scene
      setGeneratedScene(content);
      
    } catch (error) {
      console.error("Error generating scene:", error);
      toast({
        title: "Error",
        description: "Failed to generate scene. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsGeneratingScene(false);
    }
  };

  // Handle save scene
  const handleSaveScene = () => {
    if (!generatedScene) return;
    
    const values = form.getValues();
    
    // Convert included characters to array of numbers
    const includedCharactersArray = values.includedCharacters?.map(id => parseInt(id)) || [];
    
    // Create scene data
    const sceneData = {
      worldId: parseInt(values.worldId),
      title: values.title,
      content: generatedScene,
      styleType: values.styleType,
      tone: values.tone,
      includedCharacters: includedCharactersArray,
    };
    
    // Save scene
    createSceneMutation.mutate(sceneData);
  };

  // Handle save draft
  const handleSaveDraft = () => {
    toast({
      title: "Draft Saved",
      description: "Your scene draft has been saved.",
      duration: 3000,
    });
  };

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary">Scene Generator</h1>
      
      <p className="text-neutral-light">
        Create vivid scenes for your world with AI assistance. Describe what you want to happen, and watch as your story comes to life.
      </p>
      
      <div className="glassmorphism rounded-xl p-6 border border-secondary/20 yellow-glow">
        {generatedScene ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-secondary">{form.getValues("title")}</h2>
              <div className="flex space-x-4">
                <Button 
                  variant="outline" 
                  className="bg-transparent hover:bg-accent/20 text-accent border border-accent"
                  onClick={() => setGeneratedScene(null)}
                >
                  Edit Scene
                </Button>
                <Button 
                  className="bg-secondary hover:bg-secondary/80 text-primary"
                  onClick={handleSaveScene}
                  disabled={createSceneMutation.isPending}
                >
                  {createSceneMutation.isPending ? "Saving..." : "Save Scene"}
                </Button>
              </div>
            </div>
            
            <SceneDisplay 
              scene={{ 
                id: 0, 
                worldId: parseInt(form.getValues("worldId")), 
                title: form.getValues("title"), 
                content: generatedScene,
                styleType: form.getValues("styleType"),
                tone: form.getValues("tone"),
                includedCharacters: [],
                createdAt: new Date() 
              }} 
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleGenerateScene)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="worldId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-secondary font-bold">World</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-neutral-dark/40 text-neutral-light border-secondary/20">
                                <SelectValue placeholder="Select a world" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingWorlds ? (
                                <SelectItem value="loading" disabled>Loading worlds...</SelectItem>
                              ) : worlds?.map(world => (
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
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-secondary font-bold">Scene Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter a title for your scene" 
                              className="bg-neutral-dark/40 text-neutral-light border-secondary/20" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="includedCharacters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-secondary font-bold">Characters (Optional)</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            // Handle multiple select for characters
                            const newValues = [...field.value || []];
                            const index = newValues.indexOf(value);
                            if (index === -1) {
                              newValues.push(value);
                            } else {
                              newValues.splice(index, 1);
                            }
                            field.onChange(newValues);
                          }} 
                          defaultValue={field.value?.[0]}
                          disabled={!selectedWorldId || !characters?.length}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-neutral-dark/40 text-neutral-light border-secondary/20">
                              <SelectValue 
                                placeholder={
                                  !selectedWorldId 
                                    ? "Select a world first" 
                                    : isLoadingCharacters 
                                    ? "Loading characters..." 
                                    : !characters?.length 
                                    ? "No characters in this world" 
                                    : `${field.value?.length || 0} characters selected`
                                } 
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingCharacters ? (
                              <SelectItem value="loading" disabled>Loading characters...</SelectItem>
                            ) : characters?.length === 0 ? (
                              <SelectItem value="none" disabled>No characters in this world</SelectItem>
                            ) : characters?.map(character => (
                              <SelectItem 
                                key={character.id} 
                                value={character.id.toString()}
                                className={field.value?.includes(character.id.toString()) ? "bg-accent/20" : ""}
                              >
                                {character.name} ({character.role})
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
                    name="scenePrompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-secondary font-bold">Scene Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what happens in this scene..." 
                            className="bg-neutral-dark/40 text-neutral-light border-secondary/20" 
                            rows={6}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex space-x-4">
                    <Button 
                      type="submit" 
                      className="bg-secondary hover:bg-secondary/80 text-primary font-bold flex items-center space-x-2"
                      disabled={isGeneratingScene}
                    >
                      <WandSparkles className="h-4 w-4" />
                      <span>{isGeneratingScene ? "Generating..." : "Generate Scene"}</span>
                    </Button>
                    <Button 
                      type="button"
                      variant="outline" 
                      className="bg-transparent hover:bg-accent/20 text-accent border border-accent font-bold flex items-center space-x-2"
                      onClick={handleSaveDraft}
                    >
                      <Save className="h-4 w-4" />
                      <span>Save Draft</span>
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-secondary mb-3">Style Options</h3>
              <div className="glassmorphism rounded-lg p-4 text-neutral-light space-y-4">
                <FormField
                  control={form.control}
                  name="styleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary font-bold">Writing Style</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-neutral-dark/40 text-neutral-light border-secondary/20">
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Novel - Descriptive">Novel - Descriptive</SelectItem>
                          <SelectItem value="Script - Dialogue Heavy">Script - Dialogue Heavy</SelectItem>
                          <SelectItem value="Short Story - Concise">Short Story - Concise</SelectItem>
                          <SelectItem value="Epic Fantasy">Epic Fantasy</SelectItem>
                          <SelectItem value="Noir Detective">Noir Detective</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary font-bold">Tone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-neutral-dark/40 text-neutral-light border-secondary/20">
                            <SelectValue placeholder="Select tone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Dramatic">Dramatic</SelectItem>
                          <SelectItem value="Humorous">Humorous</SelectItem>
                          <SelectItem value="Dark">Dark</SelectItem>
                          <SelectItem value="Whimsical">Whimsical</SelectItem>
                          <SelectItem value="Suspenseful">Suspenseful</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary font-bold">Length</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-neutral-dark/40 text-neutral-light border-secondary/20">
                            <SelectValue placeholder="Select length" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Short (250 words)">Short (250 words)</SelectItem>
                          <SelectItem value="Medium (500 words)">Medium (500 words)</SelectItem>
                          <SelectItem value="Long (1000 words)">Long (1000 words)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-bold text-secondary mb-3">Recent Scenes</h3>
                <div className="glassmorphism rounded-lg p-4 text-neutral-light">
                  {isLoadingScenes ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="border-l-2 border-accent/50 pl-3 py-1">
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      ))}
                    </div>
                  ) : recentScenes && recentScenes.length > 0 ? (
                    <div className="space-y-3">
                      {recentScenes.slice(0, 5).map(scene => (
                        <div key={scene.id} className="border-l-2 border-accent pl-3 py-1 hover:bg-accent/5 transition-colors">
                          <p className="font-semibold">{scene.title}</p>
                          <p className="text-xs text-neutral-light/70">
                            {worlds?.find(w => w.id === scene.worldId)?.name || "Unknown World"} • {new Date(scene.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-neutral-light/70">
                      No scenes have been created yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
