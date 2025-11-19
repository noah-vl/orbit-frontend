"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Mention from "@tiptap/extension-mention";
import { Markdown } from "tiptap-markdown";
import "highlight.js/styles/github-dark.css";

const CustomHighlight = Highlight.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            'data-highlight-id': {
                default: null,
                parseHTML: element => element.getAttribute('data-highlight-id'),
                renderHTML: attributes => {
                    if (!attributes['data-highlight-id']) {
                        return {}
                    }
                    // Get the color class from attributes, default to yellow
                    const colorClass = attributes['data-highlight-color'] || 'bg-yellow-200/50 hover:bg-yellow-200';
                    return {
                        'data-highlight-id': attributes['data-highlight-id'],
                        'class': `${colorClass} transition-colors cursor-pointer`,
                        'style': 'color: inherit'
                    }
                },
            },
            'data-highlight-color': {
                default: null,
                parseHTML: element => element.getAttribute('data-highlight-color'),
                renderHTML: attributes => {
                    if (!attributes['data-highlight-color']) {
                        return {}
                    }
                    return {
                        'data-highlight-color': attributes['data-highlight-color']
                    }
                },
            },
        }
    }
});

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Sparkles, FileText, Link as LinkIcon, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { CommentSidebar, CommentSidebarRef } from "./CommentSidebar";
import { HighlightToolbar } from "./HighlightToolbar";
import { Comment, TextHighlight } from "./types";

interface ArticleReaderProps {
    articleId: string;
}

const SUPABASE_URL = 'https://xltqabrlmfalosewvjby.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdHFhYnJsbWZhbG9zZXd2amJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDYwNDcsImV4cCI6MjA3OTEyMjA0N30.RHHhm4Whc8uJ1lwPwYqC1KU8B_m6hBm_XC0MCPbNiWg'

export function ArticleReader({ articleId }: ArticleReaderProps) {
    const router = useRouter();
    const { teamId, session, user } = useAuth();
    const currentUserId = user?.id;
    const [article, setArticle] = useState<any>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [highlights, setHighlights] = useState<TextHighlight[]>([]);
    const commentsRef = useRef<Comment[]>([]); // Ref to always have latest comments
    const highlightsRef = useRef<TextHighlight[]>([]); // Ref to always have latest highlights
    const commentSidebarRef = useRef<CommentSidebarRef>(null);
    const [loading, setLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState<Array<{ id: string; full_name: string; role: string | null }>>([]);
    const [showToolbar, setShowToolbar] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
    const [selectedText, setSelectedText] = useState("");
    const [activeTab, setActiveTab] = useState("insights");
    const [cursorTooltip, setCursorTooltip] = useState<{ show: boolean; x: number; y: number }>({ show: false, x: 0, y: 0 });
    const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState<Map<string, string>>(new Map());
    
    const editor = useEditor({
        extensions: [
            StarterKit,
            Markdown,
            CustomHighlight.configure({
                multicolor: false,
            }),
            Mention.configure({
                HTMLAttributes: {
                    class: "mention",
                },
            }),
        ],
        content: "",
        editable: false, // Read-only for now
        immediatelyRender: false, // Fix SSR hydration
        editorProps: {
            attributes: {
                class: "prose prose-lg max-w-none focus:outline-none",
            },
        },
    });

    useEffect(() => {
        fetchArticle();
        fetchComments();
        fetchHighlights();
        if (teamId) {
            fetchTeamMembers();
        }
    }, [articleId, teamId]);

    const fetchTeamMembers = async () => {
        if (!teamId) {
            console.error("No team_id available");
            return;
        }

        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, full_name, role")
                .eq("team_id", teamId);

            if (error) {
                console.error("Error fetching team members:", error);
                return;
            }

            setTeamMembers(data || []);
        } catch (error) {
            console.error("Error fetching team members:", error);
        }
    };


    useEffect(() => {
        if (article && editor) {
            editor.commands.setContent(article.clean_content || "No content available");
        }
    }, [article, editor]);

    // Sync refs with state
    useEffect(() => {
        commentsRef.current = comments;
    }, [comments]);
    
    useEffect(() => {
        highlightsRef.current = highlights;
    }, [highlights]);

    // Handle clicks on highlights - set up once and use refs for latest data
    useEffect(() => {
        const handleDocumentClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const editorElement = document.querySelector('.ProseMirror');
            
            // Only handle clicks within the editor
            if (!editorElement || !editorElement.contains(target)) {
                return;
            }
            
            const highlightElement = target.closest('[data-highlight-id]');
            
            if (highlightElement) {
                const highlightId = highlightElement.getAttribute('data-highlight-id');
                if (highlightId) {
                    // Get fresh data from refs to avoid stale closures
                    const currentHighlights = highlightsRef.current;
                    const currentComments = commentsRef.current;
                    
                    const highlight = currentHighlights.find(h => h.id === highlightId);
                    if (highlight) {
                        // Search for comment in nested structure (threads)
                        const findComment = (comments: Comment[]): Comment | null => {
                            for (const comment of comments) {
                                if (comment.highlight_id === highlight.id) {
                                    return comment;
                                }
                                if (comment.replies && comment.replies.length > 0) {
                                    const found = findComment(comment.replies);
                                    if (found) return found;
                                }
                            }
                            return null;
                        };
                        
                        const comment = findComment(currentComments);
                        if (comment) {
                            setShowSidebar(true);
                            setSelectedCommentId(comment.id);
                            setTimeout(() => {
                                const commentElement = document.getElementById(`comment-${comment.id}`);
                                commentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 100);
                            // Clear selection after 3 seconds
                            setTimeout(() => {
                                setSelectedCommentId(null);
                            }, 3000);
                        }
                    }
                }
            }
        };
        
        // Attach to document for better event delegation - this ensures it works even if highlights aren't in DOM yet
        document.addEventListener('click', handleDocumentClick, true);
        
        return () => {
            document.removeEventListener('click', handleDocumentClick, true);
        }
    }, []); // Empty deps - handler uses refs for latest data

    // Apply visual highlights to commented text
    useEffect(() => {
        if (!editor || !article || highlights.length === 0) return;

        let isApplying = false;

        const applyHighlights = () => {
            if (isApplying) return;
            isApplying = true;

            const editorElement = document.querySelector('.ProseMirror');
            if (!editorElement) {
                isApplying = false;
                return;
            }

            // 1. Clear existing highlights first using Tiptap transaction
            // This ensures we start clean and allows the walker to find text properly
            const { doc } = editor.state;
            let tr = editor.state.tr;
            let cleared = false;
            
            doc.descendants((node, pos) => {
                if (node.isText && node.marks.find(m => m.type.name === 'highlight')) {
                    tr.removeMark(pos, pos + node.nodeSize, editor.schema.marks.highlight);
                    cleared = true;
                }
                return true;
            });
            
            if (cleared) {
                editor.view.dispatch(tr);
                // Start a new transaction for adding marks
                tr = editor.state.tr;
            }

            // 2. Find text matches and calculate Tiptap positions
            // We use the DOM walker to find text nodes because the search logic is robust
            // and then convert to Tiptap positions.
            
            const rangesToHighlight: {from: number, to: number, id: string, colorClass: string}[] = [];
            
            highlights.forEach(highlight => {
                const textContent = highlight.text_content?.trim();
                if (!textContent || textContent.length < 3) return;
                
                // Determine color based on whether it's the current user's highlight
                const isCurrentUser = currentUserId && highlight.user_id === currentUserId;
                const colorClass = isCurrentUser 
                    ? 'bg-blue-200/50 hover:bg-blue-200' 
                    : 'bg-yellow-200/50 hover:bg-yellow-200';

                // Build text map of AVAILABLE text nodes
                // Since we cleared highlights, all text should be available (unless other marks exist)
                const textNodes: { node: Node, start: number, length: number }[] = [];
                let fullText = '';
                
                const walker = document.createTreeWalker(
                    editorElement,
                    NodeFilter.SHOW_TEXT,
                    null
                );

                let node;
                while (node = walker.nextNode()) {
                    const text = node.textContent || '';
                    if (text.length > 0) {
                        textNodes.push({
                            node,
                            start: fullText.length,
                            length: text.length
                        });
                        fullText += text;
                    }
                }

                const matchIndex = fullText.indexOf(textContent);
                if (matchIndex === -1) return;

                const matchEnd = matchIndex + textContent.length;

                for (const { node, start, length } of textNodes) {
                    const nodeEnd = start + length;

                    if (nodeEnd > matchIndex && start < matchEnd) {
                        const relativeStart = Math.max(0, matchIndex - start);
                        const relativeEnd = Math.min(length, matchEnd - start);
                        
                        if (relativeEnd > relativeStart) {
                            try {
                                // Convert DOM position to Tiptap position
                                // posAtDOM returns the position in the document
                                const from = editor.view.posAtDOM(node, relativeStart);
                                const to = editor.view.posAtDOM(node, relativeEnd);
                                
                                rangesToHighlight.push({
                                    from,
                                    to,
                                    id: highlight.id,
                                    colorClass: colorClass
                                });
                            } catch (e) {
                                console.error('Failed to calculate highlight position:', e);
                            }
                        }
                    }
                }
            });

            // 3. Apply all highlights in one transaction
            if (rangesToHighlight.length > 0) {
                // Get fresh transaction
                tr = editor.state.tr;
                
                rangesToHighlight.forEach(({ from, to, id, colorClass }) => {
                    tr.addMark(from, to, editor.schema.marks.highlight.create({ 
                        'data-highlight-id': id,
                        'data-highlight-color': colorClass
                    }));
                });
                
                editor.view.dispatch(tr);
            }

            isApplying = false;
        };

        // Apply highlights after editor content is set and fully rendered
        const timeoutId = setTimeout(() => {
            const editorElement = document.querySelector('.ProseMirror');
            if (editorElement && editorElement.textContent && editorElement.textContent.trim().length > 0) {
                applyHighlights();
            } else {
                setTimeout(() => {
                    const editorElement = document.querySelector('.ProseMirror');
                    if (editorElement && editorElement.textContent && editorElement.textContent.trim().length > 0) {
                        applyHighlights();
                    }
                }, 300);
            }
        }, 500);

        return () => {
            clearTimeout(timeoutId);
            isApplying = false;
        };
    }, [editor, article, highlights, activeTab, currentUserId]);

    // Handle text selection - only allow comments on article content
    useEffect(() => {
        const handleSelection = () => {
            const selection = window.getSelection();
            const text = selection?.toString().trim();

            if (text && text.length > 0) {
                const range = selection?.getRangeAt(0);
                
                // Check if selection is within the article content area (EditorContent)
                const editorElement = document.querySelector('.ProseMirror');
                if (!editorElement || !range) {
                    setShowToolbar(false);
                    return;
                }

                // Check if the selection is within the editor element
                const isWithinEditor = editorElement.contains(range.commonAncestorContainer) ||
                    editorElement.contains(range.startContainer) ||
                    editorElement.contains(range.endContainer);

                if (!isWithinEditor) {
                    setShowToolbar(false);
                    setSelectedText("");
                    return;
                }

                const rect = range.getBoundingClientRect();

                if (rect) {
                    setSelectedText(text);
                    setToolbarPosition({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 50,
                    });
                    setShowToolbar(true);
                }
            } else {
                setShowToolbar(false);
            }
        };

        document.addEventListener("mouseup", handleSelection);
        return () => document.removeEventListener("mouseup", handleSelection);
    }, []);

    const fetchArticle = async () => {
        try {
            // Fetch business insights (relevant to Omen)
            const businessResponse = await fetch(
                `https://xltqabrlmfalosewvjby.supabase.co/functions/v1/get_article?id=${articleId}&role=business`,
                { 
                    headers: { 
                        apikey: SUPABASE_ANON_KEY,
                        Authorization: session?.access_token ? `Bearer ${session.access_token}` : `Bearer ${SUPABASE_ANON_KEY}`
                    } 
                }
            );
            const businessData = await businessResponse.json();
            
            // Set article with business insights at top, full article below
            setArticle({
                ...businessData.article,
                business_summary: businessData.insight?.summary || null,
                why_it_matters: businessData.insight?.why_it_matters || null,
            });
        } catch (error) {
            console.error("Error fetching article:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to organize comments into threads
    const organizeCommentsIntoThreads = (comments: Comment[]): Comment[] => {
        const commentMap = new Map<string, Comment>();
        const rootComments: Comment[] = [];

        // First pass: create map of all comments
        comments.forEach(comment => {
            commentMap.set(comment.id, { ...comment, replies: [] });
        });

        // Second pass: organize into threads
        comments.forEach(comment => {
            const commentWithReplies = commentMap.get(comment.id)!;
            if (comment.parent_id && commentMap.has(comment.parent_id)) {
                // This is a reply, add it to parent's replies
                const parent = commentMap.get(comment.parent_id)!;
                if (!parent.replies) {
                    parent.replies = [];
                }
                parent.replies.push(commentWithReplies);
            } else {
                // This is a root comment
                rootComments.push(commentWithReplies);
            }
        });

        // Sort root comments by created_at (newest first)
        rootComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        // Sort replies within each thread (oldest first for conversation flow)
        const sortReplies = (comment: Comment) => {
            if (comment.replies && comment.replies.length > 0) {
                comment.replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                comment.replies.forEach(sortReplies);
            }
        };
        rootComments.forEach(sortReplies);

        return rootComments;
    };

    const fetchComments = async () => {
        try {
            // Fetch comments with author names by joining with profiles
            const response = await fetch(
                `https://xltqabrlmfalosewvjby.supabase.co/rest/v1/comments?article_id=eq.${articleId}&select=*,profiles!comments_author_id_fkey(full_name),mentioned_users&order=created_at.desc`,
                { headers: { apikey: SUPABASE_ANON_KEY, ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }) } }
            );
            const data = await response.json();
            console.log('Fetched comments:', data);
            // Map the nested profile data to author_name
            const commentsWithAuthors = data.map((comment: any) => {
                const processed = {
                    ...comment,
                    author_name: comment.profiles?.full_name || 'Unknown',
                    mentioned_users: comment.mentioned_users || [],
                    parent_id: comment.parent_id || null,
                };
                console.log('Processed comment:', processed.id, 'mentioned_users:', processed.mentioned_users);
                return processed;
            });
            
            // Organize comments into threads
            const threadedComments = organizeCommentsIntoThreads(commentsWithAuthors);
            setComments(threadedComments);
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    };

    const fetchHighlights = async () => {
        try {
            const response = await fetch(
                `https://xltqabrlmfalosewvjby.supabase.co/rest/v1/highlights?article_id=eq.${articleId}&select=*`,
                { headers: { apikey: SUPABASE_ANON_KEY, ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }) } }
            );
            const data = await response.json();
            setHighlights(data);
        } catch (error) {
            console.error("Error fetching highlights:", error);
        }
    };

    const addHighlight = async () => {
        if (!selectedText) return;

        try {
            await fetch("https://xltqabrlmfalosewvjby.supabase.co/rest/v1/highlights", {
                method: "POST",
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
                    "Content-Type": "application/json",
                    Prefer: "return=minimal",
                },
                body: JSON.stringify({
                    article_id: articleId,
                    user_id: currentUserId || "",
                    start_offset: 0, // Using text-based matching for rendering
                    end_offset: selectedText.length,
                    text_content: selectedText,
                    color: "yellow",
                }),
            });
            fetchHighlights();
            setShowToolbar(false);
        } catch (error) {
            console.error("Error adding highlight:", error);
        }
    };

    const addComment = async (commentText: string, mentionsMap: Map<string, string>) => {
        if (!commentText.trim()) return;

        try {
            // First create the highlight for the selected text
            let highlightId = null;
            if (selectedText) {
                const highlightResponse = await fetch("https://xltqabrlmfalosewvjby.supabase.co/rest/v1/highlights", {
                    method: "POST",
                    headers: {
                        apikey: SUPABASE_ANON_KEY,
                    ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
                        "Content-Type": "application/json",
                        Prefer: "return=representation",
                    },
                    body: JSON.stringify({
                        article_id: articleId,
                        user_id: currentUserId || "",
                        start_offset: 0, // TODO: Calculate actual offset
                        end_offset: selectedText.length,
                        text_content: selectedText,
                        color: "yellow",
                    }),
                });
                const highlightData = await highlightResponse.json();
                highlightId = highlightData[0]?.id;
            }

            // Extract mentioned user IDs from the mentions map
            const currentMentions = mentionsMap;
            
            console.log('Extracting mentions:', {
                commentText,
                commentMentions: Array.from(currentMentions.entries()),
                commentMentionsSize: currentMentions.size
            });
            
            const mentionedUserIds: string[] = [];
            const foundMentions = new Set<string>();
            
            // Find all mentions in the text and match them with our map
            const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
            let match;
            
            while ((match = mentionRegex.exec(commentText)) !== null) {
                const mentionText = match[0]; // Full match including @
                console.log('Found mention in text:', mentionText);
                
                // Check if this mention is in our map
                if (currentMentions.has(mentionText)) {
                    const userId = currentMentions.get(mentionText);
                    if (userId && !foundMentions.has(userId)) {
                        mentionedUserIds.push(userId);
                        foundMentions.add(userId);
                        console.log('Added mention:', mentionText, '->', userId);
                    }
                } else {
                    console.log('Mention not in map:', mentionText, 'Available:', Array.from(currentMentions.keys()));
                }
            }
            
            console.log('Final mentionedUserIds:', mentionedUserIds);

            // Create the comment linked to the highlight
            const commentPayload = {
                article_id: articleId,
                body: commentText, // Use commentText from contentEditable, not newComment
                author_id: currentUserId || "",
                highlight_id: highlightId,
                mentioned_users: mentionedUserIds.length > 0 ? mentionedUserIds : null,
            };
            
            console.log('Sending comment payload:', commentPayload);
            
            const commentResponse = await fetch("https://xltqabrlmfalosewvjby.supabase.co/rest/v1/comments", {
                method: "POST",
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
                    "Content-Type": "application/json",
                    Prefer: "return=representation",
                },
                body: JSON.stringify(commentPayload),
            });
            
            const createdComment = await commentResponse.json();
            console.log('Created comment response:', createdComment);

            setSelectedText("");
            setShowToolbar(false);
            setShowSidebar(true);
            fetchComments();
            fetchHighlights();
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    const addReply = async (parentId: string, replyBody: string) => {
        if (!replyBody.trim()) return;

        try {
            // Fake backend call - in real implementation, this would POST to the API
            console.log('Adding reply:', { parentId, replyBody, author_id: currentUserId });
            
            // Simulate API call
            const fakeReply: Comment = {
                id: `reply-${Date.now()}`,
                body: replyBody,
                created_at: new Date().toISOString(),
                author_id: currentUserId || '',
                author_name: user?.email?.split('@')[0] || 'You',
                mentioned_users: [],
                parent_id: parentId,
                replies: [],
            };

            // Update comments state by adding the reply to the appropriate parent
            setComments(prevComments => {
                const addReplyToComment = (comments: Comment[]): Comment[] => {
                    return comments.map(comment => {
                        if (comment.id === parentId) {
                            return {
                                ...comment,
                                replies: [...(comment.replies || []), fakeReply]
                            };
                        }
                        if (comment.replies && comment.replies.length > 0) {
                            return {
                                ...comment,
                                replies: addReplyToComment(comment.replies)
                            };
                        }
                        return comment;
                    });
                };
                return addReplyToComment(prevComments);
            });

            // Clear reply input
            setReplyText(prev => {
                const newMap = new Map(prev);
                newMap.delete(parentId);
                return newMap;
            });
            setReplyingToId(null);
        } catch (error) {
            console.error("Error adding reply:", error);
        }
    };


    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-muted-foreground">Loading article...</div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-muted-foreground">Article not found</div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Main Content - Full Screen */}
            <div className="flex-1 flex overflow-hidden">
                {/* Article Content - Centered like Notion */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-[750px] mx-auto px-12 py-12">
                        <button
                            onClick={() => router.push('/graph')}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Graph
                        </button>
                        <h1 className="text-4xl font-bold mb-2">{article.title}</h1>

                        {/* Author Info */}
                        <div className="flex items-center gap-3 mb-8 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <span>Added by</span>
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={`https://avatar.vercel.sh/${article.author || 'Unknown'}`} />
                                    <AvatarFallback>{(article.author || 'U')[0]}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-foreground">{article.author || 'Unknown Author'}</span>
                            </div>
                            <span>•</span>
                            <span>{new Date(article.created_at || Date.now()).toLocaleDateString(undefined, { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}</span>
                            {article.url && (
                                <>
                                    <span>•</span>
                                    <a 
                                        href={article.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-500 hover:underline flex items-center gap-1"
                                    >
                                        <LinkIcon className="w-3 h-3" />
                                        Original Source
                                    </a>
                                </>
                            )}
                        </div>

                        <Tabs defaultValue="insights" className="w-full" onValueChange={setActiveTab}>
                            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6 mb-8 relative">
                                <TabsTrigger 
                                    value="insights"
                                    className="rounded-none border-0 bg-transparent px-0 py-2 data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors relative z-10 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    <Sparkles className="w-4 h-4 mr-1" />
                                    Insights
                                    {activeTab === "insights" && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="full-article"
                                    className="rounded-none border-0 bg-transparent px-0 py-2 data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors relative z-10 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    <FileText className="w-4 h-4 mr-1" />
                                    Full Article
                                    {activeTab === "full-article" && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </TabsTrigger>
                            </TabsList>

                            <div className="min-h-[500px]">
                                <TabsContent value="insights" className="mt-0 focus-visible:ring-0">
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        transition={{ duration: 0.4 }}
                                    >
                                        {/* Business Insights - Why This Matters for Omen */}
                                        {article.why_it_matters ? (
                                            <div className="mb-12">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="h-5 flex items-center">
                                                        <div className="w-1 h-5 bg-indigo-500/20 rounded-full" />
                                                    </div>
                                                    <h2 className="text-2xl font-medium">
                                                        Why This Matters to Omen
                                                    </h2>
                                                </div>
                                                <p className="text-lg leading-relaxed text-foreground/90 font-light">{article.why_it_matters}</p>
                                            </div>
                                        ) : null}
                                        
                                        {/* Business Summary - Relevant Insights */}
                                        {article.business_summary ? (
                                            <div className="mb-12">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="h-5 flex items-center">
                                                        <div className="w-1 h-5 bg-indigo-500/20 rounded-full" />
                                                    </div>
                                                    <h2 className="text-2xl font-medium">
                                                        Key Insights for You
                                                    </h2>
                                                </div>
                                                <div className="prose prose-lg max-w-none">
                                                    <p className="whitespace-pre-wrap leading-relaxed text-foreground/90 font-light">{article.business_summary}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            !article.why_it_matters && (
                                                <div className="text-center py-12 text-muted-foreground font-light">
                                                    No insights generated yet.
                                                </div>
                                            )
                                        )}
                                    </motion.div>
                                </TabsContent>

                                <TabsContent value="full-article" className="mt-0 focus-visible:ring-0">
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        transition={{ duration: 0.4 }}
                                    >
                                        <article className="prose prose-lg max-w-none">
                                            <EditorContent editor={editor} />
                                        </article>
                                    </motion.div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>
                </div>

                {/* Comment Sidebar */}
                {showSidebar && (
                    <CommentSidebar
                        ref={commentSidebarRef}
                        comments={comments}
                        highlights={highlights}
                        selectedCommentId={selectedCommentId}
                        currentUserId={currentUserId}
                        teamMembers={teamMembers}
                        activeTab={activeTab}
                        selectedText={selectedText}
                        replyingToId={replyingToId}
                        replyText={replyText}
                        onReplyClick={(id) => setReplyingToId(id === replyingToId ? null : id)}
                        onReplyTextChange={(id, text) => {
                            setReplyText(prev => {
                                const newMap = new Map(prev);
                                newMap.set(id, text);
                                return newMap;
                            });
                        }}
                        onAddReply={addReply}
                        onAddComment={addComment}
                        cursorTooltip={cursorTooltip}
                        onCursorTooltipChange={setCursorTooltip}
                    />
                )}
            </div>

            {/* Floating Toolbar on Text Selection */}
            <HighlightToolbar
                show={showToolbar}
                position={toolbarPosition}
                onAddComment={() => {
                    setShowSidebar(true);
                    setShowToolbar(false);
                    // Focus the comment input after a short delay to ensure sidebar is rendered
                    setTimeout(() => {
                        commentSidebarRef.current?.focusInput();
                    }, 100);
                }}
            />
        </div>
    );
}
