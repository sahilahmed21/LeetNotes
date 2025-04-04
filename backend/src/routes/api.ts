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
    const projectRoot = path.join(__dirname, '..', '..', '..'); // Navigates from backend/src/routes to project root
    const fetcherDirName = 'LeetcodeDataFetcher'; // Updated to match your actual directory name
    const fetcherPath = path.join(projectRoot, fetcherDirName, 'main.py');
    const pythonExecutable = 'python'; // Render usually has 'python' aliased to python3

    console.log("Calculated Fetcher path:", fetcherPath);
    // --- End Path Fix ---


    // Quote arguments to handle potential special characters in cookies/tokens
    const command = `${pythonExecutable} "${fetcherPath}" --username "${username}" --session "${session_cookie}" --csrf "${csrf_token}"`;
    console.log("Executing command:", command);

    exec(command, async (error, stdout, stderr) => {
        // Improved error handling
        if (error) {
            console.error("Execution error:", error);
            const detailMessage = stderr ? `${error.message}\nStderr: ${stderr}` : error.message;
            return res.status(500).json({ error: "Failed to execute Python script", details: `Script execution failed. Check server logs. Code: ${error.code}` });
        }

        if (stderr) {
            console.warn("Script stderr:", stderr);
            if (stderr.includes("Authentication failed") || stderr.includes("Rate limited") || stderr.includes("Traceback") || stderr.toLowerCase().includes("error:")) {
                return res.status(500).json({
                    error: "Python script reported an error",
                    details: "Error during data fetching. Check server logs.",
                });
            }
        }

        if (!stdout || stdout.trim() === "") {
            console.error("Python script produced empty stdout.");
            const detailMessage = stderr ? `Script finished with no output. Stderr: ${stderr}` : "Script finished with no output.";
            return res.status(500).json({ error: "Python script did not produce expected data", details: "Fetcher script returned no data. Check server logs." });
        }

        try {
            const data = JSON.parse(stdout);
            // Limit logging in production if data is large
            console.log("Parsed data from Python script:", JSON.stringify(data, null, 2).substring(0, 500) + '...');

            // --- Supabase Logic ---
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
                    if (problemError.code === '23505') {
                        console.warn(`Problem insert skipped (likely exists): ${problem.slug} for user ${userId}`);
                        // If you need the ID for submissions, query it here based on user_id and slug
                        // For simplicity, skipping submissions if problem insert fails/is skipped due to conflict
                        continue;
                    }
                    console.error("Problem insert error:", problemError);
                    // If one problem fails, maybe continue with others? For now, returning error.
                    return res.status(500).json({ error: "Failed to store problem", details: problemError.message });
                }

                if (!problemData) {
                    console.warn(`Skipping submissions for problem ${problem.slug} as problem data/ID was not retrieved.`);
                    continue; // Skip submissions if problem insert didn't return an ID
                }

                const problemId = problemData.id;
                for (const submission of problem.submissions || []) {
                    // --- Check if submission_id exists ---
                    if (!submission.submission_id) {
                        console.warn(`Submission object missing 'submission_id' for problem ${problem.slug}. Skipping insert.`);
                        continue; // Skip this specific submission if its ID is missing
                    }
                    // --- End Check ---

                    const { error: submissionError } = await supabase
                        .from("submissions")
                        .insert({ // Consider upsert on (user_id, submission_id)
                            problem_id: problemId,
                            user_id: userId,
                            status: submission.status,
                            // Convert Unix timestamp string from Python to ISO string for Supabase
                            timestamp: submission.timestamp ? new Date(parseInt(submission.timestamp, 10) * 1000).toISOString() : new Date().toISOString(),
                            runtime: submission.runtime,
                            memory: submission.memory,
                            language: submission.language,
                            // ***** THIS LINE WAS THE FIX *****
                            submission_id: submission.submission_id, // Use submission.submission_id
                            // *****-----------------------*****
                            code: submission.code,
                        });

                    if (submissionError) {
                        if (submissionError.code === '23505') {
                            console.warn(`Submission insert skipped (likely exists): ${submission.submission_id}`);
                            continue;
                        }
                        console.error("Submission insert error:", submissionError);
                        // If one submission fails, maybe continue with others? For now, returning error.
                        return res.status(500).json({ error: "Failed to store submission", details: submissionError.message });
                    }
                }
            }
            // --- End Supabase Logic ---

            res.json({ message: "Data fetched and stored in Supabase" });
        } catch (parseError) {
            console.error("Parse error:", parseError);
            console.error("Raw stdout that failed parsing:", stdout);
            return res.status(500).json({
                error: "Invalid data format from fetcher",
                details: "Failed to process data from fetcher script.",
            });
        }
    });
});

// --- Generate Notes Route (No changes needed here) ---
router.post("/generate-notes/:problemId", async (req: AuthRequest, res) => {
    const { problemId } = req.params;
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
    }
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

        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`; // Using 1.5 Flash
        console.log("Calling Gemini API...");

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
                    // Optional: Add generationConfig if needed
                    // generationConfig: {
                    //     temperature: 0.7,
                    //     topK: 1,
                    //     topP: 1,
                    //     maxOutputTokens: 2048,
                    // },
                },
                {
                    headers: { "Content-Type": "application/json" },
                    timeout: 60000
                }
            );
        } catch (geminiError: any) {
            console.error("Gemini API request failed:", geminiError.response?.data || geminiError.message);
            return res.status(502).json({ error: "Failed to communicate with AI service." });
        }

        let generatedText = "";
        try {
            // Updated structure check for Gemini 1.5 Flash
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
                            // Only assign if the section exists in our structure
                            if (sections.hasOwnProperty(currentSection)) {
                                sections[currentSection] = currentContent.join("\n").trim();
                            }
                        }
                        currentSection = sectionMap[marker];
                        currentContent = [line.substring(marker.length).trim()];
                        matched = true;
                        break;
                    }
                }
                if (!matched && currentSection && line.trim() !== "") {
                    currentContent.push(line);
                }
            }
            // Add the last section's content
            if (currentSection && sections.hasOwnProperty(currentSection) && currentContent.length > 0) {
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
                .maybeSingle();

            if (fetchNoteError && fetchNoteError.code !== 'PGRST116') {
                console.error("Error checking existing note:", fetchNoteError);
                throw new Error("Failed to check existing note");
            }

            let noteData;
            const notePayload = {
                user_id: userId,
                problem_id: parseInt(problemId, 10),
                title: problemData.title, // Use title from fetched problemData
                notes: sections, // Store the parsed sections object
                updated_at: new Date().toISOString(),
            };

            if (existingNote) {
                // Update existing note
                delete (notePayload as any).title; // Don't update title on existing notes usually
                delete (notePayload as any).problem_id; // Don't update foreign key
                delete (notePayload as any).user_id; // Don't update user_id
                const { data, error: updateError } = await supabase
                    .from("notes")
                    .update(notePayload)
                    .eq("id", existingNote.id)
                    .select()
                    .single();

                if (updateError) {
                    console.error("Error updating note in Supabase:", updateError);
                    throw new Error("Failed to update note in Supabase");
                }
                noteData = data;
                console.log("Note updated successfully.");
            } else {
                // Insert new note
                // updated_at might be handled by DB default, remove if so
                // delete (notePayload as any).updated_at;
                const { data, error: insertError } = await supabase
                    .from("notes")
                    .insert(notePayload)
                    .select()
                    .single();

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
        console.error("Generate notes route error:", err);
        return res.status(500).json({
            error: "Failed to generate notes",
            details: err.message || "An unexpected error occurred.",
        });
    }
});


export default router;