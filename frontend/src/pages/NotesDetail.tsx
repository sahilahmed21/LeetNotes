"use client"; // May be needed if using newer Next.js App Router, otherwise standard React

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom"; // Keep original routing imports
import { supabase } from "../supabase"; // Keep original Supabase import

// --- Shadcn/ui Imports from Example ---
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
// --- Icon Import ---
import { ArrowLeft } from "lucide-react";

// Define a more specific type based on original usage (optional but good practice)
interface NoteDetailData {
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
    // Include other fields returned by Supabase if needed, e.g., id, user_id, created_at
    id: string;
    problem_id: string;
    user_id: string;
    created_at: string;
}


const NotesDetail: React.FC = () => {
    // --- Original Hooks and State ---
    const { problemId } = useParams<{ problemId: string }>();
    const [note, setNote] = useState<NoteDetailData | null>(null); // Use more specific type
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Original Data Fetching Logic (useEffect) ---
    useEffect(() => {
        const fetchNote = async () => {
            setLoading(true);
            setError(null);
            setNote(null); // Reset note state on new fetch

            try {
                // Original session check
                const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !sessionData.session) {
                    setError("Please log in to view notes.");
                    // Optionally redirect to login here
                    return; // Exit fetch
                }

                const userId = sessionData.session.user.id;

                // Original Supabase query
                const { data, error: dbError } = await supabase
                    .from("notes") // Ensure this matches your table name
                    .select("*")
                    .eq("user_id", userId)
                    .eq("problem_id", problemId)
                    .single(); // Fetch a single record

                if (dbError) {
                    // Handle specific case of no rows found gracefully
                    if (dbError.code === 'PGRST116') { // PostgREST code for 'exactly one row expected, 0 rows found'
                        setError(null); // Not technically an error, just no data
                        setNote(null); // Explicitly set note to null
                    } else {
                        console.error("Error fetching note:", dbError);
                        setError(`Failed to fetch note: ${dbError.message}`);
                    }
                    return; // Exit fetch
                }

                setNote(data); // Set the fetched data

            } catch (err: any) {
                console.error("Fetch note error:", err);
                setError("An unexpected error occurred while fetching the note.");
            } finally {
                setLoading(false); // Ensure loading is set to false
            }
        };

        if (problemId) { // Only fetch if problemId is available
            fetchNote();
        } else {
            setError("Problem ID is missing.");
            setLoading(false);
        }

    }, [problemId]); // Keep dependency array

    // --- Apply Styled Loading State ---
    if (loading) {
        // Simple text loading state, can be replaced with Skeletons if preferred
        return (
            <div className="container mx-auto p-4 flex justify-center items-center min-h-[calc(100vh-200px)]">
                <p className="text-lg text-gray-500">Loading Note...</p>
                {/* Example using Skeleton (requires importing Skeleton)
                <Card className="w-full bg-[#DDE6ED]">
                    <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-10 w-full" /> // For TabsList
                        <Skeleton className="h-24 w-full" /> // For TabsContent
                    </CardContent>
                </Card>
                */}
            </div>
        );
    }

    // --- Apply Styled Error State ---
    if (error) {
        return (
            <div className="container mx-auto p-4 mt-10">
                {/* Use Button with Link for navigation */}
                <Button asChild variant="outline" className="mb-4 bg-[#526D82] text-[#3C5B6F] hover:bg-[#27374D] border-[#526D82]">
                    <Link to="/">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                    </Link>
                </Button>
                {/* Styled error message */}
                <Card className="bg-red-50 border border-red-200">
                    <CardHeader>
                        <CardTitle className="text-red-700">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-red-600">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // --- Apply Styled "Not Found" State ---
    if (!note) {
        return (
            <div className="container mx-auto p-4 mt-10">
                <Button asChild variant="outline" className="mb-4 bg-[#526D82] text-[#DDE6ED] hover:bg-[#27374D] border-[#526D82]">
                    <Link to="/">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                    </Link>
                </Button>
                <Card className="bg-yellow-50 border border-yellow-200">
                    <CardHeader>
                        <CardTitle className="text-yellow-800">Note Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-yellow-700">No note was found for this problem ID ({problemId}).</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // --- Render Note Detail using Example's Structure ---
    return (
        <div className="container mx-auto p-4"> {/* Add container for padding/centering */}
            {/* Back Link styled as Button */}
            <Button asChild variant="outline" className="mb-6 bg-[#526D82] text-[#DDE6ED] hover:bg-[#27374D] border-[#526D82]">
                <Link to="/">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                </Link>
            </Button>

            {/* Use Card structure from example */}
            <Card className="bg-[#DDE6ED]">
                <CardHeader className="pb-4"> {/* Adjust padding */}
                    {/* Use original note.title for the main title */}
                    <CardTitle className="text-2xl font-semibold text-[#27374D]">{note.title}</CardTitle>
                    {/* Optional: Add created date or other meta info here */}
                    {/* <p className="text-sm text-gray-500">Problem ID: {note.problem_id}</p> */}
                </CardHeader>
                <CardContent>
                    {/* Display Topic and Question outside Tabs, like example */}
                    <div className="mb-4">
                        <h3 className="mb-2 text-lg font-medium text-[#27374D]">Topic</h3>
                        {/* Access data via original note.notes.topic */}
                        <p className="p-3 bg-[#9DB2BF] bg-opacity-20 rounded-md text-[#27374D]">
                            {note.notes.topic}
                        </p>
                    </div>

                    <div className="mb-6">
                        <h3 className="mb-2 text-lg font-medium text-[#27374D]">Question</h3>
                        {/* Access data via original note.notes.question */}
                        <p className="p-3 bg-[#9DB2BF] bg-opacity-20 rounded-md text-[#27374D] whitespace-pre-wrap"> {/* Added pre-wrap */}
                            {note.notes.question}
                        </p>
                    </div>

                    {/* Use Tabs structure from example */}
                    <Tabs defaultValue="intuition" className="w-full">
                        {/* Use TabsList styling from example */}
                        <TabsList className="w-full mb-4 bg-[#9DB2BF] bg-opacity-20 grid grid-cols-3 sm:grid-cols-6 h-auto sm:h-10">
                            {/* Map original sections to TabsTriggers */}
                            <TabsTrigger value="intuition" className="flex-1 text-[#27374D]">Intuition</TabsTrigger>
                            <TabsTrigger value="example" className="flex-1 text-[#27374D]">Example</TabsTrigger>
                            <TabsTrigger value="counterexample" className="flex-1 text-[#27374D]">Counterexample</TabsTrigger>
                            <TabsTrigger value="pseudocode" className="flex-1 text-[#27374D]">Pseudocode</TabsTrigger>
                            <TabsTrigger value="mistake" className="flex-1 text-[#27374D]">Mistakes</TabsTrigger>
                            <TabsTrigger value="code" className="flex-1 text-[#27374D]">Code</TabsTrigger>
                        </TabsList>

                        {/* Map original sections to TabsContent, apply styling */}
                        <TabsContent value="intuition" className="p-4 bg-[#9DB2BF] bg-opacity-10 rounded-md min-h-[100px]"> {/* Added min-height */}
                            <p className="text-[#27374D] whitespace-pre-wrap">{note.notes.intuition}</p>
                        </TabsContent>

                        <TabsContent value="example" className="p-4 bg-[#9DB2BF] bg-opacity-10 rounded-md min-h-[100px]">
                            {/* Use pre/code, apply styling */}
                            <pre className="p-3 bg-[#27374D] bg-opacity-10 rounded-md overflow-auto">
                                <code className="text-[#27374D]">{note.notes.example}</code>
                            </pre>
                        </TabsContent>

                        <TabsContent value="counterexample" className="p-4 bg-[#9DB2BF] bg-opacity-10 rounded-md min-h-[100px]">
                            <pre className="p-3 bg-[#27374D] bg-opacity-10 rounded-md overflow-auto">
                                <code className="text-[#27374D]">{note.notes.counterexample}</code>
                            </pre>
                        </TabsContent>

                        <TabsContent value="pseudocode" className="p-4 bg-[#9DB2BF] bg-opacity-10 rounded-md min-h-[100px]">
                            <pre className="p-3 bg-[#27374D] bg-opacity-10 rounded-md overflow-auto">
                                <code className="text-[#27374D]">{note.notes.pseudocode}</code>
                            </pre>
                        </TabsContent>

                        <TabsContent value="mistake" className="p-4 bg-[#9DB2BF] bg-opacity-10 rounded-md min-h-[100px]">
                            <p className="text-[#27374D] whitespace-pre-wrap">{note.notes.mistake}</p>
                        </TabsContent>

                        <TabsContent value="code" className="p-4 bg-[#9DB2BF] bg-opacity-10 rounded-md min-h-[100px]">
                            <pre className="p-3 bg-[#27374D] bg-opacity-10 rounded-md overflow-auto">
                                <code className="text-[#27374D]">{note.notes.code}</code>
                            </pre>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default NotesDetail;