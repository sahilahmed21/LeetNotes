"use client";

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabase";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ArrowLeft } from "lucide-react";

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
    id: string;
    problem_id: string;
    user_id: string;
    created_at: string;
}

const NotesDetail: React.FC = () => {
    const { problemId } = useParams<{ problemId: string }>();
    const [note, setNote] = useState<NoteDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchNote = async () => {
            setLoading(true);
            setError(null);
            setNote(null);

            try {
                const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !sessionData.session) {
                    setError("Please log in to view notes.");
                    return;
                }

                const userId = sessionData.session.user.id;
                const { data, error: dbError } = await supabase
                    .from("notes")
                    .select("*")
                    .eq("user_id", userId)
                    .eq("problem_id", problemId)
                    .single();

                if (dbError) {
                    if (dbError.code === 'PGRST116') {
                        setError(null);
                        setNote(null);
                    } else {
                        setError(`Failed to fetch note: ${dbError.message}`);
                    }
                    return;
                }

                setNote(data);
            } catch (err: any) {
                setError("An unexpected error occurred while fetching the note.");
            } finally {
                setLoading(false);
            }
        };

        if (problemId) {
            fetchNote();
        } else {
            setError("Problem ID is missing.");
            setLoading(false);
        }
    }, [problemId]);

    if (loading) {
        return (
            <div className="container mx-auto p-4 flex justify-center items-center min-h-[calc(100vh-200px)]">
                <p className="text-lg text-gray-500">Loading Note...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-4 mt-10">
                <Button asChild variant="outline" className="mb-4 bg-[#526D82] text-[#DDE6ED] hover:bg-[#27374D] border-[#526D82]">
                    <Link to="/home">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                    </Link>
                </Button>
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

    if (!note) {
        return (
            <div className="container mx-auto p-4 mt-10">
                <Button asChild variant="outline" className="mb-4 bg-[#526D82] text-[#DDE6ED] hover:bg-[#27374D] border-[#526D82]">
                    <Link to="/home">
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

    return (
        <div className="container mx-auto p-4">
            <Button asChild variant="outline" className="mb-6 bg-[#526D82] text-[#DDE6ED] hover:bg-[#27374D] border-[#526D82]">
                <Link to="/home">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                </Link>
            </Button>

            <Card className="bg-[#DDE6ED]">
                <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-semibold text-[#27374D]">{note.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <h3 className="mb-2 text-lg font-medium text-[#27374D]">Topic</h3>
                        <p className="p-3 bg-[#9DB2BF] bg-opacity-20 rounded-md text-[#27374D]">
                            {note.notes.topic}
                        </p>
                    </div>

                    <div className="mb-6">
                        <h3 className="mb-2 text-lg font-medium text-[#27374D]">Question</h3>
                        <p className="p-3 bg-[#9DB2BF] bg-opacity-20 rounded-md text-[#27374D] whitespace-pre-wrap">
                            {note.notes.question}
                        </p>
                    </div>

                    <Tabs defaultValue="intuition" className="w-full">
                        <TabsList className="w-full mb-4 bg-[#9DB2BF] bg-opacity-20 grid grid-cols-3 sm:grid-cols-6 h-auto sm:h-10">
                            <TabsTrigger value="intuition" className="flex-1 text-[#27374D]">Intuition</TabsTrigger>
                            <TabsTrigger value="example" className="flex-1 text-[#27374D]">Example</TabsTrigger>
                            <TabsTrigger value="counterexample" className="flex-1 text-[#27374D]">Counterexample</TabsTrigger>
                            <TabsTrigger value="pseudocode" className="flex-1 text-[#27374D]">Pseudocode</TabsTrigger>
                            <TabsTrigger value="mistake" className="flex-1 text-[#27374D]">Possible Refinements</TabsTrigger>
                            <TabsTrigger value="code" className="flex-1 text-[#27374D]">Code</TabsTrigger>
                        </TabsList>

                        <TabsContent value="intuition" className="p-4 bg-[#9DB2BF] bg-opacity-10 rounded-md min-h-[100px]">
                            <p className="text-[#27374D] whitespace-pre-wrap">{note.notes.intuition}</p>
                        </TabsContent>
                        <TabsContent value="example" className="p-4 bg-[#9DB2BF] bg-opacity-10 rounded-md min-h-[100px]">
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