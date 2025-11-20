"use client";

import { useRef, useState, useImperativeHandle, forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CommentItem } from "./CommentItem";
import { Comment, TextHighlight, TeamMember } from "./types";
import { getCaretPosition, setCaretPosition, updateMentionHighlightsWithMap } from "./mentionHelpers";

interface CommentSidebarProps {
    comments: Comment[];
    highlights: TextHighlight[];
    selectedCommentId: string | null;
    currentUserId: string | undefined;
    teamMembers: TeamMember[];
    activeTab: string;
    selectedText: string;
    replyingToId: string | null;
    replyText: Map<string, string>;
    onReplyClick: (id: string) => void;
    onReplyTextChange: (id: string, text: string) => void;
    onAddReply: (parentId: string, replyBody: string) => void;
    onAddComment: (commentText: string, mentionsMap: Map<string, string>) => void;
    cursorTooltip: { show: boolean; x: number; y: number };
    onCursorTooltipChange: (tooltip: { show: boolean; x: number; y: number }) => void;
}

export interface CommentSidebarRef {
    focusInput: () => void;
}

export const CommentSidebar = forwardRef<CommentSidebarRef, CommentSidebarProps>(({
    comments,
    highlights,
    selectedCommentId,
    currentUserId,
    teamMembers,
    activeTab,
    selectedText,
    replyingToId,
    replyText,
    onReplyClick,
    onReplyTextChange,
    onAddReply,
    onAddComment,
    cursorTooltip,
    onCursorTooltipChange,
}, ref) => {
    const [newComment, setNewComment] = useState("");
    const [commentMentions, setCommentMentions] = useState<Map<string, string>>(new Map());
    const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionPosition, setMentionPosition] = useState({ start: 0, end: 0 });
    const commentInputRef = useRef<HTMLDivElement>(null);

    // Expose focus method to parent
    useImperativeHandle(ref, () => ({
        focusInput: () => {
            if (commentInputRef.current) {
                commentInputRef.current.focus();
                // Place cursor at the end of the text
                const range = document.createRange();
                const selection = window.getSelection();
                range.selectNodeContents(commentInputRef.current);
                range.collapse(false);
                selection?.removeAllRanges();
                selection?.addRange(range);
            }
        }
    }));

    // Count all comments including nested replies
    const countAllComments = (comments: Comment[]): number => {
        return comments.reduce((count, comment) => {
            return count + 1 + (comment.replies ? countAllComments(comment.replies) : 0);
        }, 0);
    };

    const totalCommentCount = countAllComments(comments);

    return (
        <>
            <div 
                className="w-80 border-l bg-muted/5 flex flex-col"
            >
                <div className="p-4 border-b">
                    <h2 className="font-semibold mb-2">{totalCommentCount} Comments</h2>
                    {/* Color Legend */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-yellow-200/50 border border-yellow-400" />
                            <span>Other's comments</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-blue-200/50 border border-blue-400" />
                            <span>Your comments</span>
                        </div>
                    </div>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {comments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No comments yet
                        </p>
                    ) : (
                        comments.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                highlights={highlights}
                                selectedCommentId={selectedCommentId}
                                currentUserId={currentUserId}
                                teamMembers={teamMembers}
                                replyingToId={replyingToId}
                                replyText={replyText}
                                onReplyClick={onReplyClick}
                                onReplyTextChange={onReplyTextChange}
                                onAddReply={onAddReply}
                                depth={0}
                            />
                        ))
                    )}
                </div>

                {/* Add Comment */}
                <div 
                    className={cn(
                        "p-4 border-t relative transition-opacity duration-200",
                        activeTab !== "full-article" && "opacity-50 pointer-events-none"
                    )}
                    onMouseMove={(e) => {
                        if (activeTab !== "full-article") {
                            onCursorTooltipChange({ show: true, x: e.clientX, y: e.clientY });
                        } else if (cursorTooltip.show) {
                            onCursorTooltipChange({ show: false, x: 0, y: 0 });
                        }
                    }}
                    onMouseLeave={() => onCursorTooltipChange({ show: false, x: 0, y: 0 })}
                >
                    {selectedText && (
                        <div className="mb-2 p-2 bg-blue-50 rounded text-xs italic border-l-2 border-blue-400">
                            Commenting on: "{selectedText.substring(0, 100)}{selectedText.length > 100 ? '...' : ''}"
                        </div>
                    )}
                    <div className="relative">
                        <div
                            ref={commentInputRef}
                            contentEditable
                            onInput={(e) => {
                                const div = e.currentTarget;
                                const text = div.textContent || '';
                                const selection = window.getSelection();
                                let cursorPos = text.length;
                                
                                try {
                                    if (selection && selection.rangeCount > 0) {
                                        const range = selection.getRangeAt(0);
                                        cursorPos = getCaretPosition(div, range);
                                    }
                                } catch (err) {
                                    // Fallback to end of text
                                }
                                
                                setNewComment(text);
                                
                                // Check for @ mention trigger
                                const textBeforeCursor = text.substring(0, cursorPos);
                                const lastAtIndex = textBeforeCursor.lastIndexOf('@');
                                
                                if (lastAtIndex !== -1) {
                                    const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
                                    if (!textAfterAt.match(/[\s\n]/)) {
                                        const query = textAfterAt.toLowerCase();
                                        setMentionQuery(query);
                                        setMentionPosition({ start: lastAtIndex, end: cursorPos });
                                        setShowMentionSuggestions(true);
                                    } else {
                                        setShowMentionSuggestions(false);
                                    }
                                } else {
                                    setShowMentionSuggestions(false);
                                }
                                
                                if (!showMentionSuggestions) {
                                    requestAnimationFrame(() => {
                                        setCommentMentions(currentMentions => {
                                            updateMentionHighlightsWithMap(div, currentMentions);
                                            return currentMentions;
                                        });
                                    });
                                }
                            }}
                            onKeyDown={(e) => {
                                // Handle Ctrl+Enter or Cmd+Enter to submit comment
                                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                    e.preventDefault();
                                    const commentText = commentInputRef.current?.textContent || newComment;
                                    if (commentText.trim()) {
                                        onAddComment(commentText, commentMentions);
                                        setNewComment("");
                                        setCommentMentions(new Map());
                                        if (commentInputRef.current) {
                                            commentInputRef.current.textContent = "";
                                        }
                                    }
                                    return;
                                }
                                
                                // Handle Enter for mention suggestions
                                if (showMentionSuggestions && e.key === 'Enter') {
                                    e.preventDefault();
                                    const firstSuggestion = document.querySelector('[data-mention-suggestion]') as HTMLElement;
                                    if (firstSuggestion) {
                                        firstSuggestion.click();
                                    }
                                }
                            }}
                            data-placeholder="Write your comment... Use @ to mention someone"
                            className="w-full p-2 border rounded-md text-sm min-h-[80px] max-h-[200px] overflow-y-auto bg-background focus:outline-none focus:ring-2 focus:ring-primary empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
                            style={{ whiteSpace: 'pre-wrap' }}
                        />
                        
                        {/* Mention Suggestions Dropdown */}
                        {showMentionSuggestions && teamMembers.length > 0 && (
                            <div className="absolute bottom-full left-0 mb-1 w-full bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto z-50">
                                {teamMembers
                                    .filter(member => 
                                        member.full_name?.toLowerCase().includes(mentionQuery) ||
                                        member.role?.toLowerCase().includes(mentionQuery)
                                    )
                                    .slice(0, 5)
                                    .map((member, idx) => (
                                        <button
                                            key={member.id}
                                            data-mention-suggestion={idx === 0 ? true : undefined}
                                            type="button"
                                            onClick={() => {
                                                if (!commentInputRef.current) return;
                                                
                                                const textBefore = newComment.substring(0, mentionPosition.start);
                                                const textAfter = newComment.substring(mentionPosition.end);
                                                const mentionText = `@${member.full_name || 'Unknown'}`;
                                                
                                                const newText = textBefore + mentionText + ' ' + textAfter;
                                                setNewComment(newText);
                                                
                                                setCommentMentions(prev => {
                                                    const newMap = new Map(prev);
                                                    newMap.set(mentionText, member.id);
                                                    return newMap;
                                                });
                                                
                                                commentInputRef.current.textContent = newText;
                                                
                                                const newCursorPos = mentionPosition.start + mentionText.length + 1;
                                                setCaretPosition(commentInputRef.current, newCursorPos);
                                                
                                                setTimeout(() => {
                                                    setCommentMentions(currentMentions => {
                                                        updateMentionHighlightsWithMap(commentInputRef.current!, currentMentions);
                                                        return currentMentions;
                                                    });
                                                }, 10);
                                                
                                                setShowMentionSuggestions(false);
                                                setMentionQuery("");
                                            }}
                                            className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2"
                                        >
                                            <span className="font-medium">{member.full_name || 'Unknown'}</span>
                                            {member.role && (
                                                <span className="text-xs text-muted-foreground">({member.role})</span>
                                            )}
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>
                    
                    <button
                        onClick={() => {
                            const commentText = commentInputRef.current?.textContent || newComment;
                            onAddComment(commentText, commentMentions);
                            setNewComment("");
                            setCommentMentions(new Map());
                            if (commentInputRef.current) {
                                commentInputRef.current.textContent = "";
                            }
                        }}
                        disabled={!newComment.trim()}
                        className="mt-2 w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium disabled:opacity-50"
                    >
                        Add Comment
                    </button>
                </div>
            </div>
            {cursorTooltip.show && activeTab !== "full-article" && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed pointer-events-none z-50 px-3 py-1.5 bg-zinc-900/90 text-white text-xs font-medium rounded-md shadow-xl whitespace-nowrap border border-zinc-800 backdrop-blur-sm"
                    style={{ 
                        top: cursorTooltip.y + 16,
                        ...(cursorTooltip.x > (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)
                            ? { right: (typeof window !== 'undefined' ? window.innerWidth - cursorTooltip.x + 16 : 0), left: 'auto' }
                            : { left: cursorTooltip.x + 16, right: 'auto' }
                        )
                    }}
                >
                    You can only comment on the full article
                </motion.div>
            )}
        </>
    );
});

CommentSidebar.displayName = "CommentSidebar";

