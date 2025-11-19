"use client";

import { Reply } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Comment, TextHighlight, TeamMember } from "./types";

interface CommentItemProps {
    comment: Comment;
    highlights: TextHighlight[];
    selectedCommentId: string | null;
    currentUserId: string | undefined;
    teamMembers: TeamMember[];
    replyingToId: string | null;
    replyText: Map<string, string>;
    onReplyClick: (id: string) => void;
    onReplyTextChange: (id: string, text: string) => void;
    onAddReply: (parentId: string, replyBody: string) => void;
    depth: number;
}

export function CommentItem({
    comment,
    highlights,
    selectedCommentId,
    currentUserId,
    teamMembers,
    replyingToId,
    replyText,
    onReplyClick,
    onReplyTextChange,
    onAddReply,
    depth,
}: CommentItemProps) {
    const highlight = highlights.find(h => h.id === comment.highlight_id);
    const isSelected = selectedCommentId === comment.id;
    const isCurrentUser = comment.author_id === currentUserId;
    const highlightBgColor = isCurrentUser ? 'bg-blue-50' : 'bg-yellow-50';
    const highlightBorderColor = isCurrentUser ? 'border-blue-400' : 'border-yellow-400';
    const isReplying = replyingToId === comment.id;
    const currentReplyText = replyText.get(comment.id) || '';

    // Render mentions in comment body
    const renderCommentBody = () => {
        const body = comment.body;
        const mentionedUserIds = comment.mentioned_users || [];
        
        if (mentionedUserIds.length === 0 || teamMembers.length === 0) {
            return body;
        }
        
        const userIdToName = new Map<string, string>();
        teamMembers.forEach(member => {
            userIdToName.set(member.id, member.full_name || 'Unknown');
        });
        
        const mentionNamesToHighlight = new Set<string>();
        mentionedUserIds.forEach(userId => {
            const userName = userIdToName.get(userId);
            if (userName) {
                mentionNamesToHighlight.add(`@${userName}`);
            }
        });
        
        const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
        const parts: Array<{ text: string; isMention: boolean }> = [];
        let lastIndex = 0;
        let match;
        
        while ((match = mentionRegex.exec(body)) !== null) {
            if (match.index > lastIndex) {
                parts.push({ text: body.substring(lastIndex, match.index), isMention: false });
            }
            
            const mentionText = match[0];
            const shouldHighlight = mentionNamesToHighlight.has(mentionText);
            parts.push({ text: mentionText, isMention: shouldHighlight });
            lastIndex = match.index + mentionText.length;
        }
        
        if (lastIndex < body.length) {
            parts.push({ text: body.substring(lastIndex), isMention: false });
        }
        
        if (parts.length === 0) {
            return body;
        }
        
        return parts.map((part, idx) => {
            if (part.isMention) {
                return (
                    <span key={idx} className="font-medium text-blue-600">
                        {part.text}
                    </span>
                );
            }
            return <span key={idx}>{part.text}</span>;
        });
    };

    return (
        <div className={cn(
            depth > 0 && "mt-0"
        )}>
            <div 
                id={`comment-${comment.id}`} 
                className={cn(
                    "bg-background rounded-lg p-3 transition-all",
                    depth === 0 && "border",
                    isSelected && "[box-shadow:inset_0_0_0_1px_rgb(17,24,39)]"
                )}
            >
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                        {comment.author_name || 'Unknown'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                </div>
                {highlight && (
                    <div className={cn("mb-2 p-2 rounded text-sm italic border-l-2", highlightBgColor, highlightBorderColor)}>
                        "{highlight.text_content}"
                    </div>
                )}
                <p className="text-sm whitespace-pre-wrap mb-2">
                    {renderCommentBody()}
                </p>
                
                {/* Reply button */}
                <button
                    onClick={() => onReplyClick(comment.id)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Reply className="w-3 h-3" />
                    Reply
                </button>

                {/* Reply input */}
                {isReplying && (
                    <div className="mt-3 space-y-2">
                        <Textarea
                            value={currentReplyText}
                            onChange={(e) => onReplyTextChange(comment.id, e.target.value)}
                            onKeyDown={(e) => {
                                // Handle Ctrl+Enter or Cmd+Enter to submit reply
                                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                    e.preventDefault();
                                    if (currentReplyText.trim()) {
                                        onAddReply(comment.id, currentReplyText);
                                    }
                                }
                            }}
                            placeholder="Write a reply..."
                            className="w-full text-sm min-h-[60px] resize-none"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    onAddReply(comment.id, currentReplyText);
                                }}
                                disabled={!currentReplyText.trim()}
                                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium disabled:opacity-50 hover:bg-primary/90"
                            >
                                Post Reply
                            </button>
                            <button
                                onClick={() => {
                                    onReplyClick(comment.id);
                                    onReplyTextChange(comment.id, '');
                                }}
                                className="px-3 py-1.5 border rounded-md text-xs font-medium hover:bg-muted"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Render replies with continuous vertical line */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 relative pl-4">
                        {/* Continuous vertical line spanning all replies */}
                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-border" />
                        {comment.replies.map((reply) => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                highlights={highlights}
                                selectedCommentId={selectedCommentId}
                                currentUserId={currentUserId}
                                teamMembers={teamMembers}
                                replyingToId={replyingToId}
                                replyText={replyText}
                                onReplyClick={onReplyClick}
                                onReplyTextChange={onReplyTextChange}
                                onAddReply={onAddReply}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

