"use client";

import React, { useState, useEffect, useMemo } from "react"; // Import useMemo
import { supabase } from "../supabase";
import Login from "../components/Login"; // Adjust path if needed
import { Link, useNavigate } from "react-router-dom";
// Import necessary UI components
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { Input } from "../components/ui/input"; // Import Input for search

// Interfaces (keep as is)
interface Submission { /* ... */ }
interface ProblemData {
    id: string;
    title: string;
    difficulty: "Easy" | "Medium" | "Hard" | string;
    description: string;
    tags: string[];
    submissions: Submission[];
    user_id: string;
    fetch_order?: number; // Include if using fetch_order method
}
interface ProfileStatsData { /* ... */ }

const Home: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [profileStats, setProfileStats] = useState<ProfileStatsData | null>(null);
    const [problems, setProblems] = useState<ProblemData[]>([]); // Holds ALL fetched problems
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // --- State for Filtering ---
    const [searchTerm, setSearchTerm] = useState(""); // For title search
    const [selectedTags, setSelectedTags] = useState<string[]>([]); // For tag filtering
    const [filteredProblems, setFilteredProblems] = useState<ProblemData[]>([]); // Holds filtered results

    // --- Fetching Logic (useEffect) ---
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
            // Fetch data only after user is confirmed
            // fetchUserData is called inside onAuthStateChange or here if needed initially
            if (sessionData.session.user) {
                await fetchUserData(sessionData.session.user.id);
            }
            setLoading(false);
        };

        validateAndSetSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                if (currentUser) {
                    fetchUserData(currentUser.id); // Fetch data on sign-in/refresh
                }
            } else if (event === "SIGNED_OUT") {
                setProfileStats(null);
                setProblems([]);
                setFilteredProblems([]); // Clear filtered problems on sign out
                setError(null);
                setLoading(false);
                navigate("/login"); // Or your login route
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [navigate]); // Add navigate to dependency array

    // Fetch user stats and problems
    const fetchUserData = async (userId: string) => {
        setLoading(true);
        setError(null);
        setProblems([]); // Clear previous problems
        setFilteredProblems([]); // Clear filtered problems

        try {
            // Fetch Stats (keep as is)
            const { data: statsData, error: statsError } = await supabase
                .from("profile_stats").select("*").eq("user_id", userId).maybeSingle();
            if (statsError) { console.error("Stats fetch error:", statsError); /* Optionally set error */ }
            setProfileStats(statsData);

            // Fetch Problems with ordering
            const { data: problemsData, error: problemsError } = await supabase
                .from("problems")
                .select("*, submissions(*)") // Keep submissions if needed elsewhere, otherwise simplify select
                .eq("user_id", userId)
                // *** APPLY ORDERING HERE (Choose one) ***
                // Option 1: Order by creation time (approximates fetch order)
                .order('created_at', { ascending: false }); // false = newest first
            // Option 2: Order by explicit fetch_order column (if added)
            // .order('fetch_order', { ascending: true });

            if (problemsError) { throw problemsError; }

            setProblems(problemsData || []);
            // Initially, filtered problems are all problems
            setFilteredProblems(problemsData || []);

        } catch (err: any) {
            console.error("Error fetching user data:", err);
            setError("Failed to fetch user data.");
            setProblems([]);
            setFilteredProblems([]);
            setProfileStats(null);
        } finally {
            setLoading(false);
        }
    };

    // --- Filtering Logic (useEffect) ---
    useEffect(() => {
        let result = problems;

        // 1. Filter by Search Term (Title)
        if (searchTerm) {
            result = result.filter(problem =>
                problem.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 2. Filter by Selected Tags
        if (selectedTags.length > 0) {
            result = result.filter(problem =>
                selectedTags.every(tag => problem.tags?.includes(tag)) // Check if problem.tags includes ALL selected tags
            );
        }

        setFilteredProblems(result);
    }, [searchTerm, selectedTags, problems]); // Re-run filter when search, tags, or base problems change


    // --- Get Unique Tags for Filter UI ---
    const uniqueTags = useMemo(() => {
        const allTags = problems.flatMap(p => p.tags || []);
        return Array.from(new Set(allTags)).sort(); // Get unique tags and sort alphabetically
    }, [problems]);


    // --- Tag Click Handler ---
    const handleTagClick = (tag: string) => {
        setSelectedTags(prevTags =>
            prevTags.includes(tag)
                ? prevTags.filter(t => t !== tag) // Remove tag if already selected
                : [...prevTags, tag] // Add tag if not selected
        );
    };

    // --- Logout Handler (keep as is) ---
    const handleLogout = async () => { /* ... */ };

    // --- Conditional Rendering for Login (keep as is) ---
    if (!user && !loading) { // Show login only if not logged in AND not initially loading session
        return <Login onLogin={(loggedInUser) => setUser(loggedInUser)} />;
    }
    // --- End Conditional Rendering ---


    // --- Main Component JSX ---
    return (
        <div className="min-h-screen bg-[#27374D]">
            {/* Header (keep as is) */}
            <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-[#27374D] shadow-md">
                <h1 className="text-2xl font-bold text-[#DDE6ED]">LeetNotes</h1>
                <div className="flex gap-2">
                    <Button asChild variant="secondary" className="...">
                        <Link to="/fetch">Fetch Data</Link>
                    </Button>
                    <Button onClick={handleLogout} variant="secondary" className="..." disabled={loading}>
                        Logout
                    </Button>
                </div>
            </header>

            <main className="container px-4 py-8 mx-auto">
                {/* Welcome Section (keep as is) */}
                {user && (
                    <section className="mb-6">
                        <h2 className="mb-4 text-xl font-semibold text-[#9DB2BF]">Welcome, {user.email}</h2>
                    </section>
                )}

                <Separator className="my-8 bg-[#526D82]" />

                {/* Stats Section (keep as is) */}
                <section className="mb-8">
                    <h2 className="mb-4 text-xl font-semibold text-[#9DB2BF]">Your Stats</h2>
                    {/* ... existing stats rendering logic ... */}
                </section>

                <Separator className="my-8 bg-[#526D82]" />

                {/* Problems Section */}
                <section>
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                        <h2 className="text-xl font-semibold text-[#9DB2BF]">Your Problems</h2>
                        {/* Search Input */}
                        <Input
                            type="text"
                            placeholder="Search by title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-64 bg-[#DDE6ED] text-[#27374D] placeholder:text-[#526D82]/80"
                        />
                    </div>

                    {/* Tag Filter Area */}
                    {uniqueTags.length > 0 && (
                        <div className="mb-6">
                            <h3 className="mb-2 text-sm font-medium text-[#9DB2BF] uppercase tracking-wider">Filter by Tags:</h3>
                            <div className="flex flex-wrap gap-2">
                                {uniqueTags.map(tag => (
                                    <Badge
                                        key={tag}
                                        variant={selectedTags.includes(tag) ? "default" : "outline"} // Highlight selected tags
                                        onClick={() => handleTagClick(tag)}
                                        className={`cursor-pointer transition-colors ${selectedTags.includes(tag)
                                                ? 'bg-[#DDE6ED] text-[#27374D] border-[#DDE6ED]' // Style for selected tag
                                                : 'bg-[#526D82]/60 text-[#DDE6ED] border-[#9DB2BF]/50 hover:bg-[#9DB2BF]/70' // Style for unselected tag
                                            }`}
                                    >
                                        {tag}
                                    </Badge>
                                ))}
                                {selectedTags.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedTags([])} // Clear all selected tags
                                        className="h-auto px-2 py-1 text-xs text-[#9DB2BF] hover:text-[#DDE6ED]"
                                    >
                                        Clear Filters
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Problems Grid/List */}
                    {error && <div className="p-4 mb-4 text-red-800 bg-red-100 rounded-md">{error}</div>}

                    {/* Loading Skeletons */}
                    {loading && problems.length === 0 && ( // Show skeletons only during initial load
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {[...Array(6)].map((_, i) => (
                                <Card key={i} className="overflow-hidden bg-[#DDE6ED]">
                                    <CardHeader className="pb-2"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-6 w-16 rounded-full" /></CardHeader>
                                    <CardContent className="pb-4"><Skeleton className="h-4 mb-3 w-full" /><Skeleton className="h-4 mb-3 w-5/6" /><div className="flex flex-wrap gap-2 mb-4"><Skeleton className="h-4 w-16 rounded-full" /><Skeleton className="h-4 w-16 rounded-full" /></div></CardContent>
                                    <CardFooter><Skeleton className="h-9 w-full" /></CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* No Data/Results Messages */}
                    {!loading && problems.length === 0 && !error && ( // No problems fetched at all
                        <Card className="p-8 text-center bg-[#526D82]">
                            <CardContent className="pt-6"> <p className="text-[#DDE6ED]">No problems found. Fetch your LeetCode data to see problems here.</p> </CardContent>
                        </Card>
                    )}
                    {!loading && problems.length > 0 && filteredProblems.length === 0 && !error && ( // Problems fetched, but none match filters
                        <Card className="p-8 text-center bg-[#526D82]">
                            <CardContent className="pt-6"> <p className="text-[#DDE6ED]">No problems match the current filters.</p> </CardContent>
                        </Card>
                    )}

                    {/* Display Filtered Problems */}
                    {!loading && filteredProblems.length > 0 && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {/* *** MAP OVER filteredProblems INSTEAD OF problems *** */}
                            {filteredProblems.map((problem) => {
                                // --- Difficulty Badge Logic (keep as is) ---
                                const difficultyVariant = (difficulty: string): "outline" | "secondary" | "destructive" | "default" => { /* ... */ };
                                const difficultyClass = (difficulty: string): string => { /* ... */ };
                                // --- End Difficulty Badge Logic ---

                                return (
                                    <Card key={problem.id} className="flex flex-col overflow-hidden bg-[#DDE6ED] hover:shadow-lg transition-shadow">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <CardTitle className="text-lg font-semibold text-[#27374D] hover:text-[#27374D]/80" title={problem.title}>
                                                    {/* Link to notes page */}
                                                    <Link to={`/notes/${problem.id}`} className="hover:underline">
                                                        {problem.title}
                                                    </Link>
                                                </CardTitle>
                                                <Badge variant={difficultyVariant(problem.difficulty)} className={`flex-shrink-0 ${difficultyClass(problem.difficulty)}`}>
                                                    {problem.difficulty}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-grow pb-3">
                                            <p className="mb-3 text-sm text-[#526D82] line-clamp-2">{problem.description || "No description available."}</p>
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {(problem.tags || []).map((tag, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs bg-[#526D82]/50 text-[#3C5B6F] border-[#526D82]/60">
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