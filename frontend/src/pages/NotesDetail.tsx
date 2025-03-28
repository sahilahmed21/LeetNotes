import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabase";

const NotesDetail: React.FC = () => {
    const { problemId } = useParams<{ problemId: string }>();
    const [note, setNote] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchNote = async () => {
            setLoading(true);
            setError(null);

            try {
                const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !sessionData.session) {
                    setError("Please log in to view notes.");
                    setLoading(false);
                    return;
                }

                const userId = sessionData.session.user.id;
                const { data, error } = await supabase
                    .from("notes")
                    .select("*")
                    .eq("user_id", userId)
                    .eq("problem_id", problemId)
                    .single();

                if (error) {
                    console.error("Error fetching note:", error);
                    setError("Failed to fetch note");
                    setLoading(false);
                    return;
                }

                setNote(data);
            } catch (err: any) {
                console.error("Fetch note error:", err);
                setError("Failed to fetch note");
            } finally {
                setLoading(false);
            }
        };

        fetchNote();
    }, [problemId]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!note) {
        return <div>No note found for this problem.</div>;
    }

    return (
        <div className="notes-detail">
            <Link to="/" className="back-link">Back to Home</Link>
            <h2>{note.title}</h2>
            <div className="note-content">
                <div className="note-section">
                    <h3>Topic</h3>
                    <p>{note.notes.topic}</p>
                </div>
                <div className="note-section">
                    <h3>Question</h3>
                    <p>{note.notes.question}</p>
                </div>
                <div className="note-section">
                    <h3>Intuition</h3>
                    <p>{note.notes.intuition}</p>
                </div>
                <div className="note-section">
                    <h3>Example</h3>
                    <p>{note.notes.example}</p>
                </div>
                <div className="note-section">
                    <h3>Counterexample</h3>
                    <p>{note.notes.counterexample}</p>
                </div>
                <div className="note-section">
                    <h3>Pseudocode</h3>
                    <pre>{note.notes.pseudocode}</pre>
                </div>
                <div className="note-section">
                    <h3>Mistake I Did</h3>
                    <p>{note.notes.mistake}</p>
                </div>
                <div className="note-section">
                    <h3>Code</h3>
                    <pre>{note.notes.code}</pre>
                </div>
            </div>
        </div>
    );
};

export default NotesDetail;