"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Link, useNavigate } from "react-router-dom";
import FetchForm from "../components/FetchForm";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";

const FetchPage: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const validateAndSetSession = async () => {
            setLoading(true);
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData.session) {
                setUser(null);
                setLoading(false);
                navigate("/login");
                return;
            }

            setUser(sessionData.session.user);
            setLoading(false);
        };

        validateAndSetSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (event === "SIGNED_OUT") {
                navigate("/login");
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [navigate]);

    const handleLogout = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error logging out:", error);
        }
        setLoading(false);
    };

    if (!user || loading) {
        return null; // Redirect handled by useEffect
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
                        <Link to="/home">Back to Home</Link>
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

            <main className="container px-4 py-8 mx-auto max-w-4xl">
                {/* Combined Card with Form at top and Instructions below */}
                <Card className="bg-[#DDE6ED]">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-[#27374D]">Fetch LeetCode Data</CardTitle>
                        <CardDescription className="text-[#526D82]">
                            Enter your credentials to import your LeetCode problems and submissions
                        </CardDescription>
                    </CardHeader>

                    {/* Form Section */}
                    <CardContent>
                        <FetchForm userId={user.id} onFetch={() => navigate("/home")} />
                    </CardContent>

                    <Separator className="my-4 bg-[#9DB2BF] bg-opacity-30" />

                    {/* Instructions Section */}
                    <CardContent>
                        <h2 className="text-xl font-semibold text-[#27374D] mb-4">How to Find Your Tokens</h2>

                        <Tabs defaultValue="chrome" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-4 bg-[#9DB2BF] bg-opacity-20">
                                <TabsTrigger value="chrome" className="text-[#27374D]">Chrome</TabsTrigger>
                                <TabsTrigger value="firefox" className="text-[#27374D]">Firefox</TabsTrigger>
                                <TabsTrigger value="edge" className="text-[#27374D]">Edge</TabsTrigger>
                            </TabsList>

                            <TabsContent value="chrome" className="space-y-6">
                                <div>
                                    <h3 className="mb-2 text-lg font-medium text-[#27374D]">Step 1: Log into LeetCode</h3>
                                    <p className="mb-2 text-[#526D82]">First, go to the LeetCode website and log in with your account.</p>
                                    <img
                                        src="/Screenshot 2025-03-31 164810.png"
                                        alt="Log into LeetCode"
                                        className="border border-[#9DB2BF] rounded-md shadow-sm"
                                    />
                                </div>

                                <div>
                                    <h3 className="mb-2 text-lg font-medium text-[#27374D]">Step 2: Open Developer Tools</h3>
                                    <p className="mb-2 text-[#526D82]">Press F12 or right-click anywhere on the page and select "Inspect".</p>
                                    <img
                                        src="/Screenshot 2025-03-31 164832.png"
                                        alt="Opening Chrome Developer Tools"
                                        className="border border-[#9DB2BF] rounded-md shadow-sm"
                                    />
                                </div>

                                <div>
                                    <h3 className="mb-2 text-lg font-medium text-[#27374D]">Step 3: Go to Application and Cookies</h3>
                                    <p className="mb-2 text-[#526D82]">Click on the "Application" tab, then expand the "Cookies" section in the left sidebar.</p>
                                    <img
                                        src="/Screenshot 2025-03-31 164849.png"
                                        alt="Navigate to Application Tab and Cookies"
                                        className="border border-[#9DB2BF] rounded-md shadow-sm"
                                    />
                                </div>

                                <div>
                                    <h3 className="mb-2 text-lg font-medium text-[#27374D]">Step 4: Find LEETCODE_SESSION Token</h3>
                                    <p className="mb-2 text-[#526D82]">Look for "LEETCODE_SESSION" in the Name column and copy its value.</p>
                                    <img
                                        src="/Screenshot 2025-03-31 164916.png"
                                        alt="Find and copy LEETCODE_SESSION token"
                                        className="border border-[#9DB2BF] rounded-md shadow-sm"
                                    />
                                </div>

                                <div>
                                    <h3 className="mb-2 text-lg font-medium text-[#27374D]">Step 5: Find CSRF Token</h3>
                                    <p className="mb-2 text-[#526D82]">Next, find "csrftoken" in the same list and copy its value. Enter both tokens in the form above.</p>
                                    <p className="text-[#27374D] font-semibold mt-2">Note: Both tokens are needed for successful data fetching.</p>
                                </div>
                            </TabsContent>

                            <TabsContent value="firefox" className="space-y-6">
                                <div className="p-4 bg-[#9DB2BF] bg-opacity-20 rounded-md">
                                    <h3 className="mb-2 text-lg font-medium text-[#27374D]">Firefox Instructions</h3>
                                    <p className="text-[#526D82]">
                                        The process is similar to Chrome. In Firefox, you can press F12 to open developer tools,
                                        go to the "Storage" tab, then "Cookies", and find the "LEETCODE_SESSION" and "csrftoken" values.
                                    </p>
                                </div>
                            </TabsContent>

                            <TabsContent value="edge" className="space-y-6">
                                <div className="p-4 bg-[#9DB2BF] bg-opacity-20 rounded-md">
                                    <h3 className="mb-2 text-lg font-medium text-[#27374D]">Edge Instructions</h3>
                                    <p className="text-[#526D82]">
                                        The process is identical to Chrome. Press F12 to open developer tools,
                                        go to the "Application" tab, then "Cookies", and find the "LEETCODE_SESSION" and "csrftoken" values.
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default FetchPage;
// C:\personal stuff\WEB D\projects\LeetNotes\frontend\public\Screenshot 2025-03-31 164810.png
// example of location of image i will adjust acc to myself
