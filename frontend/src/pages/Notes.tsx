// frontend/src/pages/Notes.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabase"; // Ensure this path is correct for your structure
import axios from "axios";
import { Button } from "../components/ui/button"; // Ensure this path is correct
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"; // Ensure this path is correct
import { Separator } from "../components/ui/separator"; // Ensure this path is correct
import { Badge } from "../components/ui/badge"; // Ensure this path is correct
import { Skeleton } from "../components/ui/skeleton"; // Ensure this path is correct
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"; // Ensure this path is correct
import { useToast } from "../components/ui/use-toast"; // Ensure this path is correct
import { Toaster } from "../components/ui/toaster"; // Ensure this path is correct
import { ArrowLeft, Info } from "lucide-react";

// Interfaces (keep as they are)
interface Submission {
    id: string;
    submission_id?: string; // Add submission_id from the fix earlier
    status: string;
    language: string;
    runtime: string;
    memory: string;
    code: string;
    timestamp?: string; // Add timestamp if needed by Gemini prompt
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
    problem_id: string; // Should match Supabase column type (likely number or string)
    user_id: string;
    notes: NoteContent;
    created_at?: string;
    title?: string; // Add title if it comes back from API
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
                navigate("/login"); // Adjust path if your login route is different
                setLoading(false);
                return;
            }

            const fetchedUser = sessionData.session.user;
            setUser(fetchedUser);
            // Ensure problemId is valid before fetching
            if (problemId && !isNaN(parseInt(problemId, 10))) {
                await fetchProblemAndNotes(fetchedUser.id, problemId);
            } else {
                setError("Invalid or missing Problem ID in the URL.");
                toast({ title: "Error", description: "Invalid Problem ID.", variant: "destructive" });
            }
            setLoading(false);
        };

        validateAndSetSession();
    }, [problemId, navigate]); // Rerun effect if problemId changes

    const fetchProblemAndNotes = async (userId: string, currentProblemId: string) => {
        setError(null);
        setProblem(null); // Reset problem state on fetch
        setNotes(null); // Reset notes state on fetch

        try {
            // Fetch problem details including submissions
            const { data: problemData, error: problemError } = await supabase
                .from("problems")
                .select("*, submissions(*)") // Fetch submissions related to this problem
                .eq("id", currentProblemId) // Filter by problem ID from URL
                .eq("user_id", userId)     // Filter by current user ID
                .single();

            if (problemError) {
                console.error("Supabase problem fetch error:", problemError);
                // Handle case where problem doesn't exist for user/ID
                if (problemError.code === 'PGRST116') { // Row not found
                    throw new Error(`Problem with ID ${currentProblemId} not found for your account.`);
                }
                throw new Error(problemError.message || "Failed to fetch problem details.");
            }
            if (!problemData) {
                throw new Error(`Problem with ID ${currentProblemId} not found.`);
            }
            setProblem(problemData as ProblemData); // Set the fetched problem data

            // Fetch existing notes for this problem
            const { data: notesData, error: notesError } = await supabase
                .from("notes")
                .select("*")
                .eq("problem_id", currentProblemId) // Filter by problem ID
                .eq("user_id", userId)          // Filter by user ID
                .maybeSingle(); // Use maybeSingle as notes might not exist yet

            if (notesError && notesError.code !== 'PGRST116') { // Ignore 'row not found' error
                console.error("Supabase notes fetch error:", notesError);
                // Show toast but don't block rendering problem details
                toast({ title: "Note Fetch Error", description: notesError.message, variant: "destructive" });
            }
            setNotes(notesData as NoteData | null); // Set notes if found, otherwise null

        } catch (err: any) {
            console.error("Error in fetchProblemAndNotes:", err);
            setError(err.message); // Set error state to display message
            setProblem(null);      // Clear problem state on error
            setNotes(null);        // Clear notes state on error
        }
    };

    const handleGenerateNotes = async () => {
        // Ensure problemId exists from useParams before proceeding
        if (!problemId) {
            toast({ title: "Error", description: "Problem ID is missing.", variant: "destructive" });
            return;
        }
        if (!user || !problem) {
            setError("User or problem data is not loaded yet.");
            toast({ title: "Error", description: "User or problem data missing.", variant: "destructive" });
            return;
        }

        setGenerating(true);
        setError(null); // Clear previous errors

        try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData.session) {
                toast({ title: "Session Error", description: "Please log in again.", variant: "destructive" });
                setGenerating(false); // Stop loading indicator
                navigate("/login"); // Redirect to login
                return;
            }
            const token = sessionData.session.access_token;

            // --- URL Construction Fix ---
            // Get base URL, trim potential trailing slash, or use fallback
            const backendUrl = (process.env.REACT_APP_BACKEND_URL || "http://localhost:3000").replace(/\/$/, '');
            // Construct the full API URL
            const apiUrl = `${backendUrl}/api/generate-notes/${problemId}`;
            // --- End URL Construction Fix ---

            console.log("Attempting POST to:", apiUrl); // Log the exact URL being called

            const { data: generatedNotesData } = await axios.post<NoteData>(
                apiUrl,
                {}, // Empty body as required by the backend endpoint
                {
                    headers: {
                        // Remove the 'x-user-id' header, rely on Authorization token
                        // 'x-user-id': user.id,
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json' // Good practice to include
                    },
                    timeout: 90000 // Increase timeout for AI generation (90 seconds)
                }
            );

            // Update the notes state with the newly generated data
            setNotes(generatedNotesData);
            toast({
                title: "Notes Generated!",
                description: `Successfully generated notes for ${problem.title}.`,
                variant: "default",
            });

        } catch (err: any) {
            console.error("Generate notes request failed:", err); // Log the full error
            // Try to get more specific error messages
            let errorMessage = "Failed to generate notes.";
            if (axios.isAxiosError(err)) {
                if (err.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.error("Error response data:", err.response.data);
                    console.error("Error response status:", err.response.status);
                    errorMessage = `Error ${err.response.status}: ${err.response.data?.error || err.response.data?.message || err.message}`;
                    if (err.response.status === 404) {
                        errorMessage = "Error: The generate notes API endpoint was not found. Please check the backend URL and route.";
                    }
                } else if (err.request) {
                    // The request was made but no response was received
                    console.error("Error request:", err.request);
                    errorMessage = "No response received from the server. Please check network connectivity and the backend server status.";
                } else {
                    // Something happened in setting up the request that triggered an Error
                    errorMessage = err.message;
                }
            } else {
                errorMessage = err.message || "An unexpected error occurred.";
            }

            setError(errorMessage); // Set the error state for potential display
            toast({ title: "Generation Failed", description: errorMessage, variant: "destructive" });
        } finally {
            setGenerating(false); // Ensure loading indicator stops
        }
    };

    // --- Rest of the component (Loading state, Error display, JSX) ---
    // (Keep the existing JSX structure, loading, error handling, etc.)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#27374D]">
                <div className="w-8 h-8 border-4 border-[#DDE6ED] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Display error prominently if fetching problem failed
    if (error && !problem) { // Show specific error view if problem couldn't load
        return (
            <div className="min-h-screen p-4 bg-[#27374D]">
                <header className="sticky top-0 z-10 flex items-center justify-between p-4 mb-6 bg-[#27374D] shadow-md">
                    <Button
                        asChild
                        variant="outline"
                        className="bg-[#526D82] text-[#DDE6ED] hover:bg-[#9DB2BF] hover:text-[#27374D]"
                    >
                        <Link to="/home"> {/* Adjust if home route is different */}
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to Home
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold text-[#DDE6ED]">Error</h1>
                    <div className="w-24"></div> {/* Spacer */}
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
                <Toaster /> {/* Ensure Toaster is rendered */}
            </div>
        );
    }

    // If problem loaded but there was a note-specific error, it will show via toast
    // Render the main content if problem data is available
    if (!problem) {
        // This case should ideally be covered by the error view above, but acts as a fallback
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#27374D] text-[#DDE6ED]">
                Problem data is not available.
                <Toaster />
            </div>
        );
    }

    // Function to get badge styling (keep as is)
    const getDifficultyBadge = (difficulty: string): React.ReactNode => {
        // ... (keep existing implementation)
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


    // Main JSX structure (keep as is)
    return (
        <div className="min-h-screen bg-[#27374D]">
            <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-[#27374D] shadow-md">
                <Button
                    asChild
                    variant="outline"
                    className="bg-[#526D82] text-[#DDE6ED] hover:bg-[#9DB2BF] hover:text-[#27374D]"
                >
                    <Link to="/home"> {/* Adjust if home route is different */}
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Home
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold text-[#DDE6ED] truncate hidden md:block" title={problem.title}>
                    {problem.title}
                </h1>
                {/* Ensure consistent spacing or element on the right */}
                <div className="w-32 md:w-48"></div>
            </header>

            <main className="container px-4 py-8 mx-auto max-w-4xl">
                {/* Display general errors if they occurred after problem load */}
                {error && (
                    <Card className="mb-4 bg-red-100 border border-red-300">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-red-800 text-lg">An Error Occurred</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-red-700">{error}</p>
                        </CardContent>
                    </Card>
                )}

                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6 bg-[#526D82]">
                        <TabsTrigger value="details" className="data-[state=active]:bg-[#DDE6ED] data-[state=active]:text-[#27374D] text-[#DDE6ED]">Problem Details</TabsTrigger>
                        <TabsTrigger value="notes" className="data-[state=active]:bg-[#DDE6ED] data-[state=active]:text-[#27374D] text-[#DDE6ED]">Notes</TabsTrigger>
                    </TabsList>

                    {/* Problem Details Tab Content (keep as is) */}
                    <TabsContent value="details">
                        <Card className="bg-[#DDE6ED]">
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                                    <CardTitle className="text-2xl font-bold text-[#27374D]">{problem.title}</CardTitle>
                                    {getDifficultyBadge(problem.difficulty)}
                                </div>
                                {/* Make sure problem.id is a string or number */}
                                <CardDescription className="text-[#526D82] pt-1">ID: {String(problem.id)}</CardDescription>
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

                    {/* Notes Tab Content (keep as is, structure depends on 'generating' and 'notes' state) */}
                    <TabsContent value="notes">
                        {generating && (
                            <Card className="p-6 bg-[#DDE6ED] rounded-lg shadow-md">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xl font-semibold text-[#27374D]">Generating Notes...</CardTitle>
                                    <CardDescription className="text-[#526D82]">This may take a moment.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {/* Skeleton Loading state */}
                                    <div className="space-y-4">
                                        <Skeleton className="h-6 w-1/4 bg-[#9DB2BF]/30" />
                                        <Skeleton className="h-10 w-full bg-[#9DB2BF]/30" />
                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <Skeleton className="h-20 w-full bg-[#9DB2BF]/30" />
                                            <Skeleton className="h-20 w-full bg-[#9DB2BF]/30" />
                                        </div>
                                        <Skeleton className="h-20 w-full bg-[#9DB2BF]/30" />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {!generating && notes && notes.notes && (
                            // Display existing notes
                            <Card className="bg-[#DDE6ED]">
                                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl font-semibold text-[#27374D]">Generated Notes</CardTitle>
                                        {notes.created_at && <CardDescription className="text-[#526D82] text-xs pt-1">Generated on: {new Date(notes.created_at).toLocaleString()}</CardDescription>}
                                    </div>
                                    {/* <Button
                                        onClick={handleGenerateNotes}
                                        disabled={generating} // Disable button while generating
                                        variant="outline"
                                        size="sm"
                                        className="bg-[#526D82] text-[#DDE6ED] hover:bg-[#9DB2BF] hover:text-[#27374D]"
                                    >
                                        {generating ? 'Generating...' : 'Regenerate'}
                                    </Button> */}
                                </CardHeader>
                                <CardContent className="pt-4">
                                    {/* Topic and Question */}
                                    <div className="mb-4 p-3 bg-[#9DB2BF] bg-opacity-20 rounded-md">
                                        <h3 className="mb-1 text-sm font-medium text-[#526D82] uppercase tracking-wider">Topic</h3>
                                        <p className="text-[#27374D] font-semibold">{notes.notes.topic}</p>
                                    </div>
                                    <div className="mb-6 p-3 bg-[#9DB2BF] bg-opacity-20 rounded-md">
                                        <h3 className="mb-1 text-sm font-medium text-[#526D82] uppercase tracking-wider">Question Summary</h3>
                                        <p className="text-[#27374D] whitespace-pre-wrap">{notes.notes.question}</p>
                                    </div>

                                    {/* Nested Tabs for Note Sections */}
                                    <Tabs defaultValue="intuition" className="w-full">
                                        <TabsList className="w-full mb-4 bg-[#9DB2BF]/20 grid grid-cols-3 sm:grid-cols-6 h-auto sm:h-10">
                                            <TabsTrigger value="intuition" className="data-[state=active]:bg-[#526D82]/30 data-[state=active]:text-[#27374D] text-[#3C5B6F]">Intuition</TabsTrigger>
                                            <TabsTrigger value="example" className="data-[state=active]:bg-[#526D82]/30 data-[state=active]:text-[#27374D] text-[#3C5B6F]">Example</TabsTrigger>
                                            <TabsTrigger value="counterexample" className="data-[state=active]:bg-[#526D82]/30 data-[state=active]:text-[#27374D] text-[#3C5B6F]">Counter</TabsTrigger>
                                            <TabsTrigger value="pseudocode" className="data-[state=active]:bg-[#526D82]/30 data-[state=active]:text-[#27374D] text-[#3C5B6F]">Pseudo</TabsTrigger>
                                            <TabsTrigger value="mistake" className="data-[state=active]:bg-[#526D82]/30 data-[state=active]:text-[#27374D] text-[#3C5B6F]">Possible Refinements</TabsTrigger>
                                            <TabsTrigger value="code" className="data-[state=active]:bg-[#526D82]/30 data-[state=active]:text-[#27374D] text-[#3C5B6F]">Code</TabsTrigger>
                                        </TabsList>

                                        {/* Content for each note section */}
                                        <TabsContent value="intuition" className="p-4 bg-[#9DB2BF]/10 rounded-md min-h-[100px]">
                                            <p className="text-[#27374D] whitespace-pre-wrap">{notes.notes.intuition || "Not generated."}</p>
                                        </TabsContent>
                                        <TabsContent value="example" className="p-4 bg-[#9DB2BF]/10 rounded-md min-h-[100px]">
                                            <pre className="p-3 bg-[#27374D]/10 rounded-md overflow-auto"><code className="text-[#27374D]">{notes.notes.example || "Not generated."}</code></pre>
                                        </TabsContent>
                                        <TabsContent value="counterexample" className="p-4 bg-[#9DB2BF]/10 rounded-md min-h-[100px]">
                                            <pre className="p-3 bg-[#27374D]/10 rounded-md overflow-auto"><code className="text-[#27374D]">{notes.notes.counterexample || "Not generated."}</code></pre>
                                        </TabsContent>
                                        <TabsContent value="pseudocode" className="p-4 bg-[#9DB2BF]/10 rounded-md min-h-[100px]">
                                            <pre className="p-3 bg-[#27374D]/10 rounded-md overflow-auto"><code className="text-[#27374D]">{notes.notes.pseudocode || "Not generated."}</code></pre>
                                        </TabsContent>
                                        <TabsContent value="mistake" className="p-4 bg-[#9DB2BF]/10 rounded-md min-h-[100px]">
                                            <p className="text-[#27374D] whitespace-pre-wrap">{notes.notes.mistake || "Not generated."}</p>
                                        </TabsContent>
                                        <TabsContent value="code" className="p-4 bg-[#9DB2BF]/10 rounded-md min-h-[100px]">
                                            <pre className="p-3 bg-[#27374D]/10 rounded-md overflow-auto"><code className="text-[#27374D]">{notes.notes.code || "Not generated."}</code></pre>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        )}

                        {!generating && !notes && (
                            // Display "Generate Notes" button if no notes exist
                            <Card className="bg-[#DDE6ED]">
                                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                    <Info className="w-12 h-12 text-[#526D82] mb-4" />
                                    <h3 className="mb-2 text-xl font-semibold text-[#27374D]">No Notes Yet</h3>
                                    <p className="mb-6 text-[#526D82]">Generate notes for this problem to get started.</p>
                                    <Button
                                        onClick={handleGenerateNotes}
                                        disabled={generating} // Disable button while generating
                                        className="px-6 py-2 bg-[#526D82] text-[#DDE6ED] hover:bg-[#27374D]"
                                    >
                                        {generating ? (
                                            <div className="w-5 h-5 border-2 border-[#DDE6ED] border-t-transparent rounded-full animate-spin mr-2"></div>
                                        ) : null}
                                        {generating ? 'Generating...' : 'Generate Notes'}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </main>
            {/* Toaster should ideally be in a top-level layout, but putting it here works too */}
            <Toaster />
        </div>
    );
};

export default Notes;