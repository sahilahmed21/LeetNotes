// frontend/src/types.ts

export interface LeetCodeData {
    username: string;
    profile_stats: {
        total_solved: number;
        easy: number;
        medium: number;
        hard: number;
    };
    problems: Problem[];
}

export interface Problem {
    title: string;
    slug: string;
    description: string;
    difficulty: string;
    tags: string[];
    submissions: Submission[];
}

export interface Submission {
    status: string;
    code: string;
    timestamp: string;
    runtime: string | null;
    memory: string | null;
    language: string;
    id: string;
}

export interface Note {
    title: string;
    content: string;
}