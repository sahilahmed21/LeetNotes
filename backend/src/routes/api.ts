// backend/src/routes/api.ts
import { Router } from "express";
import { exec } from "child_process";
import axios from "axios";
import path from 'path';
import { supabase } from "../supabase"; // Ensure path is correct
import { AuthRequest } from "../middleware/auth"; // Ensure path is correct

const router = Router();

// --- /fetch-data route (Current Version) ---
router.post("/fetch-data", async (req: AuthRequest, res) => {
    const { username, session_cookie, csrf_token } = req.body;
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
    }

    const projectRoot = path.join(__dirname, '..', '..', '..');
    const fetcherDirName = 'LeetcodeDataFetcher'; // Make sure this matches your actual folder name
    const fetcherPath = path.join(projectRoot, fetcherDirName, 'main.py');
    const pythonExecutable = 'python'; // Assumes python is available and linked correctly on Render

    console.log("Calculated Fetcher path:", fetcherPath);

    const command = `${pythonExecutable} "${fetcherPath}" --username "${username}" --session "${session_cookie}" --csrf "${csrf_token}"`;
    console.log("Executing command:", command);

    exec(command, async (error, stdout, stderr) => {
        // Error handling from current version
        if (error) {
            console.error("Execution error:", { message: error.message, code: error.code, cmd: error.cmd });
            const detailMessage = stderr ? `${error.message}\nStderr: ${stderr}` : error.message;
            // Avoid sending potentially sensitive stderr to client
            return res.status(500).json({ error: "Failed to execute Python script", details: `Script execution failed. Check server logs. Code: ${error.code}` });
        }
        if (stderr) {
            console.warn("Script stderr:", stderr);
            if (stderr.includes("Authentication failed") || stderr.includes("Rate limited") || stderr.includes("Traceback") || stderr.toLowerCase().includes("error:")) {
                console.error("Python script reported critical error via stderr.");
                return res.status(500).json({
                    error: "Python script reported an error",
                    details: "Error during data fetching. Check server logs for Python script errors.",
                });
            }
        }
        if (!stdout || stdout.trim() === "") {
            console.error("Python script produced empty stdout. Stderr:", stderr || '(empty)');
            return res.status(500).json({ error: "Python script did not produce expected data", details: "Fetcher script returned no data. Check server logs." });
        }
        // --- End Error Handling ---

        try {
            const data = JSON.parse(stdout);
            // console.log("Parsed data from Python script:", JSON.stringify(data, null, 2).substring(0, 500) + '...');

            // --- Supabase Logic (Current Version with conflict handling) ---
            const { error: statsError } = await supabase
                .from("profile_stats")
                .upsert(
                    {
                        user_id: userId,
                        total_solved: data.profile_stats?.total_solved || 0,
                        easy: data.profile_stats?.easy || 0,
                        medium: data.profile_stats?.medium || 0,
                        hard: data.profile_stats?.hard || 0,
                    },
                    { onConflict: "user_id" }
                );
            if (statsError) {
                console.error("Profile stats upsert error:", statsError);
                return res.status(500).json({ error: "Failed to store profile stats", details: statsError.message });
            }

            for (const problem of data.problems || []) {
                let problemId: number | string | null = null;
                try { // Try inserting problem
                    const { data: problemDataResult, error: problemInsertError } = await supabase
                        .from("problems")
                        .insert({ /* ... problem fields ... */
                            user_id: userId, title: problem.title, difficulty: problem.difficulty,
                            description: problem.description, tags: problem.tags, slug: problem.slug,
                        })
                        .select("id")
                        .single();
                    if (problemInsertError) throw problemInsertError;
                    if (problemDataResult) problemId = problemDataResult.id;
                } catch (problemInsertError: any) { // Handle insert error (e.g., conflict)
                    if (problemInsertError.code === '23505') {
                        console.warn(`Problem insert skipped (conflict): ${problem.slug} for user ${userId}. Querying existing.`);
                        const { data: existingProblemData, error: queryError } = await supabase.from("problems").select("id").eq("user_id", userId).eq("slug", problem.slug).single();
                        if (queryError) { console.error(`Error querying existing problem ${problem.slug}:`, queryError); continue; }
                        if (existingProblemData) { problemId = existingProblemData.id; }
                        else { console.error(`Conflict on insert but failed to query existing problem ${problem.slug}.`); continue; }
                    } else { console.error(`Problem insert error for ${problem.slug}:`, problemInsertError); continue; }
                }

                if (!problemId) { console.warn(`Could not get problem ID for ${problem.slug}. Skipping submissions.`); continue; }

                // Insert submissions
                for (const submission of problem.submissions || []) {
                    if (!submission.submission_id) { console.warn(`Submission object missing 'submission_id' for problem ${problem.slug}.`); continue; }
                    try {
                        const { error: submissionError } = await supabase.from("submissions").insert({ /* ... submission fields ... */
                            problem_id: problemId, user_id: userId, status: submission.status,
                            timestamp: submission.timestamp ? new Date(parseInt(submission.timestamp, 10) * 1000).toISOString() : new Date().toISOString(),
                            runtime: submission.runtime, memory: submission.memory, language: submission.language,
                            submission_id: submission.submission_id, code: submission.code,
                        });
                        if (submissionError) throw submissionError;
                    } catch (submissionInsertError: any) {
                        if (submissionInsertError.code === '23505') { console.warn(`Submission insert skipped (conflict): ${submission.submission_id}`); }
                        else { console.error(`Submission insert error for ${submission.submission_id}:`, submissionInsertError); }
                        continue; // Continue with next submission even if one fails
                    }
                }
            }
            // --- End Supabase Logic ---
            res.json({ message: "Data fetched and stored successfully." });
        } catch (parseError: any) { // Catch JSON parsing errors
            console.error("JSON Parse error:", parseError);
            console.error("Raw stdout that failed parsing:", stdout);
            return res.status(500).json({ error: "Invalid data format from fetcher script", details: "Failed to process data. Check server logs." });
        }
    });
});


// --- Generate Notes Route (Previous "Working" Version Logic) ---
router.post("/generate-notes/:problemId", async (req: AuthRequest, res) => {
    const { problemId } = req.params;
    const userId = req.userId;

    console.log(`Received request to generate notes for problemId: ${problemId}, userId: ${userId}`); // Log request start

    if (!userId) {
        console.error("User ID not found in authenticated request.");
        return res.status(401).json({ error: "User ID not found" });
    }
    if (!problemId) {
        console.error("Problem ID missing from request parameters.");
        return res.status(400).json({ error: "Problem ID is required" });
    }

    // Validate problemId looks like a number if necessary (depending on DB schema)
    const problemIdNum = parseInt(problemId, 10);
    if (isNaN(problemIdNum)) {
        console.error(`Invalid non-numeric problem ID received: ${problemId}`);
        return res.status(400).json({ error: "Invalid Problem ID format" });
    }

    let problemData; // Declare problemData outside the try block
    try {
        // Step 1: Fetch problem data from Supabase
        console.log(`Fetching problem details from Supabase for problemId: ${problemIdNum}, userId: ${userId}`);
        const { data, error: problemError } = await supabase
            .from("problems")
            .select("*, submissions(*)") // Fetch related submissions
            .eq("id", problemIdNum)      // Use numeric ID for query if column is integer
            .eq("user_id", userId)
            .single();

        if (problemError) {
            console.error("Supabase error fetching problem:", problemError);
            if (problemError.code === 'PGRST116') { // Specific code for row not found
                return res.status(404).json({ error: "Problem not found", details: `Problem with ID ${problemIdNum} not found for this user.` });
            }
            // Throw other Supabase errors to be caught by the main catch block
            throw new Error(`Supabase problem fetch error: ${problemError.message}`);
        }

        if (!data) {
            // Should be caught by .single() error PGRST116, but double-check
            console.error(`Problem data unexpectedly null for ID ${problemIdNum} after Supabase query.`);
            return res.status(404).json({ error: "Problem not found" });
        }
        problemData = data; // Assign to outer scope variable
        console.log(`Successfully fetched problem: ${problemData.title}`);

        // Step 2: Check for Gemini API Key
        if (!process.env.GEMINI_API_KEY) {
            console.error("FATAL: GEMINI_API_KEY environment variable not set on server.");
            return res.status(500).json({ error: "Server configuration error", details: "Missing API key." });
        }

        // Step 3: Construct Gemini Prompt
        console.log("Constructing prompt for Gemini API...");
        // Limit submission data length in prompt if it's potentially huge
        const submissionsForPrompt = JSON.stringify(problemData.submissions?.slice(0, 5) || []).substring(0, 2000); // Limit to first 5 & max chars
        const prompt = `
You are tasked with generating structured notes for a specific LeetCode problem. The notes must strictly follow the format below, and the content must be relevant to the given problem titled "${problemData.title}".

Format:
**Topic:** [Problem Title]
**Question:** [Problem Description]
**Intuition:** [Explain the thought process and approach]
**Example:** [Provide a step-by-step example]
**Counterexample:** [Provide a case where the solution might fail or edge cases]
**Pseudocode:** [Provide pseudocode for the solution]
**Mistake I Did:** [Analyze the submission snippets and identify a potential mistake or area for improvement]
**Code:** [Provide one concise accepted code snippet, preferably the most recent or fastest]

Problem Details:
- Title: ${problemData.title}
- Description: ${problemData.description}
- Difficulty: ${problemData.difficulty}
- Tags: ${Array.isArray(problemData.tags) ? problemData.tags.join(", ") : 'N/A'}
- Recent Submissions Snippet: ${submissionsForPrompt}

Ensure the notes are strictly for the problem titled "${problemData.title}". Focus on clarity and conciseness.
`;
        // console.log("Prompt length:", prompt.length); // Optional: log prompt length

        // Step 4: Call Gemini API
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        console.log(`Calling Gemini API: ${geminiApiUrl.split('?')[0]}...`); // Log URL without key

        let geminiResponse;
        try {
            geminiResponse = await axios.post(
                geminiApiUrl,
                { contents: [{ parts: [{ text: prompt }] }] },
                { headers: { "Content-Type": "application/json" }, timeout: 90000 } // 90 sec timeout
            );
            console.log("Gemini API call successful.");
        } catch (geminiError: any) {
            console.error("Gemini API request failed:", axios.isAxiosError(geminiError) ? { status: geminiError.response?.status, data: geminiError.response?.data, message: geminiError.message } : geminiError);
            // Return 502 Bad Gateway if Gemini call itself fails
            return res.status(502).json({ error: "Failed to communicate with AI service.", details: axios.isAxiosError(geminiError) ? `Status ${geminiError.response?.status}` : geminiError.message });
        }

        // Step 5: Parse Gemini Response
        let generatedText = "";
        try {
            // Check response structure carefully
            if (geminiResponse.data && geminiResponse.data.candidates && geminiResponse.data.candidates.length > 0) {
                const candidate = geminiResponse.data.candidates[0];
                // Check for safety ratings or finish reasons that indicate blocked content
                if (candidate.finishReason && candidate.finishReason !== 'STOP') {
                    console.warn(`Gemini generation finished with reason: ${candidate.finishReason}`);
                    // Consider how to handle blocked content, maybe return specific error
                    if (candidate.finishReason === 'SAFETY') {
                        console.error("Gemini content blocked due to safety filters.");
                        return res.status(500).json({ error: "AI generation failed", details: "Content blocked by safety filters." });
                    }
                }
                // Proceed if content seems okay
                if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0 && candidate.content.parts[0].text) {
                    generatedText = candidate.content.parts[0].text;
                    console.log("Successfully extracted generated text from Gemini response.");
                    // console.log("Generated Text Snippet:", generatedText.substring(0, 200) + "..."); // Log snippet
                } else {
                    throw new Error("Missing 'text' in Gemini response parts structure.");
                }
            } else {
                console.error("Unexpected Gemini API response structure:", JSON.stringify(geminiResponse.data).substring(0, 500));
                throw new Error("No valid candidates found in Gemini response.");
            }
        } catch (parseError: any) {
            console.error("Error parsing Gemini API response:", parseError);
            return res.status(500).json({ error: "Failed to parse response from AI service.", details: parseError.message });
        }

        // Step 6: Parse Generated Text into Sections
        console.log("Parsing generated text into sections...");
        const sections = { topic: "", question: "", intuition: "", example: "", counterexample: "", pseudocode: "", mistake: "", code: "" };
        try {
            const lines = generatedText.split("\n");
            let currentSectionKey: keyof typeof sections | null = null; // Track current section key
            let currentContent: string[] = [];

            const sectionMap: { [key: string]: keyof typeof sections } = {
                "**Topic:**": "topic", "**Question:**": "question", "**Intuition:**": "intuition",
                "**Example:**": "example", "**Counterexample:**": "counterexample",
                "**Pseudocode:**": "pseudocode", "**Mistake I Did:**": "mistake", "**Code:**": "code"
            };

            for (const line of lines) {
                let markerFound = false;
                for (const marker in sectionMap) {
                    if (line.startsWith(marker)) {
                        // Save previous section's content
                        if (currentSectionKey && sections.hasOwnProperty(currentSectionKey)) {
                            sections[currentSectionKey] = currentContent.join("\n").trim();
                        }
                        // Start new section
                        currentSectionKey = sectionMap[marker];
                        currentContent = [line.substring(marker.length).trim()]; // Start new content list
                        markerFound = true;
                        break;
                    }
                }
                // If line is not a marker and we are inside a section, append content
                if (!markerFound && currentSectionKey && line.trim() !== "") {
                    currentContent.push(line);
                }
            }
            // Save the last section's content
            if (currentSectionKey && sections.hasOwnProperty(currentSectionKey)) {
                sections[currentSectionKey] = currentContent.join("\n").trim();
            }

            // Ensure Topic and Question are populated, falling back to problemData if AI missed them
            if (!sections.topic) sections.topic = problemData.title;
            if (!sections.question) sections.question = problemData.description; // Maybe summarize description? For now, full.

            console.log("Successfully parsed sections.");
            // console.log("Parsed Sections Data:", sections); // Optional: Log parsed data

        } catch (parseError: any) {
            console.error("Error parsing generated text into sections:", parseError);
            // Return 500 but maybe include the raw text for debugging if safe
            return res.status(500).json({ error: "Failed to structure generated notes.", details: parseError.message });
        }

        // --- Store or Update Note in Supabase (MODIFIED BLOCK) ---
        console.log("Attempting to Store/Update note in Supabase...");
        try {
            const { data: existingNote, error: fetchNoteError } = await supabase
                .from("notes")
                .select("id")
                .eq("problem_id", problemIdNum)
                .eq("user_id", userId)
                .maybeSingle();

            if (fetchNoteError && fetchNoteError.code !== 'PGRST116') {
                console.error("Supabase error checking existing note:", fetchNoteError);
                throw new Error(`Supabase note check error: ${fetchNoteError.message}`);
            }

            let noteData;
            const notePayloadBase = {
                user_id: userId,
                problem_id: problemIdNum,
                title: sections.topic || problemData.title,
                notes: sections,
            };

            if (existingNote) {
                console.log(`Updating existing note (ID: ${existingNote.id})`);
                const updatePayload = {
                    ...notePayloadBase,
                    updated_at: new Date().toISOString(),
                };
                delete (updatePayload as any).user_id;
                delete (updatePayload as any).problem_id;

                console.log("Update payload:", updatePayload);

                const { data, error: updateError } = await supabase
                    .from("notes")
                    .update(updatePayload)
                    .eq("id", existingNote.id)
                    .select()
                    .single();

                if (updateError) {
                    console.error("Supabase error updating note:", updateError);
                    throw new Error(`Supabase note update error: ${updateError.message}`);
                }
                noteData = data;
                console.log("Note updated successfully.");
            } else {
                console.log(`Inserting new note for problemId: ${problemIdNum}`);
                const insertPayload = {
                    ...notePayloadBase,
                };
                console.log("Insert payload:", insertPayload);

                const { data, error: insertError } = await supabase
                    .from("notes")
                    .insert(insertPayload)
                    .select()
                    .single();

                if (insertError) {
                    console.error("Supabase error inserting note:", insertError);
                    throw new Error(`Supabase note insert error: ${insertError.message}`);
                }
                noteData = data;
                console.log("Note inserted successfully.");
            }

            console.log("Sending successful 200 response to client.");
            res.status(200).json(noteData);
        } catch (supabaseSaveError: any) {
            console.error("!!! Supabase error during note save/update block:", supabaseSaveError);
            return res.status(500).json({ error: "Failed to store note in database.", details: supabaseSaveError.message });
        }
        // --- END OF MODIFIED SUPABASE SAVE BLOCK ---

    } catch (err: any) {
        console.error("Unhandled error in /generate-notes route (before note save):", err);
        return res.status(500).json({
            error: "Failed to generate notes",
            details: err.message || "An unexpected server error occurred.",
        });
    }
});

export default router;