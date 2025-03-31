"use client"; // Required for hooks and event handlers

import React, { useState } from "react";
import { supabase } from "../supabase"; // Keep original Supabase import
import { useNavigate } from "react-router-dom";

// --- Shadcn/ui Imports from Example ---
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Toggle } from "../components/ui/toggle"; // Use Toggle for switching auth mode
import { useToast } from "../components/ui/use-toast";
import { Toaster } from "../components/ui/toaster"; // Ensure this is rendered in layout

// Keep original props interface
interface LoginProps {
    onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    // --- Keep Original State ---
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [error, setError] = useState<string | null>(null);
    // Replace 'message' state with toast notifications
    // const [message, setMessage] = useState<string | null>(null);
    const [isSignUp, setIsSignUp] = useState(false);
    // --- Add Loading State and Toast Hook from Example ---
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    // --- Keep Original Authentication Logic ---
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        // setMessage(null); // No longer needed
        setLoading(true); // Set loading true at the start

        try { // Add try...finally for loading state
            if (isSignUp) {
                // Original Sign-up logic
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { username },
                    },
                });

                if (signUpError) {
                    setError(signUpError.message);
                    toast({ title: "Sign Up Error", description: signUpError.message, variant: "destructive" });
                    setLoading(false); // Added setLoading false here
                    return;
                }

                if (data.user) {
                    console.log("Sign-up successful, user:", data.user);
                    console.log("Sign-up session:", data.session);

                    // Keep the profile_stats insert, as the trigger doesn't handle this
                    const { error: statsError } = await supabase.from("profile_stats").insert({
                        user_id: data.user.id,
                        total_solved: 0,
                        easy: 0,
                        medium: 0,
                        hard: 0,
                        // last_fetched: null, // Only include if the column exists
                    });

                    if (statsError) {
                        // If this fails, the user exists in auth.users and public.users, but not profile_stats
                        // You might want to inform the user or log this more carefully.
                        setError("Failed to create profile stats: " + statsError.message);
                        toast({ title: "Stats Creation Error", description: statsError.message, variant: "destructive" });
                        // Decide if you should return or continue
                        setLoading(false); // Added setLoading false here
                        return;
                    }

                    // Check session and notify user (Adapted from original 'message')
                    if (!data.session) {
                        toast({
                            title: "Account created",
                            description: "Please check your email to confirm your account",
                            variant: "default"
                        });
                    } else {
                        // If session exists immediately (e.g., auto-confirmation enabled), log them in
                        toast({
                            title: "Account created",
                            description: "Your account has been created successfully",
                            variant: "default"
                        });
                        navigate("/home");
                    }

                    // Optional: Verify session persistence (Original console log)
                    const { data: sessionDataVerify, error: sessionErrorVerify } = await supabase.auth.getSession();
                    console.log("Session after sign-up:", sessionDataVerify, sessionErrorVerify);

                } else {
                    // Handle case where sign up returns no user and no error (shouldn't typically happen)
                    setError("Sign up completed but no user data returned.");
                    toast({ title: "Sign Up Issue", description: "Sign up completed but no user data returned.", variant: "destructive" });
                }

            } else {
                // Original Sign-in logic
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) {
                    setError(signInError.message);
                    toast({ title: "Authentication failed", description: signInError.message, variant: "destructive" });
                    return;
                }

                if (data.user) {
                    console.log("Sign-in successful, user:", data.user);
                    console.log("Sign-in session:", data.session);

                    if (!data.session) {
                        // This case might happen if email is not confirmed
                        setError("No session created. Please ensure your email is confirmed.");
                        toast({ title: "Login Issue", description: "No session created. Please ensure your email is confirmed.", variant: "destructive" });
                        return;
                    }

                    // Verify session persistence (Original console log)
                    const { data: sessionDataVerify, error: sessionErrorVerify } = await supabase.auth.getSession();
                    console.log("Session after sign-in:", sessionDataVerify, sessionErrorVerify);

                    // Call original onLogin prop and show success toast
                    toast({
                        title: "Welcome back",
                        description: "You have successfully logged in",
                        variant: "default",
                    });
                    navigate("/home");
                } else {
                    // Handle case where sign in returns no user and no error
                    setError("Sign in completed but no user data returned.");
                    toast({ title: "Login Issue", description: "Sign in completed but no user data returned.", variant: "destructive" });
                }
            }
        } catch (err: any) { // Add general catch block just in case
            console.error("Unexpected Auth Error:", err);
            setError("An unexpected error occurred.");
            toast({ title: "Authentication failed", description: err.message || "An unexpected error occurred", variant: "destructive" });
        } finally {
            setLoading(false); // Set loading false when done
        }
    };

    // --- Use Example's JSX Structure & Components ---
    return (
        // Apply outer layout styling from example
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#27374D] to-[#526D82]">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    {/* Use example's title and styling */}
                    <CardTitle className="text-4xl font-bold text-[#27374D]">LeetNotes</CardTitle>
                    {/* Use example's description structure, conditional text */}
                    <CardDescription>{isSignUp ? "Create an account" : "Sign in to your account"}</CardDescription>
                </CardHeader>

                {/* Use example's error display style, driven by original error state */}
                {error && <div className="px-6 -mt-4 text-sm text-red-800 bg-red-100 rounded-md py-2 mx-6">{error}</div>}

                <CardContent>
                    {/* Use form tag and onSubmit */}
                    <form onSubmit={handleAuth} className="space-y-4">
                        {/* Conditional Username Input (Original Logic) */}
                        {isSignUp && (
                            <div className="space-y-2">
                                {/* Use Label component */}
                                <Label htmlFor="username">Username</Label>
                                {/* Use Input component, bind original state/handler */}
                                <Input
                                    id="username"
                                    name="username" // Keep name for consistency if needed elsewhere, though not strictly needed for this handler
                                    type="text"
                                    required={isSignUp} // Required only on sign up
                                    value={username} // Bind original state
                                    onChange={(e) => setUsername(e.target.value)} // Use original handler logic
                                    placeholder="Choose a username" // Update placeholder
                                />
                            </div>
                        )}

                        {/* Email Input */}
                        <div className="space-y-2">
                            {/* Use Label component */}
                            <Label htmlFor="email">Email address</Label>
                            {/* Use Input component, bind original state/handler */}
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email} // Bind original state
                                onChange={(e) => setEmail(e.target.value)} // Use original handler logic
                                placeholder="you@example.com" // Update placeholder
                            />
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            {/* Use Label component */}
                            <Label htmlFor="password">Password</Label>
                            {/* Use Input component, bind original state/handler */}
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                // Use example's autoComplete logic
                                autoComplete={isSignUp ? "new-password" : "current-password"}
                                required
                                value={password} // Bind original state
                                onChange={(e) => setPassword(e.target.value)} // Use original handler logic
                                placeholder="Enter your password" // Update placeholder
                            />
                        </div>

                        {/* Use Button component and loading state from example */}
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? (
                                // Example's loading spinner
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : // Use original conditional text
                                isSignUp ? (
                                    "Sign up"
                                ) : (
                                    "Sign in"
                                )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="justify-center">
                    {/* Use Toggle component from example for switching mode */}
                    <Toggle
                        pressed={isSignUp} // Controlled by original state
                        onPressedChange={() => {
                            setIsSignUp(!isSignUp); // Use original state setter
                            setError(null); // Clear error on toggle
                            // setMessage(null); // No longer needed
                        }}
                        variant="outline"
                        className="text-sm"
                        aria-label={isSignUp ? "Switch to sign in" : "Switch to sign up"} // Accessibility
                    >
                        {/* Use example's conditional text */}
                        {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                    </Toggle>
                </CardFooter>
            </Card>
            {/* Reminder: Ensure Toaster is rendered in your layout */}
            <Toaster />
        </div>
    );
};

export default Login;