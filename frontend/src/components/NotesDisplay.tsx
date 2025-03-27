// frontend/src/components/NotesDisplay.tsx

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
                    <h4>{note.title}</h4>
                    <pre>{note.content}</pre>
                </div>
            ))}
        </div>
    );
};

export default NotesDisplay;