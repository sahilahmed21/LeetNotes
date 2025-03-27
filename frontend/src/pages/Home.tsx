import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import Login from "../components/Login";
import FetchForm from "../components/FetchForm";
import NotesDisplay from "../components/NotesDisplay";
import axios from "axios";
import { Note, LeetCodeData } from "../types";

const Home: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [notes, setNotes] = useState<Note[]>([]);
    const [profileStats, setProfileStats] = useState<any>(null);
    const [problems, setProblems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const validateAndSetSession = async () => {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            console.log("Initial Session Data:", sessionData);
            console.log("Initial Session Error:", sessionError);

            if (sessionError || !sessionData.session) {
                console.warn("No session found. Redirecting to login...");
                setUser(null);
                return;
            }

            setUser(sessionData.session.user);
            fetchUserData(sessionData.session.user.id);
        };

        validateAndSetSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth State Changed:", event, session);
            if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                setUser(session?.user || null);
                if (session?.user) {
                    fetchUserData(session.user.id);
                }
            } else if (event === "SIGNED_OUT") {
                setUser(null);
                setNotes([]);
                setProfileStats(null);
                setProblems([]);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const fetchUserData = async (userId: string) => {
        // Fetch profile stats
        const { data: statsData, error: statsError } = await supabase
            .from("profile_stats")
            .select("*")
            .eq("user_id", userId);

        if (statsError) {
            console.error("Error fetching profile stats:", statsError);
            setError("Failed to fetch profile stats");
            return;
        }

        // If no profile stats exist, set to null or create a default row
        if (!statsData || statsData.length === 0) {
            console.log("No profile stats found for user:", userId);
            setProfileStats(null);
        } else {
            setProfileStats(statsData[0]); // Take the first row if it exists
        }

        // Fetch problems and submissions
        const { data: problemsData, error: problemsError } = await supabase
            .from("problems")
            .select("*, submissions(*)")
            .eq("user_id", userId);

        if (problemsError) {
            console.error("Error fetching problems:", problemsError);
            setError("Failed to fetch problems");
            return;
        }
        setProblems(problemsData || []);
    };

    const handleGenerateNotes = async () => {
        if (!user) {
            setError("No user logged in. Please log in again.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            console.log("Generate Notes Session Data:", sessionData);
            console.log("Generate Notes Session Error:", sessionError);

            if (sessionError || !sessionData.session) {
                console.error("Session missing during generate notes. Redirecting to login...");
                setError("Failed to retrieve session. Please log in again.");
                setUser(null);
                setLoading(false);
                return;
            }

            const token = sessionData.session.access_token;

            const { data } = await axios.post(
                "http://localhost:3000/api/generate-notes",
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

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setNotes([]);
        setProfileStats(null);
        setProblems([]);
    };

    return (
        <div className="home">
            {!user ? (
                <Login onLogin={(user) => setUser(user)} />
            ) : (
                <>
                    <div className="header">
                        <h2>Welcome, {user.email}</h2>
                        <button onClick={handleLogout}>Logout</button>
                    </div>
                    <FetchForm userId={user.id} onFetch={handleGenerateNotes} />
                    <div className="generate-notes">
                        <button onClick={handleGenerateNotes} disabled={loading}>
                            {loading ? "Generating..." : "Generate Notes"}
                        </button>
                        {error && <p className="error">{error}</p>}
                    </div>
                    {profileStats && (
                        <div className="profile-stats">
                            <h3>Profile Stats</h3>
                            <p>Total Solved: {profileStats.total_solved}</p>
                            <p>Easy: {profileStats.easy}</p>
                            <p>Medium: {profileStats.medium}</p>
                            <p>Hard: {profileStats.hard}</p>
                        </div>
                    )}
                    {problems.length > 0 && (
                        <div className="problems-list">
                            <h3>Problems</h3>
                            {problems.map((problem) => (
                                <div key={problem.id} className="problem">
                                    <h4>{problem.title}</h4>
                                    <p><strong>Difficulty:</strong> {problem.difficulty}</p>
                                    <p><strong>Description:</strong> {problem.description}</p>
                                    <p><strong>Tags:</strong> {problem.tags.join(", ")}</p>
                                    <h5>Submissions:</h5>
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
                            ))}
                        </div>
                    )}
                    <NotesDisplay notes={notes} />
                </>
            )}
        </div>
    );
};

export default Home;