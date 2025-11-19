// Helper functions for contentEditable mention handling

export const getCaretPosition = (element: HTMLElement, range: Range): number => {
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
};

export const setCaretPosition = (element: HTMLElement, position: number) => {
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

export const updateMentionHighlightsWithMap = (element: HTMLElement, mentionsMap: Map<string, string>) => {
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
                        mentionSpan.className = 'mention-highlight font-medium text-blue-600';
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

