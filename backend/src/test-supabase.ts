// import { createClient } from '@supabase/supabase-js';
// import * as dotenv from 'dotenv';

// dotenv.config(); // Load environment variables

// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseKey = process.env.SUPABASE_KEY;

// if (!supabaseUrl || !supabaseKey) {
//     throw new Error("Missing Supabase credentials. Check your .env file.");
// }

// const supabase = createClient(supabaseUrl, supabaseKey);

// // Test connection
// async function testConnection() {
//     const { data, error } = await supabase.from("leetcode_data").select("*");
//     if (error) console.error("Supabase Error:", error);
//     else console.log("Data:", data);
// }

// testConnection();
