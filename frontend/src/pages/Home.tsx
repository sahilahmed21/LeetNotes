"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import Login from "../components/Login";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";

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

interface ProfileStatsData {
    user_id: string;
    total_solved: number;
    easy: number;
    medium: number;
    hard: number;
}

const Home: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [profileStats, setProfileStats] = useState<ProfileStatsData | null>(null);
    const [problems, setProblems] = useState<ProblemData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const validateAndSetSession = async () => {
            setLoading(true);
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData.session) {
                setUser(null);
                setLoading(false);
                return;
            }

            setUser(sessionData.session.user);
            await fetchUserData(sessionData.session.user.id);
            setLoading(false);
        };

        validateAndSetSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                if (currentUser) {
                    fetchUserData(currentUser.id);
                }
            } else if (event === "SIGNED_OUT") {
                setProfileStats(null);
                setProblems([]);
                setError(null);
                setLoading(false);
                navigate("/login");
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [navigate]);

    const fetchUserData = async (userId: string) => {
        setLoading(true);
        setError(null);

        try {
            const { data: statsData, error: statsError } = await supabase
                .from("profile_stats")
                .select("*")
                .eq("user_id", userId)
                .maybeSingle();

            if (statsError) {
                setError("Failed to fetch profile stats.");
                setLoading(false);
                return;
            }
            setProfileStats(statsData);

            const { data: problemsData, error: problemsError } = await supabase
                .from("problems")
                .select("*, submissions(*)")
                .eq("user_id", userId);

            if (problemsError) {
                setError("Failed to fetch problems.");
                setProblems([]);
                setLoading(false);
                return;
            }

            setProblems(problemsData || []);
        } catch (err) {
            setError("An unexpected error occurred.");
            setProblems([]);
            setProfileStats(null);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signOut();
        if (error) {
            setError("Failed to log out.");
        }
        setLoading(false);
    };

    if (!user) {
        return <Login onLogin={(loggedInUser) => setUser(loggedInUser)} />;
    }

    return (
        <div className="min-h-screen bg-[#27374D]">
            <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-[#27374D] shadow-md">
                <h1 className="text-2xl font-bold text-[#DDE6ED]">LeetNotes</h1>
                <div className="flex gap-2">
                    <Button
                        asChild
                        variant="secondary"
                        className="bg-[#526D82] text-[#DDE6ED] hover:bg-[#9DB2BF] hover:text-[#27374D]"
                    >
                        <Link to="/fetch">Fetch Data</Link>
                    </Button>
                    <Button
                        onClick={handleLogout}
                        variant="secondary"
                        className="bg-[#526D82] text-[#DDE6ED] hover:bg-[#9DB2BF] hover:text-[#27374D]"
                        disabled={loading}
                    >
                        Logout
                    </Button>
                </div>
            </header>

            <main className="container px-4 py-8 mx-auto">
                <section className="mb-6">
                    <h2 className="mb-4 text-xl font-semibold text-[#9DB2BF]">Welcome, {user.email}</h2>
                </section>

                <Separator className="my-8 bg-[#526D82]" />

                <section className="mb-8">
                    <h2 className="mb-4 text-xl font-semibold text-[#9DB2BF]">Your Stats</h2>
                    {loading && !profileStats && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[...Array(4)].map((_, i) => (
                                <Card key={i} className="bg-[#3C5B6F]">
                                    <CardContent className="pt-6">
                                        <Skeleton className="w-3/4 h-6 mb-2" />
                                        <Skeleton className="w-1/2 h-8" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                    {!loading && !profileStats && !error && (
                        <Card className="bg-[#526D82]">
                            <CardContent className="pt-6">
                                <p className="text-center text-[#DDE6ED]">No stats available. Fetch data to see your stats.</p>
                            </CardContent>
                        </Card>
                    )}
                    {profileStats && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Card className="bg-[#DDE6ED]">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-medium text-[#27374D]">Total Solved</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold text-[#526D82]">{profileStats.total_solved}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-[#DDE6ED]">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-medium text-[#27374D]">Easy</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold text-green-500">{profileStats.easy}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-[#DDE6ED]">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-medium text-[#27374D]">Medium</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold text-yellow-500">{profileStats.medium}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-[#DDE6ED]">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-medium text-[#27374D]">Hard</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold text-red-500">{profileStats.hard}</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </section>

                <Separator className="my-8 bg-[#526D82]" />

                <section>
                    <h2 className="mb-4 text-xl font-semibold text-[#9DB2BF]">Your Problems</h2>
                    {error && <div className="p-4 mb-4 text-red-800 bg-red-100 rounded-md">{error}</div>}
                    {loading && problems.length === 0 && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {[...Array(6)].map((_, i) => (
                                <Card key={i} className="overflow-hidden bg-[#DDE6ED]">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <Skeleton className="h-6 w-3/4" />
                                            <Skeleton className="h-6 w-16 rounded-full" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pb-4">
                                        <Skeleton className="h-4 mb-3 w-full" />
                                        <Skeleton className="h-4 mb-3 w-5/6" />
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <Skeleton className="h-4 w-16 rounded-full" />
                                            <Skeleton className="h-4 w-16 rounded-full" />
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Skeleton className="h-9 w-full" />
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                    {!loading && problems.length === 0 && !error && (
                        <Card className="p-8 text-center bg-[#526D82]">
                            <CardContent className="pt-6">
                                <p className="text-[#DDE6ED]">No problems found. Fetch your LeetCode data to see problems here.</p>
                            </CardContent>
                        </Card>
                    )}
                    {!loading && problems.length > 0 && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {problems.map((problem) => {
                                const difficultyVariant = (difficulty: string): "outline" | "secondary" | "destructive" | "default" => {
                                    switch (difficulty?.toLowerCase()) {
                                        case 'easy': return 'default';
                                        case 'medium': return 'secondary';
                                        case 'hard': return 'destructive';
                                        default: return 'outline';
                                    }
                                };
                                const difficultyClass = (difficulty: string): string => {
                                    switch (difficulty?.toLowerCase()) {
                                        case 'easy': return 'bg-green-100 text-green-800 border-green-300';
                                        case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                                        case 'hard': return 'bg-red-100 text-red-800 border-red-300';
                                        default: return 'bg-gray-100 text-gray-800 border-gray-300';
                                    }
                                };

                                return (
                                    <Card key={problem.id} className="flex flex-col overflow-hidden bg-[#DDE6ED] hover:shadow-lg transition-shadow">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <CardTitle className="text-lg font-semibold text-[#27374D] hover:text-[#27374D]/80" title={problem.title}>
                                                    <Link to={`/notes/${problem.id}`} className="hover:underline">
                                                        {problem.title}
                                                    </Link>
                                                </CardTitle>
                                                <Badge
                                                    variant={difficultyVariant(problem.difficulty)}
                                                    className={`flex-shrink-0 ${difficultyClass(problem.difficulty)}`}
                                                >
                                                    {problem.difficulty}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-grow pb-3">
                                            <p className="mb-3 text-sm text-[#526D82] line-clamp-2">{problem.description || "No description available."}</p>
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {(problem.tags || []).map((tag, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs bg-[#526D82] bg-opacity-50 text-[#3C5B6F] border-[#526D82]/60">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-0">
                                            <Button asChild className="w-full bg-[#526D82] text-[#DDE6ED] hover:bg-[#9DB2BF] hover:text-[#27374D]">
                                                <Link to={`/notes/${problem.id}`}>View Notes</Link>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default Home;