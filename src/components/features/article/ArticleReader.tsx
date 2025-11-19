"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Mention from "@tiptap/extension-mention";
import { Markdown } from "tiptap-markdown";
import "highlight.js/styles/github-dark.css";

interface ArticleReaderProps {
    articleId: string;
}

interface Comment {
    id: string;
    body: string;
    created_at: string;
    author_id: string;
    highlight_id?: string;
    author_name?: string;
    mentioned_users?: string[];
}

interface TextHighlight {
    id: string;
    start_offset: number;
    end_offset: number;
    text_content: string;
    color: string;
}

const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdHFhYnJsbWZhbG9zZXd2amJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDYwNDcsImV4cCI6MjA3OTEyMjA0N30.RHHhm4Whc8uJ1lwPwYqC1KU8B_m6hBm_XC0MCPbNiWg";

export function ArticleReader({ articleId }: ArticleReaderProps) {
    const router = useRouter();
    const [article, setArticle] = useState<any>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [highlights, setHighlights] = useState<TextHighlight[]>([]);
    const [newComment, setNewComment] = useState("");
    const [commentMentions, setCommentMentions] = useState<Map<string, string>>(new Map()); // Map of mention text to user ID
    const commentMentionsRef = useRef<Map<string, string>>(new Map()); // Ref to always have latest mentions
    const [loading, setLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState<Array<{ id: string; full_name: string; role: string | null }>>([]);
    const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionPosition, setMentionPosition] = useState({ start: 0, end: 0 });
    const commentInputRef = useRef<HTMLDivElement>(null);
    const [showToolbar, setShowToolbar] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
    const [selectedText, setSelectedText] = useState("");

    const editor = useEditor({
        extensions: [
            StarterKit,
            Markdown,
            Highlight.configure({
                multicolor: true,
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
                class: "prose prose-lg dark:prose-invert max-w-none focus:outline-none",
            },
        },
    });

    useEffect(() => {
        fetchArticle();
        fetchComments();
        fetchHighlights();
        fetchTeamMembers();
    }, [articleId]);

    const fetchTeamMembers = async () => {
        try {
            const response = await fetch(
                `https://xltqabrlmfalosewvjby.supabase.co/rest/v1/profiles?team_id=eq.446f4253-c7e9-46f5-bdaf-99c36d1881e0&select=id,full_name,role`,
                { headers: { apikey: ANON_KEY } }
            );
            const data = await response.json();
            setTeamMembers(data);
        } catch (error) {
            console.error("Error fetching team members:", error);
        }
    };

    // Helper functions for contentEditable
    const getCaretPosition = (element: HTMLElement, range: Range): number => {
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        return preCaretRange.toString().length;
    };

    const setCaretPosition = (element: HTMLElement, position: number) => {
        const range = document.createRange();
        const sel = window.getSelection();
        let charCount = 0;
        const nodeStack: Node[] = [element];
        let node: Node | undefined;
        let foundNode: Node | null = null;
        let foundOffset = 0;
        
        while (!foundNode && (node = nodeStack.pop())) {
            if (node.nodeType === 3) { // Text node
                const nextCharCount = charCount + (node.textContent?.length || 0);
                if (position <= nextCharCount) {
                    foundNode = node;
                    foundOffset = position - charCount;
                } else {
                    charCount = nextCharCount;
                }
            } else {
                for (let i = node.childNodes.length - 1; i >= 0; i--) {
                    nodeStack.push(node.childNodes[i]);
                }
            }
        }
        
        if (foundNode) {
            range.setStart(foundNode, foundOffset);
            range.setEnd(foundNode, foundOffset);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    };

    const updateMentionHighlightsWithMap = (element: HTMLElement, mentionsMap: Map<string, string>) => {
        if (mentionsMap.size === 0) {
            // No mentions to highlight, just clear any existing ones
            element.querySelectorAll('.mention-highlight').forEach(el => {
                const parent = el.parentNode;
                if (parent) {
                    parent.replaceChild(document.createTextNode(el.textContent || ''), el);
                    parent.normalize();
                }
            });
            return;
        }
        
        // Get plain text content (this will include text from highlight spans)
        const fullText = element.textContent || '';
        
        // Find all mentions that should be highlighted
        // Simply check if any mention from our map exists in the text
        const mentionsToHighlight: Array<{ start: number; end: number; text: string }> = [];
        
        // Iterate through all mentions in our map and find them in the text
        mentionsMap.forEach((userId, mentionText) => {
            let searchIndex = 0;
            while (true) {
                const index = fullText.indexOf(mentionText, searchIndex);
                if (index === -1) break;
                
                // Check if this is a valid mention position (starts with @ and is a word boundary)
                const charBefore = index > 0 ? fullText[index - 1] : '';
                const isWordStart = index === 0 || /[\s@]/.test(charBefore);
                
                if (isWordStart && fullText[index] === '@') {
                    mentionsToHighlight.push({
                        start: index,
                        end: index + mentionText.length,
                        text: mentionText
                    });
                }
                
                searchIndex = index + 1;
            }
        });
        
        // Sort by position to process in order
        mentionsToHighlight.sort((a, b) => a.start - b.start);
        
        // Check existing highlights
        const existingHighlights = element.querySelectorAll('.mention-highlight');
        const existingHighlightPositions = new Set<string>();
        existingHighlights.forEach(el => {
            const text = el.textContent || '';
            if (mentionsMap.has(text)) {
                // Try to find position in full text
                const pos = fullText.indexOf(text);
                if (pos !== -1) {
                    existingHighlightPositions.add(`${pos}-${pos + text.length}`);
                }
            }
        });
        
        // Check if we need to update
        const needsUpdate = mentionsToHighlight.some(m => {
            const key = `${m.start}-${m.end}`;
            return !existingHighlightPositions.has(key);
        }) || existingHighlights.length !== mentionsToHighlight.length;
        
        if (!needsUpdate && mentionsToHighlight.length > 0) {
            // All highlights are already correct, no need to update
            return;
        }
        
        // Save cursor position
        const selection = window.getSelection();
        let savedCursorPos = 0;
        if (selection && selection.rangeCount > 0) {
            try {
                const range = selection.getRangeAt(0);
                if (element.contains(range.commonAncestorContainer)) {
                    savedCursorPos = getCaretPosition(element, range);
                }
            } catch (e) {
                // Ignore errors
            }
        }
        
        // Clear all existing highlights
        existingHighlights.forEach(el => {
            const parent = el.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(el.textContent || ''), el);
                parent.normalize();
            }
        });
        
        // Rebuild the element with plain text first
        element.textContent = fullText;
        
        // Apply highlights in reverse order
        if (mentionsToHighlight.length > 0) {
            mentionsToHighlight.reverse().forEach(({ start, end, text: mentionText }) => {
                const walker = document.createTreeWalker(
                    element,
                    NodeFilter.SHOW_TEXT,
                    null
                );
                
                let charCount = 0;
                let node: Node | null;
                while (node = walker.nextNode()) {
                    const nodeText = node.textContent || '';
                    const nodeStart = charCount;
                    const nodeEnd = charCount + nodeText.length;
                    
                    if (start >= nodeStart && end <= nodeEnd) {
                        const beforeText = nodeText.substring(0, start - nodeStart);
                        const afterText = nodeText.substring(end - nodeStart);
                        
                        const parent = node.parentNode;
                        if (parent) {
                            if (beforeText) {
                                parent.insertBefore(document.createTextNode(beforeText), node);
                            }
                            
                            const mentionSpan = document.createElement('span');
                            mentionSpan.className = 'mention-highlight font-medium text-blue-600 dark:text-blue-400';
                            mentionSpan.textContent = mentionText;
                            parent.insertBefore(mentionSpan, node);
                            
                            if (afterText) {
                                parent.insertBefore(document.createTextNode(afterText), node);
                            }
                            parent.removeChild(node);
                        }
                        break;
                    }
                    charCount = nodeEnd;
                }
            });
        }
        
        // Restore cursor position after highlights are applied
        if (savedCursorPos > 0) {
            setTimeout(() => {
                setCaretPosition(element, savedCursorPos);
            }, 0);
        }
    };

    const updateMentionHighlights = (element: HTMLElement) => {
        updateMentionHighlightsWithMap(element, commentMentions);
    };

    useEffect(() => {
        if (article && editor) {
            editor.commands.setContent(article.clean_content || "No content available");
        }
    }, [article, editor]);

    // Sync commentMentions ref with state
    useEffect(() => {
        commentMentionsRef.current = commentMentions;
    }, [commentMentions]);

    // Apply visual highlights to commented text
    // This needs to run after both article content is set AND highlights are loaded
    useEffect(() => {
        if (!editor || !article || highlights.length === 0) return;

        let isApplying = false; // Flag to prevent infinite loops

        const applyHighlights = () => {
            if (isApplying) return; // Prevent concurrent executions
            isApplying = true;

            const editorElement = document.querySelector('.ProseMirror');
            if (!editorElement) {
                isApplying = false;
                return;
            }

            const handleHighlightClick = (e: MouseEvent) => {
                const target = e.target as HTMLElement;
                const highlightId = target.getAttribute('data-highlight-id');
                
                if (highlightId) {
                    const highlight = highlights.find(h => h.id === highlightId);
                    if (highlight) {
                        const comment = comments.find(c => c.highlight_id === highlight.id);
                        if (comment) {
                            setShowSidebar(true);
                            setTimeout(() => {
                                const commentElement = document.getElementById(`comment-${comment.id}`);
                                commentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 100);
                        }
                    }
                }
            };

            // Check if highlights are already applied
            const existingHighlights = editorElement.querySelectorAll('[data-highlight-id]');
            if (existingHighlights.length >= highlights.length) {
                isApplying = false;
                return; // Already applied
            }

            // Remove existing highlight markers first
            existingHighlights.forEach(el => {
                const parent = el.parentNode;
                if (parent) {
                    const textNode = document.createTextNode(el.textContent || '');
                    parent.replaceChild(textNode, el);
                    parent.normalize();
                }
            });

            // Apply highlights one by one, recreating the walker each time
            // This ensures we find text nodes even after DOM modifications
            highlights.forEach(highlight => {
                const textContent = highlight.text_content?.trim();
                if (!textContent || textContent.length < 3) {
                    console.log(`Skipping highlight ${highlight.id}: text too short`);
                    return;
                }

                // Check if already highlighted
                if (editorElement.querySelector(`[data-highlight-id="${highlight.id}"]`)) {
                    console.log(`Highlight ${highlight.id} already exists`);
                    return;
                }

                // Find text node containing this highlight text
                const walker = document.createTreeWalker(
                    editorElement,
                    NodeFilter.SHOW_TEXT,
                    {
                        acceptNode: (node) => {
                            // Skip text nodes that are inside existing highlights
                            let parent = node.parentNode;
                            while (parent && parent !== editorElement) {
                                if (parent instanceof HTMLElement && parent.hasAttribute('data-highlight-id')) {
                                    return NodeFilter.FILTER_REJECT;
                                }
                                parent = parent.parentNode;
                            }
                            return NodeFilter.FILTER_ACCEPT;
                        }
                    }
                );

                // First check if the text exists in the full editor content (might be split across nodes)
                const fullEditorText = editorElement.textContent || '';
                const textExistsInEditor = fullEditorText.includes(textContent);
                
                if (!textExistsInEditor) {
                    console.log(`Text not found in editor for highlight ${highlight.id}. Searching for: "${textContent.substring(0, 50)}..."`);
                    console.log(`Full editor text length: ${fullEditorText.length}, first 200 chars:`, fullEditorText.substring(0, 200));
                }
                
                let found = false;
                let node: Node | null;
                let checkedNodes = 0;
                
                // Collect all text nodes first to check if text spans multiple nodes
                const allTextNodes: Text[] = [];
                while (node = walker.nextNode()) {
                    allTextNodes.push(node as Text);
                }
                
                // Try to find the text in a single node first
                for (const textNode of allTextNodes) {
                    checkedNodes++;
                    const text = textNode.textContent || '';
                    
                    // Exact match only
                    const index = text.indexOf(textContent);
                    
                    if (index !== -1) {
                        // Verify the exact text exists at this position
                        const actualText = text.substring(index, index + textContent.length);
                        if (actualText !== textContent) {
                            continue;
                        }
                        
                        // Check if this text node's parent is already a highlight
                        const parent = textNode.parentNode;
                        if (parent instanceof HTMLElement && parent.hasAttribute('data-highlight-id')) {
                            continue;
                        }

                        // Found an exact match in a single node - apply the highlight
                        const beforeText = text.substring(0, index);
                        const afterText = text.substring(index + textContent.length);

                        // Create highlight mark element
                        const highlightMark = document.createElement('mark');
                        highlightMark.className = 'bg-yellow-200 dark:bg-yellow-900/40 cursor-pointer hover:bg-yellow-300 dark:hover:bg-yellow-900/60 transition-colors px-0.5 rounded';
                        highlightMark.setAttribute('data-highlight-id', highlight.id);
                        highlightMark.textContent = textContent;
                        highlightMark.onclick = handleHighlightClick;

                        // Replace the text node
                        if (beforeText) {
                            parent!.insertBefore(document.createTextNode(beforeText), textNode);
                        }
                        parent!.insertBefore(highlightMark, textNode);
                        if (afterText) {
                            parent!.insertBefore(document.createTextNode(afterText), textNode);
                        }
                        parent!.removeChild(textNode);

                        found = true;
                        console.log(`Applied highlight ${highlight.id} for text: "${textContent.substring(0, 50)}..."`);
                        break;
                    }
                }

                if (!found) {
                    // Get full editor text for debugging
                    const fullEditorText = editorElement.textContent || '';
                    const searchPreview = textContent.substring(0, 100);
                    const editorPreview = fullEditorText.substring(0, 500);
                    console.log(`Could not find text for highlight ${highlight.id}:`, {
                        searchingFor: searchPreview,
                        checkedNodes,
                        editorPreview: editorPreview.substring(0, 200),
                        highlightTextLength: textContent.length,
                        highlightTextFirstChars: JSON.stringify(textContent.substring(0, 50)),
                    });
                }
            });

            isApplying = false;
        };

        // Apply highlights after editor content is set and fully rendered
        const timeoutId = setTimeout(() => {
            const editorElement = document.querySelector('.ProseMirror');
            if (editorElement && editorElement.textContent && editorElement.textContent.trim().length > 0) {
                applyHighlights();
            } else {
                // Retry once if editor not ready yet
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
    }, [editor, article, highlights, comments]);

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
                        apikey: ANON_KEY,
                        Authorization: `Bearer ${ANON_KEY}`
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

    const fetchComments = async () => {
        try {
            // Fetch comments with author names by joining with profiles
            const response = await fetch(
                `https://xltqabrlmfalosewvjby.supabase.co/rest/v1/comments?article_id=eq.${articleId}&select=*,profiles!comments_author_id_fkey(full_name),mentioned_users&order=created_at.desc`,
                { headers: { apikey: ANON_KEY } }
            );
            const data = await response.json();
            console.log('Fetched comments:', data);
            // Map the nested profile data to author_name
            const commentsWithAuthors = data.map((comment: any) => {
                const processed = {
                    ...comment,
                    author_name: comment.profiles?.full_name || 'Unknown',
                    mentioned_users: comment.mentioned_users || [],
                };
                console.log('Processed comment:', processed.id, 'mentioned_users:', processed.mentioned_users);
                return processed;
            });
            setComments(commentsWithAuthors);
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    };

    const fetchHighlights = async () => {
        try {
            const response = await fetch(
                `https://xltqabrlmfalosewvjby.supabase.co/rest/v1/highlights?article_id=eq.${articleId}&select=*`,
                { headers: { apikey: ANON_KEY } }
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
                    apikey: ANON_KEY,
                    "Content-Type": "application/json",
                    Prefer: "return=minimal",
                },
                body: JSON.stringify({
                    article_id: articleId,
                    user_id: "492acb7a-2cce-47d7-86d4-b2df4b1ddc69",
                    start_offset: 0, // TODO: Calculate actual offset
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

    const addComment = async () => {
        if (!newComment.trim()) return;

        try {
            // First create the highlight for the selected text
            let highlightId = null;
            if (selectedText) {
                const highlightResponse = await fetch("https://xltqabrlmfalosewvjby.supabase.co/rest/v1/highlights", {
                    method: "POST",
                    headers: {
                        apikey: ANON_KEY,
                        "Content-Type": "application/json",
                        Prefer: "return=representation",
                    },
                    body: JSON.stringify({
                        article_id: articleId,
                        user_id: "492acb7a-2cce-47d7-86d4-b2df4b1ddc69",
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
            // Get the actual text from contentEditable div (which has the mentions)
            const commentText = commentInputRef.current?.textContent || newComment;
            
            // Use ref to get the latest mentions map
            const currentMentions = commentMentionsRef.current;
            
            console.log('Extracting mentions:', {
                newComment,
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
                author_id: "492acb7a-2cce-47d7-86d4-b2df4b1ddc69",
                highlight_id: highlightId,
                mentioned_users: mentionedUserIds.length > 0 ? mentionedUserIds : null,
            };
            
            console.log('Sending comment payload:', commentPayload);
            
            const commentResponse = await fetch("https://xltqabrlmfalosewvjby.supabase.co/rest/v1/comments", {
                method: "POST",
                headers: {
                    apikey: ANON_KEY,
                    "Content-Type": "application/json",
                    Prefer: "return=representation",
                },
                body: JSON.stringify(commentPayload),
            });
            
            const createdComment = await commentResponse.json();
            console.log('Created comment response:', createdComment);

            setNewComment("");
            setCommentMentions(new Map());
            setSelectedText("");
            setShowToolbar(false);
            setShowSidebar(true);
            if (commentInputRef.current) {
                commentInputRef.current.textContent = "";
            }
            fetchComments();
            fetchHighlights();
        } catch (error) {
            console.error("Error adding comment:", error);
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
            {/* Minimal Header */}
            <div className="border-b px-6 py-3 flex items-center justify-between">
                <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                >
                    💬 Comments ({comments.length})
                </button>
                <button
                    onClick={() => router.back()}
                    className="text-muted-foreground hover:text-foreground text-sm"
                >
                    ✕ Close
                </button>
            </div>

            {/* Main Content - Full Screen */}
            <div className="flex-1 flex overflow-hidden">
                {/* Article Content - Centered like Notion */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-[750px] mx-auto px-12 py-12">
                        <h1 className="text-4xl font-bold mb-3">{article.title}</h1>
                        {article.url && (
                            <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-500 hover:underline mb-6 block"
                            >
                                View Original →
                            </a>
                        )}
                        
                        {/* Business Insights - Why This Matters for Omen */}
                        {article.why_it_matters && (
                            <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                                <h2 className="text-xl font-semibold mb-3">Why This Matters for Omen</h2>
                                <p className="text-base leading-relaxed">{article.why_it_matters}</p>
                            </div>
                        )}
                        
                        {/* Business Summary - Relevant Insights */}
                        {article.business_summary && (
                            <div className="mb-8 p-6 bg-muted/50 rounded-lg border">
                                <h2 className="text-xl font-semibold mb-3">Relevant Insights</h2>
                                <div className="prose prose-lg dark:prose-invert max-w-none">
                                    <p className="whitespace-pre-wrap leading-relaxed">{article.business_summary}</p>
                                </div>
                            </div>
                        )}
                        
                        {/* Full Article Content */}
                        <div className="mt-6 pt-6 border-t">
                            <article className="prose prose-lg dark:prose-invert max-w-none">
                                <h2 className="text-4xl font-semibold mb-6">Full Article</h2>
                                <EditorContent editor={editor} />
                            </article>
                        </div>
                    </div>
                </div>

                {/* Comment Sidebar - Hidden by default */}
                {showSidebar && (
                    <div className="w-80 border-l bg-muted/5 flex flex-col">
                        <div className="p-4 border-b">
                            <h2 className="font-semibold">Comments</h2>
                        </div>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {comments.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No comments yet
                                </p>
                            ) : (
                                comments.map((comment) => {
                                    const highlight = highlights.find(h => h.id === comment.highlight_id);
                                    return (
                                        <div key={comment.id} id={`comment-${comment.id}`} className="bg-background rounded-lg p-3 border">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-semibold text-muted-foreground">
                                                    {comment.author_name || 'Unknown'}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(comment.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {highlight && (
                                                <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm italic border-l-2 border-yellow-400">
                                                    "{highlight.text_content}"
                                                </div>
                                            )}
                                            <p className="text-sm whitespace-pre-wrap">
                                                {(() => {
                                                    // Parse mentions from comment body
                                                    const body = comment.body;
                                                    const mentionedUserIds = comment.mentioned_users || [];
                                                    
                                                    // Debug logging - always log to see what's happening
                                                    console.log('Rendering comment:', {
                                                        commentId: comment.id,
                                                        body,
                                                        mentionedUserIds,
                                                        mentionedUserIdsLength: mentionedUserIds.length,
                                                        teamMembersCount: teamMembers.length,
                                                        teamMembers: teamMembers
                                                    });
                                                    
                                                    // If no mentioned users, just return the body as plain text
                                                    if (mentionedUserIds.length === 0) {
                                                        console.log('No mentioned users, returning plain text');
                                                        return body;
                                                    }
                                                    
                                                    if (teamMembers.length === 0) {
                                                        console.log('No team members loaded yet, returning plain text');
                                                        return body;
                                                    }
                                                    
                                                    // Create a map of user IDs to names from team members
                                                    const userIdToName = new Map<string, string>();
                                                    teamMembers.forEach(member => {
                                                        userIdToName.set(member.id, member.full_name || 'Unknown');
                                                    });
                                                    
                                                    // Create a set of mention names that should be highlighted
                                                    const mentionNamesToHighlight = new Set<string>();
                                                    mentionedUserIds.forEach(userId => {
                                                        const userName = userIdToName.get(userId);
                                                        if (userName) {
                                                            mentionNamesToHighlight.add(`@${userName}`);
                                                        }
                                                    });
                                                    
                                                    console.log('Mention names to highlight:', Array.from(mentionNamesToHighlight));
                                                    
                                                    // Find all @mentions in the text
                                                    const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
                                                    const parts: Array<{ text: string; isMention: boolean }> = [];
                                                    let lastIndex = 0;
                                                    let match;
                                                    
                                                    while ((match = mentionRegex.exec(body)) !== null) {
                                                        // Add text before mention
                                                        if (match.index > lastIndex) {
                                                            parts.push({ text: body.substring(lastIndex, match.index), isMention: false });
                                                        }
                                                        
                                                        const mentionText = match[0]; // @Name
                                                        
                                                        // Check if this mention should be highlighted
                                                        const shouldHighlight = mentionNamesToHighlight.has(mentionText);
                                                        
                                                        console.log('Found mention:', mentionText, 'should highlight:', shouldHighlight);
                                                        
                                                        parts.push({ 
                                                            text: mentionText, 
                                                            isMention: shouldHighlight 
                                                        });
                                                        
                                                        lastIndex = match.index + mentionText.length;
                                                    }
                                                    
                                                    // Add remaining text
                                                    if (lastIndex < body.length) {
                                                        parts.push({ text: body.substring(lastIndex), isMention: false });
                                                    }
                                                    
                                                    // If no parts were created, return body as-is
                                                    if (parts.length === 0) {
                                                        return body;
                                                    }
                                                    
                                                    return parts.map((part, idx) => {
                                                        if (part.isMention) {
                                                            return (
                                                                <span key={idx} className="font-medium text-blue-600 dark:text-blue-400">
                                                                    {part.text}
                                                                </span>
                                                            );
                                                        }
                                                        return <span key={idx}>{part.text}</span>;
                                                    });
                                                })()}
                                            </p>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Add Comment */}
                        <div className="p-4 border-t relative">
                            {selectedText && (
                                <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs italic border-l-2 border-yellow-400">
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
                                            // Check if we're still typing the mention (no space or newline after @)
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
                                        
                                        // Update mention highlights after a short delay to avoid conflicts
                                        // Only update if we're not currently typing a mention (to avoid flickering)
                                        if (!showMentionSuggestions) {
                                            // Use requestAnimationFrame for smoother updates
                                            requestAnimationFrame(() => {
                                                setCommentMentions(currentMentions => {
                                                    updateMentionHighlightsWithMap(div, currentMentions);
                                                    return currentMentions;
                                                });
                                            });
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (showMentionSuggestions && e.key === 'Enter') {
                                            e.preventDefault();
                                            // Select first suggestion on Enter
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
                                                        
                                                        // Update the text first
                                                        const newText = textBefore + mentionText + ' ' + textAfter;
                                                        setNewComment(newText);
                                                        
                                                        // Store the mapping - use functional update to ensure we have latest state
                                                        setCommentMentions(prev => {
                                                            const newMap = new Map(prev);
                                                            newMap.set(mentionText, member.id);
                                                            return newMap;
                                                        });
                                                        
                                                        // Update the contentEditable div with plain text first
                                                        commentInputRef.current.textContent = newText;
                                                        
                                                        // Move cursor after the mention
                                                        const newCursorPos = mentionPosition.start + mentionText.length + 1;
                                                        setCaretPosition(commentInputRef.current, newCursorPos);
                                                        
                                                        // Then apply highlights after state update
                                                        setTimeout(() => {
                                                            // Re-read the mentions map from state
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
                                onClick={addComment}
                                disabled={!newComment.trim()}
                                className="mt-2 w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium disabled:opacity-50"
                            >
                                Add Comment
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Toolbar on Text Selection */}
            {showToolbar && (
                <div
                    className="fixed bg-background border rounded-lg shadow-lg p-2 flex gap-2 z-50"
                    style={{
                        left: `${toolbarPosition.x}px`,
                        top: `${toolbarPosition.y}px`,
                        transform: "translateX(-50%)",
                    }}
                >
                    <button
                        onClick={() => {
                            setShowSidebar(true);
                            setShowToolbar(false);
                            // Focus on comment input
                            setTimeout(() => {
                                const textarea = document.querySelector('textarea');
                                textarea?.focus();
                            }, 100);
                        }}
                        className="px-3 py-1 text-sm hover:bg-muted rounded"
                    >
                        💬 Add Comment
                    </button>
                </div>
            )}
        </div>
    );
}
