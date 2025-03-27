import React, { useState } from "react";
import { supabase } from "../supabase";

interface LoginProps {
    onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isSignUp, setIsSignUp] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (isSignUp) {
            // Sign-up logic
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { username },
                },
            });

            if (error) {
                setError(error.message);
                return;
            }

            if (data.user) {
                console.log("Sign-up successful, user:", data.user);
                console.log("Sign-up session:", data.session);

                if (!data.session) {
                    setMessage("Sign-up successful! Please check your email to confirm your account, then log in.");
                }

                // Insert user into the users table
                const { error: dbError } = await supabase.from("users").insert({
                    id: data.user.id,
                    username,
                    email,
                });

                if (dbError) {
                    setError(dbError.message);
                    return;
                }

                // Create a default profile_stats row for the user
                const { error: statsError } = await supabase.from("profile_stats").insert({
                    user_id: data.user.id,
                    total_solved: 0,
                    easy: 0,
                    medium: 0,
                    hard: 0,
                });

                if (statsError) {
                    setError("Failed to create profile stats: " + statsError.message);
                    return;
                }

                // Verify session persistence
                const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                console.log("Session after sign-up:", sessionData, sessionError);

                if (data.session) {
                    onLogin(data.user);
                }
            }
        } else {
            // Sign-in logic
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message);
                return;
            }

            if (data.user) {
                console.log("Sign-in successful, user:", data.user);
                console.log("Sign-in session:", data.session);

                if (!data.session) {
                    setError("No session created after sign-in. Please ensure your email is confirmed.");
                    return;
                }

                // Verify session persistence
                const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                console.log("Session after sign-in:", sessionData, sessionError);

                onLogin(data.user);
            }
        }
    };

    return (
        <div className="login-container">
            <h2>{isSignUp ? "Sign Up for CodeScribeAI" : "Login to CodeScribeAI"}</h2>
            <form onSubmit={handleAuth}>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Enter your email"
                    />
                </div>
                {isSignUp && (
                    <div>
                        <label>Username:</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="Enter your username"
                        />
                    </div>
                )}
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter your password"
                    />
                </div>
                {error && <p className="error">{error}</p>}
                {message && <p className="message">{message}</p>}
                <button type="submit">{isSignUp ? "Sign Up" : "Login"}</button>
            </form>
            <p>
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="toggle-auth"
                >
                    {isSignUp ? "Login" : "Sign Up"}
                </button>
            </p>
        </div>
    );
};

export default Login;