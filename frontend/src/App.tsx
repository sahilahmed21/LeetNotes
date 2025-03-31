import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./components/Login";
import Home from "./pages/Home";
import FetchPage from "./pages/FetchPage";
import Notes from "./pages/Notes";
import NotesDetail from "./pages/NotesDetail";
import "./App.css";

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login onLogin={() => { }} />} />
                <Route path="/home" element={<Home />} />
                <Route path="/fetch" element={<FetchPage />} />
                <Route path="/notes/:problemId" element={<Notes />} />
                <Route path="/notes-detail/:problemId" element={<NotesDetail />} />
            </Routes>
        </Router>
    );
};

export default App;