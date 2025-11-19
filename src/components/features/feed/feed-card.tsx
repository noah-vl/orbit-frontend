import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Heart, Share2, Bookmark, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

interface FeedItemAuthor {
  name: string;
  handle: string;
  avatar: string;
  role?: string;
}

interface FeedItemTaggedUser {
  name: string;
  handle: string;
}

export interface FeedItem {
  id: string;
  author: FeedItemAuthor;
  content: React.ReactNode;
  timestamp: string;
  type: "article" | "mention" | "note";
  isRead: boolean;
  taggedUsers: FeedItemTaggedUser[];
}

interface FeedCardProps {
  item: FeedItem;
}

export function FeedCard({ item }: FeedCardProps) {
  return (
    <div className={cn(
      "flex flex-col",
      !item.isRead && "bg-muted/5 -mx-6 px-6" // Subtle highlight for unread, negative margin to bleed to edge if needed, but let's keep it simple first
    )}>
      <div className={cn(
        "flex flex-row items-start gap-4 py-6",
        // If we want the highlight to be constrained, we just apply bg here. 
        // But usually list items highlight the whole row.
        !item.isRead ? "opacity-100" : "opacity-100" 
      )}>
        <FeedCardAvatar author={item.author} />
        
        <div className="flex-1 min-w-0 space-y-3">
          <FeedCardHeader 
            author={item.author} 
            timestamp={item.timestamp} 
            isRead={item.isRead} 
          />
          
          <FeedCardContent content={item.content} />

          <FeedCardTags taggedUsers={item.taggedUsers} />

          <FeedCardActions />
        </div>
      </div>
      <Separator className="bg-border/60" />
    </div>
  );
}

function FeedCardAvatar({ author }: { author: FeedItemAuthor }) {
  return (
    <Avatar className="size-12 border">
      <AvatarImage src={author.avatar} alt={author.name} />
      <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
    </Avatar>
  );
}

function FeedCardHeader({ author, timestamp, isRead }: { author: FeedItemAuthor; timestamp: string; isRead: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-foreground text-base">{author.name}</span>
        <span className="text-muted-foreground">{author.handle}</span>
        <span className="text-muted-foreground mx-1">·</span>
        <span className="text-muted-foreground">{timestamp}</span>
      </div>
      <div title={isRead ? "Read" : "Unread"}>
        {isRead ? (
          <CheckCircle2 className="size-5 text-muted-foreground/50" />
        ) : (
          <Circle className="size-5 fill-primary text-primary" />
        )}
      </div>
    </div>
  );
}

function FeedCardContent({ content }: { content: React.ReactNode }) {
  return (
    <div className="text-base leading-relaxed text-foreground/90">
      {content}
    </div>
  );
}

function FeedCardTags({ taggedUsers }: { taggedUsers: FeedItemTaggedUser[] }) {
  if (taggedUsers.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      <span className="text-xs text-muted-foreground self-center">Tagged:</span>
      {taggedUsers.map((user) => (
        <Badge 
          key={user.handle} 
          variant="secondary" 
          className="text-xs font-normal hover:bg-secondary/80 cursor-pointer transition-colors px-2 py-1"
        >
          {user.handle}
        </Badge>
      ))}
    </div>
  );
}

function FeedCardActions() {
  return (
    <div className="flex items-center gap-6 pt-2">
      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary px-2 h-8 -ml-2">
        <MessageSquare className="size-4 mr-2" />
        <span className="text-xs">Comment</span>
      </Button>
      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-green-500 px-2 h-8">
        <Share2 className="size-4 mr-2" />
        <span className="text-xs">Share</span>
      </Button>
      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500 px-2 h-8">
        <Heart className="size-4 mr-2" />
        <span className="text-xs">Like</span>
      </Button>
      <div className="flex-1" />
      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground px-2 h-8">
        <Bookmark className="size-4 mr-2" />
        <span className="text-xs">Save</span>
      </Button>
    </div>
  );
}
