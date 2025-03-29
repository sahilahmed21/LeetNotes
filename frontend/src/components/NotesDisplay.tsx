import React from "react";
import { Note } from "../types";

interface NotesDisplayProps {
    notes: Note[];
}

const NotesDisplay: React.FC<NotesDisplayProps> = ({ notes }) => {
    if (!notes || notes.length === 0) {
        return <p>No notes available. Generate notes to see them here.</p>;
    }
    return (
        <div className="notes-display">
            <h3>Generated Notes</h3>
            {notes.map((note) => (
                <div key={note.title} className="note">
                    <h4>{note.notes.topic}</h4>
                    <div className="note-section">
                        <h5>Question</h5>
                        <p>{note.notes.question}</p>
                    </div>
                    <div className="note-section">
                        <h5>Intuition</h5>
                        <p>{note.notes.intuition}</p>
                    </div>
                    <div className="note-section">
                        <h5>Example</h5>
                        <pre>{note.notes.example}</pre>
                    </div>
                    <div className="note-section">
                        <h5>Counterexample</h5>
                        <pre>{note.notes.counterexample}</pre>
                    </div>
                    <div className="note-section">
                        <h5>Pseudocode</h5>
                        <pre>{note.notes.pseudocode}</pre>
                    </div>
                    <div className="note-section">
                        <h5>Mistake I Did</h5>
                        <p>{note.notes.mistake}</p>
                    </div>
                    <div className="note-section">
                        <h5>Code</h5>
                        <pre>{note.notes.code}</pre>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default NotesDisplay;