"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = require("./middleware/auth");
const api_1 = __importDefault(require("./routes/api"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Public route for testing
app.get("/", (req, res) => {
    res.json({ message: "Welcome to the LeetCode Notes API" });
});
// Protected API routes
app.use("/api", auth_1.authMiddleware, api_1.default);
console.log("API routes mounted");
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
