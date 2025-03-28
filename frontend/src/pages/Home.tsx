import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import Login from "../components/Login";
import FetchForm from "../components/FetchForm";
import { Link } from "react-router-dom";

const Home: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [profileStats, setProfileStats] = useState<any>(null);
    const [problems, setProblems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const validateAndSetSession = async () => {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData.session) {
                setUser(null);
                return;
            }

            setUser(sessionData.session.user);
            fetchUserData(sessionData.session.user.id);
        };

        validateAndSetSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                setUser(session?.user || null);
                if (session?.user) {
                    fetchUserData(session.user.id);
                }
            } else if (event === "SIGNED_OUT") {
                setUser(null);
                setProfileStats(null);
                setProblems([]);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const fetchUserData = async (userId: string) => {
        setLoading(true);
        setError(null);

        // Fetch profile stats
        const { data: statsData, error: statsError } = await supabase
            .from("profile_stats")
            .select("*")
            .eq("user_id", userId);

        if (statsError) {
            console.error("Error fetching profile stats:", statsError);
            setError("Failed to fetch profile stats");
            setLoading(false);
            return;
        }

        if (!statsData || statsData.length === 0) {
            setProfileStats(null);
        } else {
            setProfileStats(statsData[0]);
        }

        // Fetch problems and submissions
        const { data: problemsData, error: problemsError } = await supabase
            .from("problems")
            .select("*, submissions(*)")
            .eq("user_id", userId);

        if (problemsError) {
            console.error("Error fetching problems:", problemsError);
            setError("Failed to fetch problems");
            setLoading(false);
            return;
        }
        setProblems(problemsData || []);
        setLoading(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
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
                    <FetchForm userId={user.id} onFetch={() => fetchUserData(user.id)} />
                    {error && <p className="error">{error}</p>}
                    {loading && <p>Loading...</p>}
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
                            <h3>Your Problems</h3>
                            {problems.map((problem) => (
                                <div key={problem.id} className="problem-card">
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
                                    <Link to={`/notes/${problem.id}`} className="view-notes-btn">
                                        View Notes
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Home;