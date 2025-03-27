import express from "express";
import cors from "cors";
import { authMiddleware } from "./middleware/auth";
import apiRoutes from "./routes/api";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Public route for testing
app.get("/", (req, res) => {
    res.json({ message: "Welcome to the LeetCode Notes API" });
});

// Protected API routes
app.use("/api", authMiddleware, apiRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});