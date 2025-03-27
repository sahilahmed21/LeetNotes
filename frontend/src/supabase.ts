import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL!,
    process.env.REACT_APP_SUPABASE_ANON_KEY!,
    {
        auth: {
            autoRefreshToken: true, // Automatically refresh the token before it expires
            persistSession: true, // Persist the session in local storage
            detectSessionInUrl: true, // Detect session in URL (e.g., for OAuth redirects)
        },
    }
);