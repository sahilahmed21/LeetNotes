"use client"; // Required for potential future client-side interactions within Tabs, though not strictly needed for just displaying static content

import React from "react";
import { Note } from "../types"; // Keep original type import

// --- Shadcn/ui Imports from Example ---
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

// Keep original props interface
interface NotesDisplayProps {
    notes: Note[];
}

const NotesDisplay: React.FC<NotesDisplayProps> = ({ notes }) => {
    // --- Original Empty State Logic ---
    if (!notes || notes.length === 0) {
        // --- Apply Example's Styling for Empty State ---
        return (
            <Card className="bg-[#DDE6ED] mt-4"> {/* Added margin-top for spacing */}
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    {/* Use original text */}
                    <p className="text-lg text-[#27374D]">
                        No notes available. Generate notes to see them here.
                    </p>
                </CardContent>
            </Card>
        );
    }

    // --- Original Logic: Map Over Notes ---
    // --- Apply Example's Card and Tabs Structure for *each* note ---
    return (
        <div className="space-y-6 notes-display"> {/* Add spacing between note cards */}
            {/* <h3>Generated Notes</h3> */} {/* Optional: Can keep this heading outside the loop if desired */}
            {notes.map((note, index) => (
                // Use Card for each note, apply example styling
                <Card key={note.title || index} className="bg-[#3C5B6F]"> {/* Use original title for key, fallback to index */}
                    {/* <CardHeader className="pb-2"> */}
                    {/* Optional: Could place note.title or topic here if needed */}
                    {/* <CardTitle className="text-xl font-semibold text-[#27374D]">{note.notes.topic}</CardTitle> */}
                    {/* </CardHeader> */}
                    <CardContent className="pt-6"> {/* Add padding-top if removing CardHeader */}
                        {/* Display Topic and Question outside Tabs, similar to example */}
                        <div className="mb-4">
                            <h3 className="mb-2 text-lg font-medium text-[#27374D]">Topic</h3>
                            {/* Style like example's paragraphs */}
                            <p className="p-3 bg-[#9DB2BF] bg-opacity-20 rounded-md text-[#27374D]">
                                {note.notes.topic}
                            </p>
                        </div>

                        <div className="mb-6"> {/* Increased bottom margin */}
                            <h3 className="mb-2 text-lg font-medium text-[#27374D]">Question</h3>
                            {/* Style like example's paragraphs */}
                            <p className="p-3 bg-[#9DB2BF] bg-opacity-20 rounded-md text-[#27374D]">
                                {note.notes.question}
                            </p>
                        </div>

                        {/* Use Tabs for the rest of the note content */}
                        <Tabs defaultValue="intuition" className="w-full">
                            {/* Use TabsList styling from example */}
                            <TabsList className="w-full mb-4 bg-[#9DB2BF] bg-opacity-20 grid grid-cols-3 sm:grid-cols-6 h-auto sm:h-10"> {/* Adjusted grid for responsiveness */}
                                {/* Use TabsTrigger styling from example, map original sections */}
                                <TabsTrigger value="intuition" className="flex-1 text-[#27374D]">Intuition</TabsTrigger>
                                <TabsTrigger value="example" className="flex-1 text-[#27374D]">Example</TabsTrigger>
                                <TabsTrigger value="counterexample" className="flex-1 text-[#27374D]">Counterexample</TabsTrigger>
                                <TabsTrigger value="pseudocode" className="flex-1 text-[#27374D]">Pseudocode</TabsTrigger>
                                <TabsTrigger value="mistake" className="flex-1 text-[#27374D]">Possible Refinements</TabsTrigger>
                                <TabsTrigger value="code" className="flex-1 text-[#27374D]">Code</TabsTrigger>
                            </TabsList>

                            {/* Map original note sections to TabsContent, apply example styling */}
                            <TabsContent value="intuition" className="p-4 bg-[#9DB2BF] bg-opacity-10 rounded-md">
                                <p className="text-[#27374D] whitespace-pre-wrap">{note.notes.intuition}</p> {/* Added whitespace-pre-wrap for formatting */}
                            </TabsContent>

                            <TabsContent value="example" className="p-4 bg-[#9DB2BF] bg-opacity-10 rounded-md">
                                {/* Use pre/code like original, apply example styling */}
                                <pre className="p-3 bg-[#27374D] bg-opacity-10 rounded-md overflow-auto">
                                    <code className="text-[#27374D]">{note.notes.example}</code>
                                </pre>
                            </TabsContent>

                            <TabsContent value="counterexample" className="p-4 bg-[#9DB2BF] bg-opacity-10 rounded-md">
                                <pre className="p-3 bg-[#27374D] bg-opacity-10 rounded-md overflow-auto">
                                    <code className="text-[#27374D]">{note.notes.counterexample}</code>
                                </pre>
                            </TabsContent>

                            <TabsContent value="pseudocode" className="p-4 bg-[#9DB2BF] bg-opacity-10 rounded-md">
                                <pre className="p-3 bg-[#27374D] bg-opacity-10 rounded-md overflow-auto">
                                    <code className="text-[#27374D]">{note.notes.pseudocode}</code>
                                </pre>
                            </TabsContent>

                            <TabsContent value="mistake" className="p-4 bg-[#9DB2BF] bg-opacity-10 rounded-md">
                                <p className="text-[#27374D] whitespace-pre-wrap">{note.notes.mistake}</p> {/* Added whitespace-pre-wrap */}
                            </TabsContent>

                            <TabsContent value="code" className="p-4 bg-[#9DB2BF] bg-opacity-10 rounded-md">
                                <pre className="p-3 bg-[#27374D] bg-opacity-10 rounded-md overflow-auto">
                                    <code className="text-[#27374D]">{note.notes.code}</code>
                                </pre>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default NotesDisplay;