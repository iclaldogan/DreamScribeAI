import { useState } from "react";
import { Link } from "wouter";
import { Sidebar } from "./ui/sidebar";
import { MobileNavbar } from "./ui/mobile-navbar";
import { Search, Menu, Compass, Globe, UserCircle, MessageCircle, Feather } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar (desktop) */}
      <Sidebar />
      
      {/* Mobile Navigation */}
      <MobileNavbar />
      
      {/* Content Area */}
      <div className="flex-1 overflow-auto pb-16 lg:pb-0">
        {/* Header */}
        <header className="glassmorphism flex justify-between items-center p-4 lg:p-6 border-b border-secondary/20">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-secondary text-glow">Dreamscribe AI</h1>
            <p className="text-xs lg:text-sm text-neutral-light">Interactive Storytelling Platform</p>
          </div>
          
          {/* Search Bar (desktop) */}
          <div className="relative hidden lg:block">
            <input
              type="text"
              placeholder="Search worlds, characters, or scenes..."
              className="glassmorphism pl-10 pr-4 py-2 rounded-full text-neutral-light focus:outline-none focus:ring-2 focus:ring-secondary w-64 lg:w-96"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-neutral-light" />
          </div>
          
          {/* Mobile Menu Button */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="lg:hidden text-secondary">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="glassmorphism border-l border-secondary/20">
              <div className="flex flex-col h-full py-6">
                <h2 className="text-xl font-bold text-secondary mb-6">Menu</h2>
                <nav className="space-y-4">
                  <Link href="/">
                    <a className="flex items-center space-x-2 text-neutral-light hover:text-secondary p-2">
                      <Compass className="h-5 w-5" />
                      <span>Dashboard</span>
                    </a>
                  </Link>
                  <Link href="/worlds">
                    <a className="flex items-center space-x-2 text-neutral-light hover:text-secondary p-2">
                      <Globe className="h-5 w-5" />
                      <span>Worlds</span>
                    </a>
                  </Link>
                  <Link href="/characters">
                    <a className="flex items-center space-x-2 text-neutral-light hover:text-secondary p-2">
                      <UserCircle className="h-5 w-5" />
                      <span>Characters</span>
                    </a>
                  </Link>
                  <Link href="/chat">
                    <a className="flex items-center space-x-2 text-neutral-light hover:text-secondary p-2">
                      <MessageCircle className="h-5 w-5" />
                      <span>Character Chat</span>
                    </a>
                  </Link>
                  <Link href="/scenes">
                    <a className="flex items-center space-x-2 text-neutral-light hover:text-secondary p-2">
                      <Feather className="h-5 w-5" />
                      <span>Scene Generator</span>
                    </a>
                  </Link>
                </nav>
                <div className="mt-auto">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search..."
                      className="glassmorphism w-full pl-10 pr-4 py-2 rounded-full text-neutral-light focus:outline-none focus:ring-2 focus:ring-secondary"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-neutral-light" />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </header>
        
        {/* Main Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
