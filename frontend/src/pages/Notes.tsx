"use client";

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabase";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useToast } from "../components/ui/use-toast";
import { Toaster } from "../components/ui/toaster";
import { ArrowLeft, Info } from "lucide-react";

interface Submission {
    id: string;
    status: string;
    language: string;
    runtime: string;
    memory: string;
    code: string;
}

interface ProblemData {
    id: string;
    title: string;
    difficulty: "Easy" | "Medium" | "Hard" | string;
    description: string;
    tags: string[];
    submissions: Submission[];
    user_id: string;
}

interface NoteContent {
    topic: string;
    question: string;
    intuition: string;
    example: string;
    counterexample: string;
    pseudocode: string;
    mistake: string;
    code: string;
}

interface NoteData {
    id: string;
    problem_id: string;
    user_id: string;
    notes: NoteContent;
    created_at?: string;
}

const Notes: React.FC = () => {
    const { problemId } = useParams<{ problemId: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [problem, setProblem] = useState<ProblemData | null>(null);
    const [notes, setNotes] = useState<NoteData | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const validateAndSetSession = async () => {
            setLoading(true);
            setError(null);
            setProblem(null);
            setNotes(null);

            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData.session) {
                toast({ title: "Authentication Required", description: "Please log in to view notes.", variant: "destructive" });
                navigate("/login");
                setLoading(false);
                return;
            }

            const fetchedUser = sessionData.session.user;
            setUser(fetchedUser);
            await fetchProblemAndNotes(fetchedUser.id);
            setLoading(false);
        };

        if (problemId) {
            validateAndSetSession();
        } else {
            setError("Problem ID is missing in the URL.");
            setLoading(false);
        }
    }, [problemId, navigate]);

    const fetchProblemAndNotes = async (userId: string) => {
        setError(null);

        try {
            const { data: problemData, error: problemError } = await supabase
                .from("problems")
                .select("*, submissions(*)")
                .eq("id", problemId)
                .eq("user_id", userId)
                .single();

            if (problemError || !problemData) {
                throw new Error(problemError?.message || "Failed to fetch problem details.");
            }
            setProblem(problemData);

            const { data: notesData, error: notesError } = await supabase
                .from("notes")
                .select("*")
                .eq("problem_id", problemId)
                .eq("user_id", userId)
                .maybeSingle();

            if (notesError && notesError.code !== 'PGRST116') {
                toast({ title: "Note Fetch Error", description: notesError.message, variant: "destructive" });
            }
            setNotes(notesData || null);
        } catch (err: any) {
            setError(err.message);
            setProblem(null);
            setNotes(null);
        }
    };

    const handleGenerateNotes = async () => {
        if (!user || !problem) {
            setError("User or problem data is missing.");
            toast({ title: "Error", description: "User or problem data missing.", variant: "destructive" });
            return;
        }

        setGenerating(true);
        setError(null);

        try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData.session) {
                toast({ title: "Session Error", description: "Please log in again.", variant: "destructive" });
                navigate("/login");
                return;
            }
            const token = sessionData.session.access_token;

            const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:3000";
            const { data: generatedNotesData } = await axios.post<NoteData>(
                `${backendUrl}/api/generate-notes/${problemId}`,
                {},
                {
                    headers: {
                        "x-user-id": user.id,
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setNotes(generatedNotesData);
            toast({
                title: "Notes Generated!",
                description: `Successfully generated notes for ${problem.title}.`,
                variant: "default",
            });
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || "Failed to generate notes";
            setError(errorMessage);
            toast({ title: "Generation Failed", description: errorMessage, variant: "destructive" });
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#27374D]">
                <div className="w-8 h-8 border-4 border-[#DDE6ED] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !problem) {
        return (
            <div className="min-h-screen p-4 bg-[#27374D]">
                <header className="sticky top-0 z-10 flex items-center justify-between p-4 mb-6 bg-[#27374D] shadow-md">
                    <Button
                        asChild
                        variant="outline"
                        className="bg-[#526D82] text-[#DDE6ED] hover:bg-[#9DB2BF] hover:text-[#27374D]"
                    >
                        <Link to="/home">
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to Home
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold text-[#DDE6ED]">Error</h1>
                    <div className="w-24"></div>
                </header>
                <main className="container mx-auto max-w-4xl">
                    <Card className="bg-red-100 border border-red-300">
                        <CardHeader>
                            <CardTitle className="text-red-800">Oops! Something went wrong.</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-red-700">{error || "The requested problem could not be found or loaded."}</p>
                            <Button asChild variant="destructive" className="mt-4">
                                <Link to="/home">Go Back Home</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    const getDifficultyBadge = (difficulty: string): React.ReactNode => {
        let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
        let className = "";
        switch (difficulty?.toLowerCase()) {
            case 'easy':
                variant = 'default';
                className = 'bg-green-100 text-green-800 border-green-300';
                break;
            case 'medium':
                variant = 'secondary';
                className = 'bg-yellow-100 text-yellow-800 border-yellow-300';
                break;
            case 'hard':
                variant = 'destructive';
                className = 'bg-red-100 text-red-800 border-red-300';
                break;
            default:
                className = 'bg-gray-100 text-gray-800 border-gray-300';
        }
        return <Badge variant={variant} className={`px-3 py-1 ${className}`}>{difficulty}</Badge>;
    };

    return (
        <div className="min-h-screen bg-[#27374D]">
            <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-[#27374D] shadow-md">
                <Button
                    asChild
                    variant="outline"
                    className="bg-[#526D82] text-[#DDE6ED] hover:bg-[#9DB2BF] hover:text-[#27374D]"
                >
                    <Link to="/home">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Home
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold text-[#DDE6ED] truncate hidden md:block" title={problem.title}>
                    {problem.title}
                </h1>
                <div className="w-32 md:w-48"></div>
            </header>

            <main className="container px-4 py-8 mx-auto max-w-4xl">
                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6 bg-[#526D82]">
                        <TabsTrigger value="details" className="text-[#DDE6ED]">Problem Details</TabsTrigger>
                        <TabsTrigger value="notes" className="text-[#DDE6ED]">Notes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details">
                        <Card className="bg-[#DDE6ED]">
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                                    <CardTitle className="text-2xl font-bold text-[#27374D]">{problem.title}</CardTitle>
                                    {getDifficultyBadge(problem.difficulty)}
                                </div>
                                <CardDescription className="text-[#526D82] pt-1">ID: {problem.id}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="mb-1 text-sm font-medium text-[#526D82] uppercase tracking-wider">Description</h3>
                                    <p className="text-[#27374D] whitespace-pre-wrap">{problem.description || "No description available."}</p>
                                </div>
                                <Separator className="bg-[#9DB2BF]/50" />
                                <div>
                                    <h3 className="mb-2 text-sm font-medium text-[#526D82] uppercase tracking-wider">Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {(problem.tags || []).map((tag, index) => (
                                            <Badge key={index} variant="outline" className="text-xs bg-[#526D82] bg-opacity-50 text-[#3C5B6F] border-[#526D82]/60">
                                                {tag}
                                            </Badge>
                                        ))}
                                        {(!problem.tags || problem.tags.length === 0) && <p className="text-sm text-gray-500">No tags associated.</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="notes">
                        {generating && (
                            <Card className="p-6 bg-[#DDE6ED] rounded-lg shadow-md">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xl font-semibold text-[#27374D]">Generating Notes...</CardTitle>
                                    <CardDescription className="text-[#526D82]">This may take a moment.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <Skeleton className="h-6 w-1/4" />
                                        <Skeleton className="h-10 w-full" />
                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <Skeleton className="h-20 w-full" />
                                            <Skeleton className="h-20 w-full" />
                                        </div>
                                        <Skeleton className="h-20 w-full" />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {!generating && notes && notes.notes && (
                            <Card className="bg-[#DDE6ED]">
                                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl font-semibold text-[#27374D]">Generated Notes</CardTitle>
                                        {notes.created_at && <CardDescription className="text-[#526D82] text-xs pt-1">Generated on: {new Date(notes.created_at).toLocaleString()}</CardDescription>}
                                    </div>
                                    <Button
                                        onClick={handleGenerateNotes}
                                        disabled={generating}
                                        variant="outline"
                                        size="sm"
                                        className="bg-[#526D82] text-[#DDE6ED] hover:bg-[#9DB2BF] hover:text-[#27374D]"
                                    >
                                        Regenerate
                                    </Button>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="mb-4 p-3 bg-[#9DB2BF] bg-opacity-20 rounded-md">
                                        <h3 className="mb-1 text-sm font-medium text-[#526D82] uppercase tracking-wider">Topic</h3>
                                        <p className="text-[#27374D] font-semibold">{notes.notes.topic}</p>
                                    </div>
                                    <div className="mb-6 p-3 bg-[#9DB2BF] bg-opacity-20 rounded-md">
                                        <h3 className="mb-1 text-sm font-medium text-[#526D82] uppercase tracking-wider">Question Summary</h3>
                                        <p className="text-[#27374D] whitespace-pre-wrap">{notes.notes.question}</p>
                                    </div>

                                    <Tabs defaultValue="intuition" className="w-full">
                                        <TabsList className="w-full mb-4 bg-[#9DB2BF] bg-opacity-20 grid grid-cols-3 sm:grid-cols-6 h-auto sm:h-10">
                                            <TabsTrigger value="intuition" className="text-[#27374D]">Intuition</TabsTrigger>
                                            <TabsTrigger value="example" className="text-[#27374D]">Example</TabsTrigger>
                                            <TabsTrigger value="counterexample" className="text-[#27374D]">Counter</TabsTrigger>
                                            <TabsTrigger value="pseudocode" className="text-[#27374D]">Pseudo</TabsTrigger>
                                            <TabsTrigger value="mistake" className="text-[#27374D]">Mistakes</TabsTrigger>
                                            <TabsTrigger value="code" className="text-[#27374D]">Code</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="intuition" className="p-4 bg-[#9DB2BF] bg-opacity-10 rounded-md min-h-[100px]">
                                            <p className="text-[#27374D] whitespace-pre-wrap">{notes.notes.intuition}</p>
                                        </TabsContent>
                                        <TabsContent value="example" className="p-4 bg-[#9DB2BF] bg-opacity-10 rounded-md min-h-[100px]">
                                            <pre className="p-3 bg-[#27374D] bg-opacity-10 rounded-md overflow-auto"><code className="text-[#27374D]">{notes.notes.example}</code></pre>
                                        </TabsContent>
                                        <TabsContent value="counterexample" className="p-4 bg-[#9DB2BF] bg-opacity-10 rounded-md min-h-[100px]">
                                            <pre className="p-3 bg-[#27374D] bg-opacity-10 rounded-md overflow-auto"><code className="text-[#27374D]">{notes.notes.counterexample}</code></pre>
                                        </TabsContent>
                                        <TabsContent value="pseudocode" className="p-4 bg-[#9DB2BF] bg-opacity-10 rounded-md min-h-[100px]">
                                            <pre className="p-3 bg-[#27374D] bg-opacity-10 rounded-md overflow-auto"><code className="text-[#27374D]">{notes.notes.pseudocode}</code></pre>
                                        </TabsContent>
                                        <TabsContent value="mistake" className="p-4 bg-[#9DB2BF] bg-opacity-10 rounded-md min-h-[100px]">
                                            <p className="text-[#27374D] whitespace-pre-wrap">{notes.notes.mistake}</p>
                                        </TabsContent>
                                        <TabsContent value="code" className="p-4 bg-[#9DB2BF] bg-opacity-10 rounded-md min-h-[100px]">
                                            <pre className="p-3 bg-[#27374D] bg-opacity-10 rounded-md overflow-auto"><code className="text-[#27374D]">{notes.notes.code}</code></pre>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        )}

                        {!generating && !notes && (
                            <Card className="bg-[#DDE6ED]">
                                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                    <Info className="w-12 h-12 text-[#526D82] mb-4" />
                                    <h3 className="mb-2 text-xl font-semibold text-[#27374D]">No Notes Yet</h3>
                                    <p className="mb-6 text-[#526D82]">Generate notes for this problem to get started.</p>
                                    <Button
                                        onClick={handleGenerateNotes}
                                        disabled={generating}
                                        className="px-6 py-2 bg-[#526D82] text-[#DDE6ED] hover:bg-[#27374D]"
                                    >
                                        Generate Notes
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </main>
            <Toaster />
        </div>
    );
};

export default Notes;