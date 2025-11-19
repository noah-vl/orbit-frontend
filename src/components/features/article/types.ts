export interface Comment {
    id: string;
    body: string;
    created_at: string;
    author_id: string;
    highlight_id?: string;
    author_name?: string;
    mentioned_users?: string[];
    parent_id?: string | null;
    replies?: Comment[];
}

export interface TextHighlight {
    id: string;
    start_offset: number;
    end_offset: number;
    text_content: string;
    color: string;
    user_id?: string;
}

export interface TeamMember {
    id: string;
    full_name: string | null;
    role: string | null;
}

