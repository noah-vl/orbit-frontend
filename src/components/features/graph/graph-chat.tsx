"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUp, X } from "lucide-react";
import { Card } from "@/components/ui/card";

interface GraphChatProps {
  onSearch: (query: string) => void;
  onClear?: () => void;
  loading?: boolean;
  error?: string | null;
}

export function GraphChat({ onSearch, onClear, loading = false, error }: GraphChatProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      onSearch(trimmedQuery);
      // Don't clear the input - let user see what they searched for
      // They can clear it manually if needed
    }
  };

  const handleClear = () => {
    setQuery("");
    if (onClear) onClear();
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-xl space-y-2 z-20 pointer-events-none">
      {error && (
        <Card className="p-2 bg-destructive/10 border-destructive/50 text-destructive text-sm text-center pointer-events-auto">
          {error}
        </Card>
      )}
      <Card className="p-1.5 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-border/50 rounded-full pointer-events-auto">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question to find relevant articles..."
            className="border-0 shadow-none focus-visible:ring-0 bg-transparent px-4 h-10"
            disabled={loading}
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted shrink-0"
              onClick={handleClear}
              disabled={loading}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
          <Button 
            type="submit" 
            size="icon" 
            disabled={!query.trim() || loading}
            className="rounded-full h-9 w-9 shrink-0 mr-0.5"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </Card>
    </div>
  );
}
