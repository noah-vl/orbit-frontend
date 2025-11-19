"use client"

import { useState } from "react";
import Link from "next/link";
import { Home, MessageSquare, GitGraph, User, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div 
      className={cn(
        "pb-12 h-full border-r bg-background transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex flex-col h-full">
        <div className={cn("flex items-center h-14 px-4 py-2", isCollapsed ? "justify-center" : "justify-between")}>
          {!isCollapsed && (
            <h2 className="text-lg font-semibold tracking-tight">
              Solon
            </h2>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="h-8 w-8"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        <div className="space-y-4 py-4">
          <div className="px-3 space-y-1">
            <Link href="/" className="block">
              <Button variant="ghost" className={cn("w-full", isCollapsed ? "justify-center px-2" : "justify-start")}>
                <Home className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                {!isCollapsed && "Feed"}
              </Button>
            </Link>
            <Link href="/chat" className="block">
              <Button variant="ghost" className={cn("w-full", isCollapsed ? "justify-center px-2" : "justify-start")}>
                <MessageSquare className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                {!isCollapsed && "Chat"}
              </Button>
            </Link>
            <Link href="/graph" className="block">
              <Button variant="ghost" className={cn("w-full", isCollapsed ? "justify-center px-2" : "justify-start")}>
                <GitGraph className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                {!isCollapsed && "Graph"}
              </Button>
            </Link>
            <Link href="/profile" className="block">
              <Button variant="ghost" className={cn("w-full", isCollapsed ? "justify-center px-2" : "justify-start")}>
                <User className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                {!isCollapsed && "Profile"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
