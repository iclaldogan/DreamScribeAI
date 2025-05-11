import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { World } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import WorldCard from "@/components/world-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form schema for creating a new world
const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50, "Name must be at most 50 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description must be at most 500 characters"),
});

export default function Worlds() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch all worlds
  const { data: worlds, isLoading: isLoadingWorlds } = useQuery({
    queryKey: ['/api/worlds'],
    staleTime: 60000, // 1 minute
  });

  // Fetch all characters to get counts per world
  const { data: allCharacters, isLoading: isLoadingCharacters } = useQuery({
    queryKey: ['/api/worlds/1/characters'], // This is a hack - we need to fetch all characters
    staleTime: 60000,
  });

  // Get characters count for each world
  const getCharacterCount = (worldId: number) => {
    if (!allCharacters) return 0;
    return allCharacters.filter((char: any) => char.worldId === worldId).length;
  };

  // Setup form with zod validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Create world mutation
  const createWorldMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await apiRequest('POST', '/api/worlds', values);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the worlds query to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/worlds'] });
      
      // Close dialog and reset form
      setIsDialogOpen(false);
      form.reset();
      
      toast({
        title: "World Created",
        description: "Your new world has been created successfully!",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error("Error creating world:", error);
      toast({
        title: "Error",
        description: "Failed to create world. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createWorldMutation.mutate(values);
  };

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-secondary">Your Worlds</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-secondary hover:bg-secondary/80 text-primary font-bold">
              <Plus className="h-4 w-4 mr-2" />
              New World
            </Button>
          </DialogTrigger>
          <DialogContent className="glassmorphism sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl text-secondary">Create New World</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
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
                    disabled={createWorldMutation.isPending}
                  >
                    {createWorldMutation.isPending ? "Creating..." : "Create World"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <p className="text-neutral-light">
        Create and manage your fictional worlds. Each world can contain characters, scenes, and its own lore.
      </p>
      
      {isLoadingWorlds ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="h-64">
              <Skeleton className="h-40 w-full" />
              <div className="p-4 space-y-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : worlds?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {worlds.map((world: World) => (
            <WorldCard 
              key={world.id} 
              world={world} 
              characterCount={getCharacterCount(world.id)} 
            />
          ))}
        </div>
      ) : (
        <div className="glassmorphism rounded-xl p-8 text-center border border-secondary/20">
          <h3 className="text-xl font-bold text-secondary mb-4">No Worlds Yet</h3>
          <p className="text-neutral-light mb-6">
            You haven't created any worlds yet. Start your storytelling journey by creating your first world!
          </p>
          <Button 
            className="bg-secondary hover:bg-secondary/80 text-primary font-bold"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First World
          </Button>
        </div>
      )}
    </section>
  );
}
