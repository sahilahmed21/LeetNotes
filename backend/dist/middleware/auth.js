"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const supabase_1 = require("../supabase");
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        const { data, error } = yield supabase_1.supabase.auth.getUser(token);
        if (error || !(data === null || data === void 0 ? void 0 : data.user)) {
            console.error("Invalid or expired token:", error === null || error === void 0 ? void 0 : error.message);
            return res.status(401).json({ error: "Invalid or expired token" });
        }
        req.userId = data.user.id;
        console.log("User authenticated, userId:", req.userId); // Debug log
        next();
    }
    catch (err) {
        console.error("Auth middleware error:", err);
        return res.status(500).json({ error: "Internal server error during authentication" });
    }
});
exports.authMiddleware = authMiddleware;
