import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { World } from "@shared/schema";
import { cn } from "@/lib/utils";
import { formatDistance } from "date-fns";

interface WorldCardProps {
  world: World;
  characterCount?: number;
  className?: string;
}

export default function WorldCard({ world, characterCount = 0, className }: WorldCardProps) {
  const getWorldImage = (name: string) => {
    // Return different background images based on the world name
    if (name.toLowerCase().includes('neon') || name.toLowerCase().includes('cyber')) {
      return 'https://images.unsplash.com/photo-1555448248-2571daf6344b?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=300';
    } else if (name.toLowerCase().includes('pirate') || name.toLowerCase().includes('corsair') || name.toLowerCase().includes('sea')) {
      return 'https://images.unsplash.com/photo-1534447677768-be436bb09401?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=300';
    } else {
      return 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=300';
    }
  };

  const getWorldType = (name: string) => {
    if (name.toLowerCase().includes('neon') || name.toLowerCase().includes('cyber')) {
      return 'Cyberpunk World';
    } else if (name.toLowerCase().includes('pirate') || name.toLowerCase().includes('corsair') || name.toLowerCase().includes('sea')) {
      return 'Pirate World';
    } else {
      return 'Fantasy World';
    }
  };

  const formatDate = (date: Date) => {
    try {
      return formatDistance(new Date(date), new Date(), { addSuffix: true });
    } catch (error) {
      return 'Unknown date';
    }
  };

  return (
    <div className={cn(
      "glassmorphism rounded-xl overflow-hidden border border-secondary/20 hover:yellow-glow transition-all duration-300 group",
      className
    )}>
      <div className="h-40 overflow-hidden relative">
        <img 
          src={getWorldImage(world.name)} 
          alt={world.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-dark to-transparent"></div>
        <div className="absolute bottom-4 left-4">
          <h3 className="text-xl font-bold text-secondary">{world.name}</h3>
          <p className="text-xs text-neutral-light">{getWorldType(world.name)} • {characterCount} Characters</p>
        </div>
      </div>
      <div className="p-4">
        <p className="text-neutral-light text-sm mb-4 line-clamp-2">{world.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-xs text-neutral-light">Last visited: {formatDate(world.createdAt)}</span>
          <Link href={`/worlds/${world.id}`}>
            <a className="text-secondary hover:text-accent">
              <ArrowRight className="h-5 w-5" />
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
