import { supabase } from "../supabase";
import { Request, Response, NextFunction } from "express";

// Extend the Request type to include custom properties
export interface AuthRequest extends Request {
    userId?: string;
}

export const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        console.log("Authorization Header:", authHeader); // Debug log

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.error("Authorization header missing or malformed");
            return res.status(401).json({ error: "Authorization header missing or malformed" });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            console.error("No token provided in Authorization header");
            return res.status(401).json({ error: "No token provided" });
        }

        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data?.user) {
            console.error("Invalid or expired token:", error?.message);
            return res.status(401).json({ error: "Invalid or expired token" });
        }

        req.userId = data.user.id;
        console.log("User authenticated, userId:", req.userId); // Debug log
        next();
    } catch (err) {
        console.error("Auth middleware error:", err);
        return res.status(500).json({ error: "Internal server error during authentication" });
    }
};