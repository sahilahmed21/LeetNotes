import { Router } from "express";
import { exec } from "child_process";
import axios from "axios";
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

    const fetcherPath = "C:\\personal stuff\\WEB D\\projects\\LeetNotes\\LeetcodeDataFetcher\\main.py";
    console.log("Fetcher path:", fetcherPath);

    exec(
        `python "${fetcherPath}" --username ${username} --session ${session_cookie} --csrf ${csrf_token}`,
        async (error, stdout, stderr) => {
            console.log("Full exec command:", `python "${fetcherPath}" --username ${username} --session ${session_cookie} --csrf ${csrf_token}`);
            if (error) {
                console.error("Execution error:", error);
                return res.status(500).json({ error: "Failed to fetch LeetCode data", details: error.message });
            }
            if (stderr) {
                console.warn("Script stderr:", stderr);
                if (stderr.includes("Authentication failed") || stderr.includes("Rate limited")) {
                    return res.status(500).json({
                        error: "Failed to fetch LeetCode data",
                        details: stderr,
                    });
                }
            }

            try {
                const data = JSON.parse(stdout);
                console.log("Parsed data from Python script:", JSON.stringify(data, null, 2));

                // Insert or update profile stats
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

                // Insert problems and submissions
                for (const problem of data.problems || []) {
                    const { data: problemData, error: problemError } = await supabase
                        .from("problems")
                        .insert({
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
                        console.error("Problem insert error:", problemError);
                        return res.status(500).json({ error: "Failed to store problem", details: problemError.message });
                    }

                    const problemId = problemData.id;
                    for (const submission of problem.submissions || []) {
                        const { error: submissionError } = await supabase
                            .from("submissions")
                            .insert({
                                problem_id: problemId,
                                user_id: userId,
                                status: submission.status,
                                timestamp: submission.timestamp,
                                runtime: submission.runtime,
                                memory: submission.memory,
                                language: submission.language,
                                submission_id: submission.id,
                                code: submission.code,
                            });
                        if (submissionError) {
                            console.error("Submission insert error:", submissionError);
                            return res.status(500).json({ error: "Failed to store submission", details: submissionError.message });
                        }
                    }
                }

                res.json({ message: "Data fetched and stored in Supabase" });
            } catch (parseError) {
                console.error("Parse error:", parseError);
                return res.status(500).json({
                    error: "Invalid data format from fetcher",
                    details: parseError instanceof Error ? parseError.message : String(parseError),
                });
            }
        }
    );
});

// Generate notes for a specific problem using Gemini API and store in Supabase
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

        // Construct the prompt for Gemini API
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
- Tags: ${problemData.tags.join(", ")}
- Submissions: ${JSON.stringify(problemData.submissions)}

Ensure that the notes are generated for the problem titled "${problemData.title}" and match the description provided. Do not generate notes for a different problem.
`;

        // Call Gemini API
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        console.log("Gemini API URL:", geminiApiUrl);
        console.log("Prompt sent to Gemini API:", prompt);

        let response;
        try {
            response = await axios.post(
                geminiApiUrl,
                {
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt,
                                },
                            ],
                        },
                    ],
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        } catch (geminiError: any) {
            console.error("Gemini API error:", geminiError.response?.data || geminiError.message);
            throw new Error("Failed to call Gemini API");
        }

        // Parse the Gemini API response
        let generatedText;
        try {
            generatedText = response.data.candidates[0].content.parts[0].text;
            console.log("Generated text from Gemini API:", generatedText);
        } catch (parseError) {
            console.error("Error parsing Gemini API response:", parseError);
            throw new Error("Failed to parse Gemini API response");
        }

        // Parse the generated text into structured sections
        const sections = {
            topic: problemData.title, // Default to problem title if not found
            question: problemData.description, // Default to problem description if not found
            intuition: "",
            example: "",
            counterexample: "",
            pseudocode: "",
            mistake: "",
            code: "",
        };

        try {
            const lines = generatedText.split("\n");
            let currentSection = "";
            let currentContent: string[] = [];

            for (const line of lines) {
                if (line.startsWith("**Topic:**")) {
                    if (currentSection && currentContent.length > 0) {
                        sections[currentSection as keyof typeof sections] = currentContent.join("\n").trim();
                        currentContent = [];
                    }
                    currentSection = "topic";
                    currentContent.push(line.replace("**Topic:**", "").trim());
                } else if (line.startsWith("**Question:**")) {
                    if (currentSection && currentContent.length > 0) {
                        sections[currentSection as keyof typeof sections] = currentContent.join("\n").trim();
                        currentContent = [];
                    }
                    currentSection = "question";
                    currentContent.push(line.replace("**Question:**", "").trim());
                } else if (line.startsWith("**Intuition:**")) {
                    if (currentSection && currentContent.length > 0) {
                        sections[currentSection as keyof typeof sections] = currentContent.join("\n").trim();
                        currentContent = [];
                    }
                    currentSection = "intuition";
                    currentContent.push(line.replace("**Intuition:**", "").trim());
                } else if (line.startsWith("**Example:**")) {
                    if (currentSection && currentContent.length > 0) {
                        sections[currentSection as keyof typeof sections] = currentContent.join("\n").trim();
                        currentContent = [];
                    }
                    currentSection = "example";
                    currentContent.push(line.replace("**Example:**", "").trim());
                } else if (line.startsWith("**Counterexample:**")) {
                    if (currentSection && currentContent.length > 0) {
                        sections[currentSection as keyof typeof sections] = currentContent.join("\n").trim();
                        currentContent = [];
                    }
                    currentSection = "counterexample";
                    currentContent.push(line.replace("**Counterexample:**", "").trim());
                } else if (line.startsWith("**Pseudocode:**")) {
                    if (currentSection && currentContent.length > 0) {
                        sections[currentSection as keyof typeof sections] = currentContent.join("\n").trim();
                        currentContent = [];
                    }
                    currentSection = "pseudocode";
                    currentContent.push(line.replace("**Pseudocode:**", "").trim());
                } else if (line.startsWith("**Mistake I Did:**")) {
                    if (currentSection && currentContent.length > 0) {
                        sections[currentSection as keyof typeof sections] = currentContent.join("\n").trim();
                        currentContent = [];
                    }
                    currentSection = "mistake";
                    currentContent.push(line.replace("**Mistake I Did:**", "").trim());
                } else if (line.startsWith("**Code:**")) {
                    if (currentSection && currentContent.length > 0) {
                        sections[currentSection as keyof typeof sections] = currentContent.join("\n").trim();
                        currentContent = [];
                    }
                    currentSection = "code";
                    currentContent.push(line.replace("**Code:**", "").trim());
                } else if (line.trim() !== "") {
                    currentContent.push(line);
                }
            }

            // Add the last section
            if (currentSection && currentContent.length > 0) {
                sections[currentSection as keyof typeof sections] = currentContent.join("\n").trim();
            }
        } catch (parseError) {
            console.error("Error parsing generated text into sections:", parseError);
            throw new Error("Failed to parse generated text into sections");
        }

        console.log("Parsed sections:", sections);

        // Store or update the note in Supabase
        try {
            const { data: existingNote, error: fetchNoteError } = await supabase
                .from("notes")
                .select("id")
                .eq("problem_id", problemId)
                .eq("user_id", userId)
                .single();

            if (fetchNoteError && fetchNoteError.code !== "PGRST116") {
                console.error("Error checking existing note:", fetchNoteError);
                throw new Error("Failed to check existing note");
            }

            let noteData;
            if (existingNote) {
                // Update existing note
                const { data, error: updateError } = await supabase
                    .from("notes")
                    .update({
                        title: problemData.title,
                        notes: sections,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", existingNote.id)
                    .select()
                    .single();

                if (updateError) {
                    console.error("Error updating note in Supabase:", updateError);
                    throw new Error("Failed to update note in Supabase");
                }
                noteData = data;
            } else {
                // Insert new note
                const { data, error: insertError } = await supabase
                    .from("notes")
                    .insert({
                        user_id: userId,
                        problem_id: problemId,
                        title: problemData.title,
                        notes: sections,
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error("Error inserting note in Supabase:", insertError);
                    throw new Error("Failed to insert note in Supabase");
                }
                noteData = data;
            }

            res.json(noteData);
        } catch (supabaseError) {
            console.error("Supabase error:", supabaseError);
            throw new Error("Failed to store note in Supabase");
        }
    } catch (err: any) {
        console.error("Generate notes error:", err);
        return res.status(500).json({
            error: "Failed to generate notes",
            details: err.response?.data?.error || err.message,
        });
    }
});

export default router;