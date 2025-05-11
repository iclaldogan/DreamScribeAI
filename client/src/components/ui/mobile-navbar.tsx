import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Compass, 
  Globe, 
  UserCircle, 
  MessageCircle, 
  Feather 
} from "lucide-react";

interface MobileNavbarProps {
  className?: string;
}

export function MobileNavbar({ className }: MobileNavbarProps) {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className={cn(
      "glassmorphism lg:hidden fixed bottom-0 left-0 right-0 flex justify-around items-center p-3 z-50 yellow-glow",
      className
    )}>
      <Link href="/">
        <a className={isActive('/') ? "text-secondary" : "text-neutral-light"}>
          <Compass className="h-6 w-6" />
        </a>
      </Link>
      <Link href="/worlds">
        <a className={isActive('/worlds') ? "text-secondary" : "text-neutral-light"}>
          <Globe className="h-6 w-6" />
        </a>
      </Link>
      <Link href="/characters">
        <a className={isActive('/characters') ? "text-secondary" : "text-neutral-light"}>
          <UserCircle className="h-6 w-6" />
        </a>
      </Link>
      <Link href="/chat">
        <a className={isActive('/chat') ? "text-secondary" : "text-neutral-light"}>
          <MessageCircle className="h-6 w-6" />
        </a>
      </Link>
      <Link href="/scenes">
        <a className={isActive('/scenes') ? "text-secondary" : "text-neutral-light"}>
          <Feather className="h-6 w-6" />
        </a>
      </Link>
    </div>
  );
}

export default MobileNavbar;
