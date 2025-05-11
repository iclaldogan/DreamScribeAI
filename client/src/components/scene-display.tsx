import { useState } from "react";
import { Scene } from "@shared/schema";
import { Copy, Save, Pen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

interface SceneDisplayProps {
  scene: Scene;
  className?: string;
}

export default function SceneDisplay({ scene, className }: SceneDisplayProps) {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(scene.content);
    setIsCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "The scene has been copied to your clipboard.",
      duration: 3000,
    });
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleSave = () => {
    // In a real app, this would save the scene to the user's saved scenes
    toast({
      title: "Scene saved",
      description: "The scene has been saved to your collection.",
      duration: 3000,
    });
  };

  const formatDate = (date: Date) => {
    try {
      return format(new Date(date), 'MMMM d, yyyy');
    } catch (error) {
      return 'Unknown date';
    }
  };

  return (
    <div className={cn("scroll-container relative", className)}>
      <div className="prose prose-sm max-w-none text-neutral-dark">
        <h3 className="font-bold text-xl mb-2">{scene.title}</h3>
        <p className="italic text-sm mb-4">
          Generated on {formatDate(scene.createdAt)}
          {scene.styleType && ` • ${scene.styleType}`}
        </p>
        
        <div className="whitespace-pre-line">{scene.content}</div>
        
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-neutral-dark/20">
          <button 
            className="flex items-center space-x-2 text-primary hover:text-primary/80"
            onClick={() => {
              toast({
                title: "Continue Scene",
                description: "This feature is coming soon!",
                duration: 3000,
              });
            }}
          >
            <Pen className="h-4 w-4" />
            <span>Continue this scene</span>
          </button>
          <div className="flex space-x-3">
            <button 
              className="text-neutral-dark/70 hover:text-primary"
              onClick={handleCopy}
            >
              <Copy className="h-4 w-4" />
            </button>
            <button 
              className="text-neutral-dark/70 hover:text-primary"
              onClick={handleSave}
            >
              <Save className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
