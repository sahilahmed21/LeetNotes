import React, { useState } from "react";
import axios from "axios";
import { supabase } from "../supabase";

interface FetchFormProps {
    userId: string;
    onFetch: () => void;
}

const FetchForm: React.FC<FetchFormProps> = ({ userId, onFetch }) => {
    const [credentials, setCredentials] = useState({
        username: "",
        session_cookie: "",
        csrf_token: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleFetch = async () => {
        setError(null);
        setLoading(true);

        try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            console.log("Session Data:", sessionData);
            console.log("Session Error:", sessionError);

            if (sessionError || !sessionData.session) {
                console.error("Session missing during fetch. Redirecting to login...");
                setError("Failed to retrieve session. Please log in again.");
                setLoading(false);
                return;
            }

            const token = sessionData.session.access_token;

            const { data } = await axios.post(
                "http://localhost:3000/api/fetch-data",
                credentials,
                {
                    headers: {
                        "x-user-id": userId,
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            alert(data.message);
            onFetch();
        } catch (err: any) {
            console.error("Fetch error:", err);
            setError(err.response?.data?.error || "Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredentials((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fetch-form">
            <h3>Fetch LeetCode Data</h3>
            <div>
                <label>LeetCode Username:</label>
                <input
                    type="text"
                    name="username"
                    value={credentials.username}
                    onChange={handleChange}
                    placeholder="Enter your LeetCode username"
                    disabled={loading}
                />
            </div>
            <div>
                <label>Session Cookie:</label>
                <input
                    type="text"
                    name="session_cookie"
                    value={credentials.session_cookie}
                    onChange={handleChange}
                    placeholder="Enter your session cookie"
                    disabled={loading}
                />
            </div>
            <div>
                <label>CSRF Token:</label>
                <input
                    type="text"
                    name="csrf_token"
                    value={credentials.csrf_token}
                    onChange={handleChange}
                    placeholder="Enter your CSRF token"
                    disabled={loading}
                />
            </div>
            {error && <p className="error">{error}</p>}
            <button onClick={handleFetch} disabled={loading}>
                {loading ? "Fetching..." : "Fetch Data"}
            </button>
        </div>
    );
};

export default FetchForm;