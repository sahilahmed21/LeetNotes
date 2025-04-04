import express from "express";
import cors from "cors";
import { authMiddleware } from "./middleware/auth";
import apiRoutes from "./routes/api";

const app = express();

// --- Configure CORS Options ---
// Define the origins allowed to access your backend
const allowedOrigins = [
    'https://leetnotes.netlify.app', // Your deployed frontend **REQUIRED**
    // Add 'http://localhost:xxxx' if you still need local frontend development access
    // e.g., 'http://localhost:5173' if your local React runs there
];

const corsOptions: cors.CorsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests) OR from allowed origins
        // Important: origin can be undefined for non-browser requests or certain configurations
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.error(`CORS Error: Origin '${origin}' not allowed.`); // Log blocked origins for debugging
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Allow standard methods + OPTIONS for preflight
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'], // Explicitly allow headers sent by your frontend
    credentials: true, // Allow sending cookies or Authorization headers
};

// --- Use the configured CORS middleware ---
// IMPORTANT: Place this BEFORE any routes or other middleware that needs CORS headers
app.use(cors(corsOptions));
// Explicitly handle preflight 'OPTIONS' requests for all routes
// Browsers send this before POST/PUT etc. with custom headers to check permissions
app.options('*', cors(corsOptions));

// Standard Middleware (AFTER CORS)
app.use(express.json());

// Public route for testing
app.get("/", (req, res) => {
    res.json({ message: "Welcome to the LeetCode Notes API" });
});

// Protected API routes (AFTER CORS and express.json)
app.use("/api", authMiddleware, apiRoutes);
console.log("API routes mounted");

// Start server
// Render provides the PORT environment variable automatically
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Allowed CORS origins:', allowedOrigins); // Log allowed origins on startup
});