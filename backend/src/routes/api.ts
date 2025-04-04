import { Router } from "express";
import { exec } from "child_process";
import axios from "axios";
import path from 'path'; // <-- Import path module
import { supabase } from "../supabase";
import { AuthRequest } from "../middleware/auth";

const router = Router();

// Fetch LeetCode data and store in Supabase
router.post("/fetch-data", async (req: AuthRequest, res) => {
    const { username, session_cookie, csrf_token } = req.body;
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
    }

    // --- FIX: Calculate Python script path dynamically ---
    // This is CRITICAL for Render (or any non-Windows deployment)
    // Assumes 'fetcher' directory is at the root level, alongside 'backend'
    const projectRoot = path.join(__dirname, '..', '..', '..'); // Adjust if 'fetcher' is elsewhere relative to 'backend/src/routes'
    // NOTE: Your original code used 'LeetcodeDataFetcher'. Ensure the directory name matches EXACTLY.
    // Using 'fetcher' based on common structures. CHANGE 'fetcher' if your directory is named differently.
    const fetcherDirName = 'fetcher'; // <--- CHANGE THIS if your directory is 'LeetcodeDataFetcher'
    const fetcherPath = path.join(projectRoot, fetcherDirName, 'main.py');
    const pythonExecutable = 'python'; // Render usually has 'python' aliased to python3

    console.log("Calculated Fetcher path:", fetcherPath);
    // --- End Path Fix ---

    // Quote arguments to handle potential special characters in cookies/tokens
    const command = `${pythonExecutable} "${fetcherPath}" --username "${username}" --session "${session_cookie}" --csrf "${csrf_token}"`;
    console.log("Executing command:", command);

    exec(command, async (error, stdout, stderr) => {
        // Improved error handling from previous suggestions
        if (error) {
            console.error("Execution error:", error);
            const detailMessage = stderr ? `${error.message}\nStderr: ${stderr}` : error.message;
            // Ensure stderr doesn't expose sensitive info if included in response
            return res.status(500).json({ error: "Failed to execute Python script", details: `Script execution failed. Check server logs. Code: ${error.code}` });
        }

        if (stderr) {
            console.warn("Script stderr:", stderr);
            // Treat specific errors from stderr as fatal, otherwise might be warnings
            if (stderr.includes("Authentication failed") || stderr.includes("Rate limited") || stderr.includes("Traceback") || stderr.toLowerCase().includes("error:")) {
                // Ensure stderr doesn't expose sensitive info if included in response
                return res.status(500).json({
                    error: "Python script reported an error",
                    details: "Error during data fetching. Check server logs.",
                });
            }
        }

        // Check for empty stdout AFTER checking error and fatal stderr
        if (!stdout || stdout.trim() === "") {
            console.error("Python script produced empty stdout.");
            const detailMessage = stderr ? `Script finished with no output. Stderr: ${stderr}` : "Script finished with no output.";
            return res.status(500).json({ error: "Python script did not produce expected data", details: "Fetcher script returned no data. Check server logs." });
        }

        try {
            const data = JSON.parse(stdout);
            // Limit logging in production if data is large
            console.log("Parsed data from Python script:", JSON.stringify(data, null, 2).substring(0, 500) + '...');

            // --- Existing Supabase Logic (Consider adding more robust error handling/logging) ---
            const { error: statsError } = await supabase
                .from("profile_stats")
                .upsert(
                    {
                        user_id: userId,
                        total_solved: data.profile_stats.total_solved || 0,
                        easy: data.profile_stats.easy || 0,
                        medium: data.profile_stats.medium || 0,
                        hard: data.profile_stats.hard || 0,
                    },
                    { onConflict: "user_id" }
                );
            if (statsError) {
                console.error("Profile stats upsert error:", statsError);
                return res.status(500).json({ error: "Failed to store profile stats", details: statsError.message });
            }

            for (const problem of data.problems || []) {
                const { data: problemData, error: problemError } = await supabase
                    .from("problems")
                    .insert({ // Consider upsert on (user_id, slug) if problems can be re-fetched
                        user_id: userId,
                        title: problem.title,
                        difficulty: problem.difficulty,
                        description: problem.description,
                        tags: problem.tags,
                        slug: problem.slug,
                    })
                    .select("id")
                    .single();

                if (problemError) {
                    if (problemError.code === '23505') { // Handle unique violation gracefully
                        console.warn(`Problem insert skipped (likely exists): ${problem.slug} for user ${userId}`);
                        // If you need the ID for submissions, you'd query it here based on user_id and slug
                        continue;
                    }
                    console.error("Problem insert error:", problemError);
                    return res.status(500).json({ error: "Failed to store problem", details: problemError.message });
                }

                // Check if problemData exists before accessing id (might be null if insert failed silently or skipped)
                if (!problemData) {
                    console.warn(`Skipping submissions for problem ${problem.slug} as problem data/ID was not retrieved.`);
                    continue;
                }

                const problemId = problemData.id;
                for (const submission of problem.submissions || []) {
                    const { error: submissionError } = await supabase
                        .from("submissions")
                        .insert({ // Consider upsert on (user_id, submission_id)
                            problem_id: problemId,
                            user_id: userId,
                            status: submission.status,
                            timestamp: submission.timestamp, // Ensure this is ISO format or compatible with Supabase timestampz
                            runtime: submission.runtime,
                            memory: submission.memory,
                            language: submission.language,
                            submission_id: submission.id,
                            code: submission.code,
                        });
                    if (submissionError) {
                        if (submissionError.code === '23505') { // Handle unique violation gracefully
                            console.warn(`Submission insert skipped (likely exists): ${submission.id}`);
                            continue;
                        }
                        console.error("Submission insert error:", submissionError);
                        return res.status(500).json({ error: "Failed to store submission", details: submissionError.message });
                    }
                }
            }
            // --- End Supabase Logic ---

            res.json({ message: "Data fetched and stored in Supabase" });
        } catch (parseError) {
            console.error("Parse error:", parseError);
            console.error("Raw stdout that failed parsing:", stdout); // Log the raw stdout for debugging
            return res.status(500).json({
                error: "Invalid data format from fetcher",
                details: "Failed to process data from fetcher script.", // Avoid sending raw error details/output to client
            });
        }
    });
});

// --- Generate Notes Route (Keep Existing Code) ---
// Ensure any axios calls inside this route also use the correct base URL if they call your own backend
router.post("/generate-notes/:problemId", async (req: AuthRequest, res) => {
    const { problemId } = req.params;
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
    }
    // ... rest of the generate-notes implementation ...
    if (!problemId) {
        return res.status(400).json({ error: "Problem ID is required" });
    }

    // Fetch the specific problem and its submissions
    const { data: problemData, error: problemError } = await supabase
        .from("problems")
        .select("*, submissions(*)")
        .eq("id", problemId)
        .eq("user_id", userId)
        .single();

    if (problemError || !problemData) {
        console.error("Error fetching problem:", problemError);
        return res.status(404).json({ error: "Problem not found", details: problemError?.message });
    }

    try {
        console.log(`Processing problem: ${problemData.title}`);

        // Construct the prompt for Gemini API
        // Make sure process.env.GEMINI_API_KEY is available in your Render environment variables
        if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY environment variable not set.");
            return res.status(500).json({ error: "Server configuration error: Missing API key." });
        }
        const prompt = `
You are tasked with generating structured notes for a specific LeetCode problem. The notes must strictly follow the format below, and the content must be relevant to the given problem. Do not generate notes for a different problem. If the problem details are unclear, use the title and description to infer the problem, but ensure the notes match the problem provided.

Format:
**Topic:** [Problem Title]
**Question:** [Problem Description]
**Intuition:** [Explain the thought process and approach]
**Example:** [Provide a step-by-step example]
**Counterexample:** [Provide a case where the solution fails or is impossible]
**Pseudocode:** [Provide pseudocode for the solution]
**Mistake I Did:** [Analyze the submission and identify a potential mistake]
**Code:** [Provide the accepted code]

Problem Details:
- Title: ${problemData.title}
- Description: ${problemData.description}
- Difficulty: ${problemData.difficulty}
- Tags: ${Array.isArray(problemData.tags) ? problemData.tags.join(", ") : 'N/A'}
- Submissions: ${JSON.stringify(problemData.submissions)}

Ensure that the notes are generated for the problem titled "${problemData.title}" and match the description provided. Do not generate notes for a different problem.
`;

        // Call Gemini API
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        console.log("Calling Gemini API..."); // Avoid logging full URL with key

        let response;
        try {
            response = await axios.post(
                geminiApiUrl,
                {
                    contents: [
                        {
                            parts: [{ text: prompt }],
                        },
                    ],
                },
                {
                    headers: { "Content-Type": "application/json" },
                    timeout: 60000 // Increase timeout for potentially long AI generation (60 seconds)
                }
            );
        } catch (geminiError: any) {
            console.error("Gemini API request failed:", geminiError.response?.data || geminiError.message);
            // Provide a more generic error to the client
            return res.status(502).json({ error: "Failed to communicate with AI service." });
        }

        // Parse the Gemini API response safely
        let generatedText = "";
        try {
            // Add checks for response structure
            if (response.data && response.data.candidates && response.data.candidates.length > 0 &&
                response.data.candidates[0].content && response.data.candidates[0].content.parts &&
                response.data.candidates[0].content.parts.length > 0 && response.data.candidates[0].content.parts[0].text) {
                generatedText = response.data.candidates[0].content.parts[0].text;
                console.log("Generated text from Gemini API received.");
            } else {
                console.error("Unexpected Gemini API response structure:", response.data);
                throw new Error("Unexpected response format from AI service.");
            }

        } catch (parseError) {
            console.error("Error parsing Gemini API response:", parseError);
            return res.status(500).json({ error: "Failed to parse response from AI service." });
        }

        // Parse the generated text into structured sections
        const sections = { topic: problemData.title, question: problemData.description, intuition: "", example: "", counterexample: "", pseudocode: "", mistake: "", code: "" };
        try {
            const lines = generatedText.split("\n");
            let currentSection: keyof typeof sections | "" = "";
            let currentContent: string[] = [];

            const sectionMap: { [key: string]: keyof typeof sections } = {
                "**Topic:**": "topic",
                "**Question:**": "question",
                "**Intuition:**": "intuition",
                "**Example:**": "example",
                "**Counterexample:**": "counterexample",
                "**Pseudocode:**": "pseudocode",
                "**Mistake I Did:**": "mistake",
                "**Code:**": "code"
            };

            for (const line of lines) {
                let matched = false;
                for (const marker in sectionMap) {
                    if (line.startsWith(marker)) {
                        if (currentSection && currentContent.length > 0) {
                            sections[currentSection] = currentContent.join("\n").trim();
                        }
                        currentSection = sectionMap[marker];
                        currentContent = [line.substring(marker.length).trim()]; // Start new content
                        matched = true;
                        break;
                    }
                }
                if (!matched && currentSection && line.trim() !== "") {
                    currentContent.push(line);
                }
            }
            // Add the last section's content
            if (currentSection && currentContent.length > 0) {
                sections[currentSection] = currentContent.join("\n").trim();
            }
        } catch (parseError) {
            console.error("Error parsing generated text into sections:", parseError);
            return res.status(500).json({ error: "Failed to structure generated notes." });
        }

        console.log("Parsed sections generated.");

        // Store or update the note in Supabase
        try {
            const { data: existingNote, error: fetchNoteError } = await supabase
                .from("notes")
                .select("id")
                .eq("problem_id", problemId)
                .eq("user_id", userId)
                .maybeSingle(); // Use maybeSingle to handle null case gracefully

            if (fetchNoteError && fetchNoteError.code !== 'PGRST116') { // PGRST116 = row not found, which is ok for insert
                console.error("Error checking existing note:", fetchNoteError);
                throw new Error("Failed to check existing note");
            }

            let noteData;
            const notePayload = {
                user_id: userId,
                problem_id: parseInt(problemId, 10), // Ensure problemId is number if needed by DB
                title: problemData.title,
                notes: sections, // Ensure 'notes' column type is JSONB in Supabase
                updated_at: new Date().toISOString(),
            };

            if (existingNote) {
                // Update existing note
                const { data, error: updateError } = await supabase
                    .from("notes")
                    .update(notePayload) // Pass updated payload
                    .eq("id", existingNote.id)
                    .select()
                    .single(); // Return the updated row

                if (updateError) {
                    console.error("Error updating note in Supabase:", updateError);
                    throw new Error("Failed to update note in Supabase");
                }
                noteData = data;
                console.log("Note updated successfully.");
            } else {
                // Insert new note (remove updated_at if handled by DB trigger)
                delete (notePayload as any).updated_at; // Remove if DB sets `now()` on update
                const { data, error: insertError } = await supabase
                    .from("notes")
                    .insert(notePayload)
                    .select()
                    .single(); // Return the inserted row

                if (insertError) {
                    console.error("Error inserting note in Supabase:", insertError);
                    throw new Error("Failed to insert note in Supabase");
                }
                noteData = data;
                console.log("Note inserted successfully.");
            }

            res.json(noteData); // Send back the created/updated note
        } catch (supabaseError) {
            console.error("Supabase error during note save:", supabaseError);
            return res.status(500).json({ error: "Failed to store note in database." });
        }
    } catch (err: any) {
        // Catch errors from the main try block (e.g., Gemini API call failure)
        console.error("Generate notes route error:", err);
        return res.status(500).json({
            error: "Failed to generate notes",
            details: err.message || "An unexpected error occurred.",
        });
    }
});


export default router;