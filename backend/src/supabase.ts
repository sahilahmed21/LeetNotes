import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be defined in .env");
}

export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);