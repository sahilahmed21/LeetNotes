import { Router } from "express";
import { exec } from "child_process";
import axios from "axios";
import { supabase } from "../supabase";
import { AuthRequest } from "../middleware/auth";
import path from "path";

const router = Router();

// Fetch LeetCode data and store in Supabase
router.post("/fetch-data", async (req: AuthRequest, res) => {
    const { username, session_cookie, csrf_token } = req.body;
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
    }

    // Check if the user exists in auth.users
    const { data: authUser, error: authError } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .single();

    if (authError || !authUser) {
        console.error("User not found in auth.users:", authError);
        return res.status(400).json({
            error: "User not found in authentication system",
            details: authError?.message || "User does not exist",
        });
    }

    // Use an absolute path to main.py
    const fetcherPath = "C:\\personal stuff\\WEB D\\projects\\LeetNotes\\LeetcodeDataFetcher\\main.py";
    console.log("Fetcher path:", fetcherPath);

    exec(
        `python "${fetcherPath}" --username ${username} --session ${session_cookie} --csrf ${csrf_token}`,
        async (error, stdout, stderr) => {
            console.log("Full exec command:", `python "${fetcherPath}" --username ${username} --session ${session_cookie} --csrf ${csrf_token}`);
            if (error) {
                console.error("Execution error:", error);
                console.error("Stderr:", stderr);
                console.error("Error code:", error.code);
                console.error("Error signal:", error.signal);
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
                console.log("Inserting profile stats for user:", userId);
                console.log("Profile stats to insert:", {
                    user_id: userId,
                    total_solved: data.profile_stats.total_solved || 0,
                    easy: data.profile_stats.easy || 0,
                    medium: data.profile_stats.medium || 0,
                    hard: data.profile_stats.hard || 0,
                });
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
                    console.error("Error details:", JSON.stringify(statsError, null, 2));
                    return res.status(500).json({
                        error: "Failed to store profile stats",
                        details: statsError.message || "Unknown error",
                        fullError: JSON.stringify(statsError, null, 2),
                    });
                }
                console.log("Profile stats inserted successfully");

                // Insert problems and submissions
                for (const problem of data.problems || []) {
                    console.log("Inserting problem:", problem.title);
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
                        return res.status(500).json({
                            error: "Failed to store problem",
                            details: problemError.message,
                        });
                    }

                    const problemId = problemData.id;
                    console.log("Problem inserted with ID:", problemId);

                    // Insert submissions for this problem
                    for (const submission of problem.submissions || []) {
                        console.log("Inserting submission for problem ID:", problemId);
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
                            return res.status(500).json({
                                error: "Failed to store submission",
                                details: submissionError.message,
                            });
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

export default router;