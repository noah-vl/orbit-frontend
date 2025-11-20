"use client"

import Link from "next/link";
import { MessageSquare, GitGraph, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-18 items-center justify-between px-4 md:px-6">
        {/* Logo/Brand */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/navbar-logo.png"
              alt="Orbit Logo"
              className="h-9 w-9 object-contain"
            />
            <h2 className="text-3xl font-semibold tracking-tight">
              Orbit
            </h2>
          </Link>
        </div>

        {/* Graph and Profile Icons */}
        <div className="flex items-center gap-2">
          <Link href="/graph" className="block">
            <Button 
              variant={pathname === "/graph" ? "secondary" : "ghost"} 
              size="icon"
              className="h-9 w-9"
            >
              <GitGraph className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/profile" className="block">
            <Button 
              variant={pathname === "/profile" ? "secondary" : "ghost"} 
              size="icon"
              className="h-9 w-9"
            >
              <User className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

