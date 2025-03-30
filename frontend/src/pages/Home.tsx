"use client"; // If using Next.js App Router

import React, { useState, useEffect } from "react";
import { supabase } from "../supabase"; // Keep original Supabase import
import Login from "../components/Login"; // Keep original Login component import
import FetchForm from "../components/FetchForm"; // Keep original FetchForm component import
import { Link } from "react-router-dom"; // Keep original routing import

// --- Shadcn/ui Imports from Example ---
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
// You might need this type if not globally defined or imported elsewhere
// Assuming 'submissions' is part of the data fetched but maybe not fully typed here
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
    difficulty: "Easy" | "Medium" | "Hard" | string; // Allow string for flexibility
    description: string;
    tags: string[];
    submissions: Submission[]; // Keep submissions in the data structure
    user_id: string;
    // Add other fields if they exist
}

interface ProfileStatsData {
    user_id: string;
    total_solved: number;
    easy: number;
    medium: number;
    hard: number;
    // Add other fields like last_fetched if they exist
}


const Home: React.FC = () => {
    // --- Keep Original State Management ---
    const [user, setUser] = useState<any>(null); // Consider using Supabase User type if available
    const [profileStats, setProfileStats] = useState<ProfileStatsData | null>(null);
    const [problems, setProblems] = useState<ProblemData[]>([]); // Use defined interface
    const [loading, setLoading] = useState(false); // Keep original loading state name
    const [error, setError] = useState<string | null>(null);

    // --- Keep Original Authentication Logic (useEffect) ---
    useEffect(() => {
        const validateAndSetSession = async () => {
            setLoading(true); // Set loading true initially while checking session
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
                console.error("Session Error:", sessionError);
                setError("Could not retrieve session.");
                setUser(null);
                setLoading(false);
                return;
            }

            if (!sessionData.session) {
                setUser(null);
                setLoading(false); // Not loading data if not logged in
                return;
            }

            setUser(sessionData.session.user);
            // Fetch data only after confirming session and user
            await fetchUserData(sessionData.session.user.id); // await to ensure loading state is correct
            setLoading(false); // Set loading false after initial fetch is done or failed in fetchUserData
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
                // Clear data on sign out
                setProfileStats(null);
                setProblems([]);
                setError(null); // Clear errors on sign out
                setLoading(false); // Not loading when signed out
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []); // Empty dependency array is correct here

    // --- Keep Original Data Fetching Logic ---
    const fetchUserData = async (userId: string) => {
        setLoading(true);
        setError(null);
        // Reset previous data slightly later to avoid UI flicker if fetch is fast
        // setProfileStats(null);
        // setProblems([]);

        try {
            // Fetch profile stats (Original Logic)
            const { data: statsData, error: statsError } = await supabase
                .from("profile_stats")
                .select("*")
                .eq("user_id", userId)
                .maybeSingle(); // Use maybeSingle to handle 0 or 1 row without error

            if (statsError) {
                console.error("Error fetching profile stats:", statsError);
                setError("Failed to fetch profile stats.");
                // Don't return immediately, try fetching problems anyway? Or handle differently.
                // For now, let's stop if stats fail critically
                setLoading(false);
                return;
            }
            setProfileStats(statsData); // Set to null if no data found

            // Fetch problems and submissions (Original Logic)
            // Ensure 'submissions' table name and relation is correct in Supabase
            const { data: problemsData, error: problemsError } = await supabase
                .from("problems") // Ensure this table name is correct
                .select("*, submissions(*)") // Ensure this relation name is correct
                .eq("user_id", userId);

            if (problemsError) {
                console.error("Error fetching problems:", problemsError);
                setError("Failed to fetch problems.");
                // Set problems to empty array on error
                setProblems([]);
                setLoading(false); // Stop loading even if problems fail
                return; // Exit after setting error and clearing problems
            }

            setProblems(problemsData || []); // Set to empty array if null/undefined

        } catch (err) {
            console.error("Unexpected error fetching user data:", err);
            setError("An unexpected error occurred.");
            setProblems([]);
            setProfileStats(null);
        } finally {
            setLoading(false); // Ensure loading is set to false
        }
    };


    // --- Keep Original Logout Logic ---
    const handleLogout = async () => {
        setLoading(true); // Show loading indicator during logout
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error logging out:", error);
            setError("Failed to log out.");
            // User state will be updated by onAuthStateChange anyway
        }
        // Clear state explicitly as well, although onAuthStateChange should handle it
        // setUser(null); // Handled by listener
        // setProfileStats(null); // Handled by listener
        // setProblems([]); // Handled by listener
        setLoading(false);
    };

    // --- Render based on Auth State ---
    // Use Login component if no user
    if (!user) {
        // Pass original onLogin prop which updates the user state
        // Assuming Login component handles its own loading/error states internally
        return <Login onLogin={(loggedInUser) => setUser(loggedInUser)} />;
    }

    // --- Render Authenticated View using Example's Structure ---
    return (
        // Apply example's background and layout
        <div className="min-h-screen bg-[#27374D]">
            {/* Apply example's sticky header */}
            <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-[#27374D] shadow-md">
                {/* Use example's title */}
                <h1 className="text-2xl font-bold text-[#DDE6ED]">LeetNotes</h1>
                {/* Use example's styled Button for Logout, calling original handler */}
                <Button
                    onClick={handleLogout}
                    variant="secondary" // Use appropriate variant
                    className="bg-[#526D82] text-[#DDE6ED] hover:bg-[#9DB2BF] hover:text-[#27374D]" // Apply example styling
                    disabled={loading} // Disable button during logout process
                >
                    Logout
                </Button>
            </header>

            {/* Apply example's main layout */}
            <main className="container px-4 py-8 mx-auto">
                {/* Welcome and Fetch Section */}
                <section className="mb-6"> {/* Adjusted margin */}
                    {/* Use example's styled welcome message, using original user state */}
                    <h2 className="mb-4 text-xl font-semibold text-[#9DB2BF]">Welcome, {user.email}</h2>
                    {/* Render original FetchForm, passing original userId and fetchUserData callback */}
                    <FetchForm userId={user.id} onFetch={() => fetchUserData(user.id)} />
                </section>

                {/* Use example's Separator */}
                <Separator className="my-8 bg-[#526D82]" />

                {/* Stats Section - Conditionally render based on profileStats */}
                <section className="mb-8">
                    <h2 className="mb-4 text-xl font-semibold text-[#9DB2BF]">Your Stats</h2>
                    {/* Show skeleton or message if loading stats and no stats yet */}
                    {loading && !profileStats && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[...Array(4)].map((_, i) => (
                                <Card key={i} className="bg-[#DDE6ED]"><CardContent className="pt-6"><Skeleton className="w-3/4 h-6 mb-2" /><Skeleton className="w-1/2 h-8" /></CardContent></Card>
                            ))}
                        </div>
                    )}
                    {!loading && !profileStats && !error && ( // Show message only if not loading, no stats, and no critical error shown elsewhere
                        <Card className="bg-[#526D82]"><CardContent className="pt-6"><p className="text-center text-[#DDE6ED]">No stats available. Fetch data to see your stats.</p></CardContent></Card>
                    )}
                    {profileStats && ( // Render stats grid only if profileStats exist
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Total Solved Card - Use original data */}
                            <Card className="bg-[#DDE6ED]">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-medium text-[#27374D]">Total Solved</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold text-[#526D82]">{profileStats.total_solved}</p>
                                </CardContent>
                            </Card>
                            {/* Easy Card - Use original data */}
                            <Card className="bg-[#DDE6ED]">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-medium text-[#27374D]">Easy</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {/* Use example's text color for difficulty */}
                                    <p className="text-3xl font-bold text-green-500">{profileStats.easy}</p>
                                </CardContent>
                            </Card>
                            {/* Medium Card - Use original data */}
                            <Card className="bg-[#DDE6ED]">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-medium text-[#27374D]">Medium</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold text-yellow-500">{profileStats.medium}</p>
                                </CardContent>
                            </Card>
                            {/* Hard Card - Use original data */}
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

                {/* Problems Section */}
                <section>
                    <h2 className="mb-4 text-xl font-semibold text-[#9DB2BF]">Your Problems</h2>

                    {/* Use example's styled error display, using original error state */}
                    {error && <div className="p-4 mb-4 text-red-800 bg-red-100 rounded-md">{error}</div>}

                    {/* Use example's Skeleton loading state, based on original loading state */}
                    {loading && problems.length === 0 && ( // Show skeletons only when loading and no problems are loaded yet
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {[...Array(6)].map((_, i) => (
                                <Card key={i} className="overflow-hidden bg-[#DDE6ED]">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <Skeleton className="h-6 w-3/4" />
                                            <Skeleton className="h-6 w-16 rounded-full" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pb-4"> {/* Adjusted padding */}
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

                    {/* Use example's styled empty state */}
                    {!loading && problems.length === 0 && !error && ( // Show only if not loading, no problems, and no critical error
                        <Card className="p-8 text-center bg-[#526D82]">
                            <CardContent className="pt-6">
                                <p className="text-[#DDE6ED]">No problems found. Fetch your LeetCode data to see problems here.</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Use example's problem grid structure */}
                    {!loading && problems.length > 0 && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {/* Map over original problems state */}
                            {problems.map((problem) => {
                                // Determine difficulty variant for Badge
                                const difficultyVariant = (difficulty: string): "outline" | "secondary" | "destructive" | "default" => {
                                    switch (difficulty?.toLowerCase()) {
                                        case 'easy': return 'default'; // Use default for green-like
                                        case 'medium': return 'secondary'; // Use secondary for yellow-like
                                        case 'hard': return 'destructive'; // Use destructive for red-like
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
                                }

                                return (
                                    // Use Card component styled like example's PinCard
                                    <Card key={problem.id} className="flex flex-col overflow-hidden bg-[#DDE6ED] hover:shadow-lg transition-shadow">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between gap-2">
                                                {/* Use original problem.title */}
                                                <CardTitle className="text-lg font-semibold text-[#27374D] hover:text-[#27374D]/80" title={problem.title}>
                                                    {/* Link the title directly */}
                                                    <Link to={`/notes/${problem.id}`} className="hover:underline">
                                                        {problem.title}
                                                    </Link>
                                                </CardTitle>
                                                {/* Use Badge for difficulty with dynamic variant/styling */}
                                                <Badge
                                                    variant={difficultyVariant(problem.difficulty)}
                                                    className={`flex-shrink-0 ${difficultyClass(problem.difficulty)}`}
                                                >
                                                    {problem.difficulty}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-grow pb-3"> {/* Use flex-grow */}
                                            {/* Use original problem.description, apply line-clamp */}
                                            <p className="mb-3 text-sm text-[#526D82] line-clamp-2">{problem.description || "No description available."}</p>
                                            {/* Map over original problem.tags, use styled Badge */}
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {(problem.tags || []).map((tag, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs bg-[#526D82] bg-opacity-50 text-[#DDE6ED] border-[#526D82]/60">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                            {/* DO NOT render submissions here */}
                                        </CardContent>
                                        <CardFooter className="pt-0"> {/* Remove top padding */}
                                            {/* Use Button wrapping Link for navigation */}
                                            <Button asChild className="w-full bg-[#526D82] text-[#DDE6ED] hover:bg-[#9DB2BF] hover:text-[#27374D]">
                                                {/* Use original Link component */}
                                                <Link to={`/notes/${problem.id}`}>
                                                    View Notes
                                                    {/* Optional: Add indicator if notes exist?
                                                    {problem.has_notes ? "View Notes" : "Create/View Notes"} */}
                                                </Link>
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