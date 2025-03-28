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
}

export interface Note {
    title: string;
    notes: {
        topic: string;
        question: string;
        intuition: string;
        example: string;
        counterexample: string;
        pseudocode: string;
        mistake: string;
        code: string;
    };
}