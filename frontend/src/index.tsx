// frontend/src/index.ts

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css"; // Import global styles

// Create a root element to render the app
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);

// Render the App component
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// // Optional: Report web vitals for performance monitoring (you can remove this if not needed)
// if (process.env.NODE_ENV === "development") {
//     import("./reportWebVitals").then(({ reportWebVitals }) => {
//         reportWebVitals(console.log);
//     });
// }