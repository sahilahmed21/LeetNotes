"use client"; // Required for hooks like useState, useToast and event handlers

import React, { useState } from "react";
import axios from "axios";
import { supabase } from "../supabase"; // Keep original Supabase import
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { useToast } from "../components/ui/use-toast";
import { Toaster } from "../components/ui/toaster"; // Make sure Toaster is rendered somewhere in your layout/page
import { InfoIcon } from "lucide-react";

// Keep original props interface
interface FetchFormProps {
    userId: string;
    onFetch: () => void; // Keep original callback name 'onFetch'
}

const FetchForm: React.FC<FetchFormProps> = ({ userId, onFetch }) => {
    // --- Keep Original State Management ---
    const [credentials, setCredentials] = useState({
        username: "",
        session_cookie: "",
        csrf_token: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    // --- Add Toast Hook from Example ---
    const { toast } = useToast();

    // --- Keep Original API Call Logic ---
    const handleFetch = async (e: React.FormEvent) => {
        e.preventDefault(); // Add preventDefault for form submission
        setError(null);
        setLoading(true);

        try {
            // Original Supabase session check logic
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            console.log("Session Data:", sessionData);
            console.log("Session Error:", sessionError);

            if (sessionError || !sessionData.session) {
                console.error("Session missing during fetch. Redirecting to login...");
                setError("Failed to retrieve session. Please log in again.");
                setLoading(false);
                // Use toast for error feedback
                toast({
                    title: "Authentication Error",
                    description: "Failed to retrieve session. Please log in again.",
                    variant: "destructive",
                });
                return;
            }

            const token = sessionData.session.access_token;

            // Get the backend base URL from environment variables
            const backendUrl = process.env.REACT_APP_BACKEND_URL;

            // Add a check to ensure the environment variable is loaded
            if (!backendUrl) {
                console.error("FATAL ERROR: REACT_APP_BACKEND_URL is not defined!");
                setError("Application configuration error. Backend URL is missing.");
                setLoading(false);
                // Optionally use toast here as well
                toast({
                    title: "Configuration Error",
                    description: "Could not find the backend server address.",
                    variant: "destructive",
                });
                return; // Stop the function execution
            }

            // Construct the full API URL dynamically
            // Use .replace(/\/$/, '') to remove a potential trailing slash from the env var
            // before appending the specific endpoint.
            const apiUrl = `${backendUrl.replace(/\/$/, '')}/api/fetch-data`;
            console.log("Attempting to fetch data from:", apiUrl); // Log the actual URL being used

            // Updated Axios POST request using the environment variable URL
            const { data } = await axios.post(
                apiUrl, // Use the dynamically constructed URL
                credentials,
                {
                    headers: {
                        // 'x-user-id': userId, // This header is likely NOT needed if your authMiddleware correctly gets the userId from the token. Removing it simplifies CORS.
                        Authorization: `Bearer ${token}`, // Keep this header for authentication
                        'Content-Type': 'application/json' // It's good practice to include this
                    },
                }
            );


            // Use toast for success feedback (instead of alert)
            toast({
                title: "Success!",
                description: data.message || "Data fetched successfully.", // Use message from API response
                variant: "default",
            });
            onFetch(); // Call original onFetch callback
        } catch (err: any) {
            console.error("Fetch error:", err);
            const errorMessage = err.response?.data?.error || "Failed to fetch data";
            setError(errorMessage);
            // Use toast for error feedback
            toast({
                title: "Fetch Failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // --- Keep Original Input Change Handler ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredentials((prev) => ({ ...prev, [name]: value }));
    };

    // --- Use Example's JSX Structure & Components ---
    return (
        // Apply Card styling from example
        <Card className="bg-[#526D82]"> {/* Specific background color from example */}
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold text-[#DDE6ED]">Fetch LeetCode Data</CardTitle> {/* Specific text color */}
            </CardHeader>

            {/* Use example's error display style, driven by original error state */}
            {error && (
                <div className="px-6 -mt-2 text-sm text-red-800 bg-red-100 rounded-md py-2 mx-6">{error}</div>
            )}

            <CardContent>
                {/* Use form onSubmit for handling */}
                <form onSubmit={handleFetch} className="space-y-4">
                    {/* Username Input */}
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-[#DDE6ED]"> {/* Use Label component + color */}
                            LeetCode Username:
                        </Label>
                        <Input
                            id="username" // Use id for Label association
                            type="text"
                            name="username" // Keep name attribute for handleChange
                            value={credentials.username} // Bind to original state
                            onChange={handleChange} // Use original handler
                            placeholder="Enter your LeetCode username" // Keep original placeholder
                            disabled={loading} // Use original loading state
                            required // Add required attribute like example
                            className="text-[#27374D] bg-[#DDE6ED]" // Apply specific text/bg colors from example
                        />
                    </div>

                    {/* Session Cookie Input with Tooltip */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="session_cookie" className="text-[#DDE6ED]"> {/* Use Label component + color */}
                                Session Cookie:
                            </Label>
                            {/* Add Tooltip structure from example */}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <InfoIcon className="w-4 h-4 text-[#DDE6ED]" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">
                                            Find this in your browser's developer tools under Application -- Cookies -- leetcode.com -- LEETCODE_SESSION
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <Input
                            id="session_cookie" // Use id for Label association
                            type="text" // Consider type="password" if sensitive
                            name="session_cookie" // Keep name attribute for handleChange
                            value={credentials.session_cookie} // Bind to original state
                            onChange={handleChange} // Use original handler
                            placeholder="Enter your session cookie" // Keep original placeholder
                            disabled={loading} // Use original loading state
                            required // Add required attribute like example
                            className="text-[#27374D] bg-[#DDE6ED]" // Apply specific text/bg colors from example
                        />
                    </div>

                    {/* CSRF Token Input with Tooltip */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="csrf_token" className="text-[#DDE6ED]"> {/* Use Label component + color */}
                                CSRF Token:
                            </Label>
                            {/* Add Tooltip structure from example */}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <InfoIcon className="w-4 h-4 text-[#DDE6ED]" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">
                                            Find this in your browser's developer tools under Application -- Cookies -- leetcode.com -- csrftoken
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <Input
                            id="csrf_token" // Use id for Label association
                            type="text" // Consider type="password" if sensitive
                            name="csrf_token" // Keep name attribute for handleChange
                            value={credentials.csrf_token} // Bind to original state
                            onChange={handleChange} // Use original handler
                            placeholder="Enter your CSRF token" // Keep original placeholder
                            disabled={loading} // Use original loading state
                            required // Add required attribute like example
                            className="text-[#27374D] bg-[#DDE6ED]" // Apply specific text/bg colors from example
                        />
                    </div>

                    {/* Use Button component and loading state from example */}
                    <Button
                        type="submit"
                        disabled={loading} // Use original loading state
                        variant="default" // Or adjust as needed
                        className="w-full bg-[#27374D] hover:bg-[#1a2536] text-[#DDE6ED]" // Apply specific styling and colors from example
                    >
                        {loading ? (
                            // Example's loading spinner
                            <div className="w-5 h-5 border-2 border-[#DDE6ED] border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            "Fetch Data" // Original button text
                        )}
                    </Button>
                </form>
            </CardContent>
            <Toaster />
        </Card>
    );
};

export default FetchForm;

// Don't forget to render <Toaster /> in your main layout or page file
// e.g., in your app/layout.tsx or relevant page component:
// import { Toaster } from "../components/ui/toaster"
// ...
// return (
//   <body>
//     {children}
{/* <Toaster /> */ }
//   </body>
// )