import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import axios from "axios";

const Notes: React.FC = () => {
    const { problemId } = useParams<{ problemId: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [problem, setProblem] = useState<any>(null);
    const [notes, setNotes] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const validateAndSetSession = async () => {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData.session) {
                navigate("/login");
                return;
            }

            setUser(sessionData.session.user);
            fetchProblemAndNotes(sessionData.session.user.id);
        };

        validateAndSetSession();
    }, [problemId, navigate]);

    const fetchProblemAndNotes = async (userId: string) => {
        setLoading(true);
        setError(null);

        // Fetch problem details
        const { data: problemData, error: problemError } = await supabase
            .from("problems")
            .select("*, submissions(*)")
            .eq("id", problemId)
            .eq("user_id", userId)
            .single();

        if (problemError || !problemData) {
            console.error("Error fetching problem:", problemError);
            setError("Failed to fetch problem details");
            setLoading(false);
            return;
        }
        setProblem(problemData);

        // Fetch existing notes
        const { data: notesData, error: notesError } = await supabase
            .from("notes")
            .select("*")
            .eq("problem_id", problemId)
            .eq("user_id", userId)
            .single();

        if (notesError && notesError.code !== "PGRST116") { // PGRST116 means no rows found
            console.error("Error fetching notes:", notesError);
            setError("Failed to fetch notes");
            setLoading(false);
            return;
        }
        setNotes(notesData || null);
        setLoading(false);
    };

    const handleGenerateNotes = async () => {
        if (!user || !problem) {
            setError("User or problem not found. Please try again.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData.session) {
                setError("Failed to retrieve session. Please log in again.");
                navigate("/login");
                return;
            }

            const token = sessionData.session.access_token;
            const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:3000";

            const { data } = await axios.post(
                `${backendUrl}/api/generate-notes/${problemId}`,
                {},
                {
                    headers: {
                        "x-user-id": user.id,
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setNotes(data);
        } catch (err: any) {
            console.error("Generate notes error:", err);
            setError(err.response?.data?.error || "Failed to generate notes");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="notes-page">
            <h2>Notes for Problem</h2>
            {loading && <p>Loading...</p>}
            {error && <p className="error">{error}</p>}
            {problem && (
                <div className="problem-details">
                    <h3>{problem.title}</h3>
                    <p><strong>Difficulty:</strong> {problem.difficulty}</p>
                    <p><strong>Description:</strong> {problem.description}</p>
                    <p><strong>Tags:</strong> {problem.tags.join(", ")}</p>
                    <h4>Submissions:</h4>
                    {problem.submissions.map((submission: any) => (
                        <div key={submission.id} className="submission">
                            <p><strong>Status:</strong> {submission.status}</p>
                            <p><strong>Language:</strong> {submission.language}</p>
                            <p><strong>Runtime:</strong> {submission.runtime}</p>
                            <p><strong>Memory:</strong> {submission.memory}</p>
                            <pre>{submission.code}</pre>
                        </div>
                    ))}
                </div>
            )}
            <div className="generate-notes">
                <button onClick={handleGenerateNotes} disabled={loading}>
                    {loading ? "Generating..." : "Generate Notes"}
                </button>
            </div>
            {notes && (
                <div className="notes-content">
                    <h3>Generated Notes</h3>
                    <p><strong>Topic:</strong> {notes.notes.topic}</p>
                    <p><strong>Question:</strong> {notes.notes.question}</p>
                    <p><strong>Intuition:</strong> {notes.notes.intuition}</p>
                    <p><strong>Example:</strong> {notes.notes.example}</p>
                    <p><strong>Counterexample:</strong> {notes.notes.counterexample}</p>
                    <p><strong>Pseudocode:</strong> <pre>{notes.notes.pseudocode}</pre></p>
                    <p><strong>Mistake I Did:</strong> {notes.notes.mistake}</p>
                    <p><strong>Code:</strong> <pre>{notes.notes.code}</pre></p>
                </div>
            )}
            <button onClick={() => navigate("/")} className="back-btn">
                Back to Home
            </button>
        </div>
    );
};

export default Notes;