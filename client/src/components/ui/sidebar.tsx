import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Compass, 
  Globe, 
  UserCircle, 
  MessageCircle, 
  Feather,
  Settings,
  Scroll
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className={cn(
      "glassmorphism hidden lg:flex flex-col w-20 p-4 justify-between items-center border-r border-secondary/20 yellow-glow",
      className
    )}>
      {/* Logo */}
      <div className="flex flex-col items-center space-y-6">
        <Link href="/">
          <div className="text-3xl text-secondary font-bold p-2 rounded-full bg-primary/50 yellow-glow">
            <Scroll className="h-6 w-6" />
          </div>
        </Link>
        
        {/* Navigation Icons */}
        <div className="flex flex-col space-y-8 mt-8">
          <Link href="/">
            <a className={cn(
              "sidebar-icon px-3 py-3 text-xl hover:text-accent",
              isActive('/') ? "active-nav text-secondary" : "text-neutral-light"
            )}>
              <Compass className="h-6 w-6" />
            </a>
          </Link>
          <Link href="/worlds">
            <a className={cn(
              "sidebar-icon px-3 py-3 text-xl hover:text-accent",
              isActive('/worlds') ? "active-nav text-secondary" : "text-neutral-light"
            )}>
              <Globe className="h-6 w-6" />
            </a>
          </Link>
          <Link href="/characters">
            <a className={cn(
              "sidebar-icon px-3 py-3 text-xl hover:text-accent",
              isActive('/characters') ? "active-nav text-secondary" : "text-neutral-light"
            )}>
              <UserCircle className="h-6 w-6" />
            </a>
          </Link>
          <Link href="/chat">
            <a className={cn(
              "sidebar-icon px-3 py-3 text-xl hover:text-accent",
              isActive('/chat') ? "active-nav text-secondary" : "text-neutral-light"
            )}>
              <MessageCircle className="h-6 w-6" />
            </a>
          </Link>
          <Link href="/scenes">
            <a className={cn(
              "sidebar-icon px-3 py-3 text-xl hover:text-accent",
              isActive('/scenes') ? "active-nav text-secondary" : "text-neutral-light"
            )}>
              <Feather className="h-6 w-6" />
            </a>
          </Link>
        </div>
      </div>
      
      {/* Profile & Settings */}
      <div className="flex flex-col items-center space-y-4">
        <Link href="/settings">
          <a className="sidebar-icon px-3 py-3 text-xl text-neutral-light hover:text-accent">
            <Settings className="h-6 w-6" />
          </a>
        </Link>
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-secondary">
          <img 
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100" 
            alt="User profile" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
