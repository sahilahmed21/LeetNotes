// frontend/src/App.tsx

import React from "react";
import Home from "./pages/Home";
import "./App.css";

const App: React.FC = () => {
    return (
        <div className="App">
            <header>
                <h1>CodeScribeAI</h1>
                <p>Your AI-powered LeetCode notes generator</p>
            </header>
            <main>
                <Home />
            </main>
        </div>
    );
};

export default App;