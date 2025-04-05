// backend/src/server.ts
import express from "express";
import cors from "cors";
import { authMiddleware } from "./middleware/auth"; // Ensure path is correct
import apiRoutes from "./routes/api";           // Ensure path is correct

const app = express();

// --- Configure CORS Options ---
const allowedOrigins = [
    'https://leetnotes.netlify.app', // Your deployed frontend
    // Add localhost origins if needed for local development
    // 'http://localhost:3000', // Example if frontend runs locally on 3000 (Vite)
    // 'http://localhost:5173', // Example if frontend runs locally on 5173 (Vite default)
];

const corsOptions: cors.CorsOptions = {
    origin: function (origin, callback) {
        // Log the origin for every request (including preflight)
        console.log(`CORS Check: Request Origin: ${origin}`);

        // Allow requests with no origin OR from allowed origins
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            console.log(`CORS Check: Allowing origin: ${origin || 'No Origin'}`);
            callback(null, true); // Allow
        } else {
            console.error(`CORS Check: Blocking origin: ${origin}`); // Log blocked origins
            callback(new Error(`Origin ${origin} not allowed by CORS`)); // Block
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Standard methods
    // Ensure all headers sent by frontend are listed, especially custom ones or Authorization
    allowedHeaders: ['Content-Type', 'Authorization'], // Removed 'x-user-id' as it shouldn't be needed
    credentials: true, // Allow cookies/auth headers
    maxAge: 86400, // Optional: Cache preflight response for 1 day
};

// --- Apply CORS Middleware FIRST ---
// Handle OPTIONS requests explicitly for all routes BEFORE any other routes/middleware
// This ensures preflight requests are handled correctly.
app.options('*', cors(corsOptions)); // Respond to all OPTIONS requests

// Use CORS for all other requests
app.use(cors(corsOptions));

// --- Standard Middleware (AFTER CORS) ---
app.use(express.json()); // Parse JSON bodies

// --- Public Routes (Example) ---
app.get("/", (req, res) => {
    res.json({ message: "Welcome to the LeetCode Notes API - v2" });
});

// --- Protected API Routes ---
// Apply auth middleware specifically to the /api routes
// IMPORTANT: Ensure authMiddleware correctly handles token verification
// and calls next() ONLY on success, otherwise sends error response.
app.use("/api", authMiddleware, apiRoutes);
console.log("API routes mounted under /api");

// --- Global Error Handler (Optional but Recommended) ---
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled Error:", err.stack || err);
    res.status(err.status || 500).json({
        error: "Server Error",
        message: err.message || "An unexpected error occurred.",
    });
});


// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Allowed CORS origins:', allowedOrigins);
});