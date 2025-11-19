"use client";

import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface HighlightToolbarProps {
    show: boolean;
    position: { x: number; y: number };
    onAddComment: () => void;
}

export function HighlightToolbar({ show, position, onAddComment }: HighlightToolbarProps) {
    if (!show) return null;

    return (
        <Button
            className="fixed z-50 shadow-lg"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: "translateX(-50%)",
            }}
            onClick={onAddComment}
        >
            <MessageSquare className="w-4 h-4 text-white" />
            Add Comment
        </Button>
    );
}

