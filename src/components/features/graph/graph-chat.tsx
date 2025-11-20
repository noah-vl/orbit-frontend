"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUp, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Card } from "@/components/ui/card";

interface GraphChatProps {
  onSearch: (query: string) => void;
  onClear?: () => void;
  loading?: boolean;
  error?: string | null;
  onQueryFocusChange?: (isFocused: boolean) => void;
  resultCount?: number;
  activeResultIndex?: number | null;
  activeResultTitle?: string;
  onStepResult?: (direction: "prev" | "next") => void;
}

export function GraphChat({
  onSearch,
  onClear,
  loading = false,
  error,
  onQueryFocusChange,
  resultCount = 0,
  activeResultIndex = null,
  activeResultTitle,
  onStepResult,
}: GraphChatProps) {
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
      {resultCount > 0 && typeof activeResultIndex === "number" && (
        <div className="flex flex-col items-center gap-1 text-sm pointer-events-auto">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-border/60"
              onClick={() => onStepResult?.("prev")}
              disabled={loading || !onStepResult}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-border/60"
              onClick={() => onStepResult?.("next")}
              disabled={loading || !onStepResult}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col items-center gap-0.5 max-w-xs text-center">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Article {activeResultIndex + 1} of {resultCount}
            </span>
            {activeResultTitle && (
              <span className="text-sm font-medium text-foreground truncate w-full">
                {activeResultTitle}
              </span>
            )}
          </div>
        </div>
      )}
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
            onFocus={() => onQueryFocusChange?.(true)}
            onBlur={() => onQueryFocusChange?.(false)}
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
