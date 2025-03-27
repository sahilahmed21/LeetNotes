# LeetNotes

This project is a LeetCode notes application with a backend built using Express and Node.js, a frontend built using React and TypeScript, and a LeetCode fetcher.

## Project Structure

```
leetcode-notes-app/
├── backend/                        # Express + Node.js server
│   ├── src/
│   │   ├── routes/
│   │   │   └── api.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── supabase.ts
│   │   └── server.ts
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
├── frontend/                       # React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.tsx
│   │   │   ├── FetchForm.tsx
│   │   │   └── NotesDisplay.tsx
│   │   ├── pages/
│   │   │   └── Home.tsx
│   │   ├── supabase.ts
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   ├── App.css
│   │   └── types.ts
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
├── fetcher/                        # Existing LeetCodeFetcher
│   ├── src/
│   │   ├── __init__.py
│   │   ├── fetcher.py
│   │   ├── scraper.py
│   │   └── utils.py
│   ├── config/
│   │   └── config.json
│   ├── output/
│   │   └── leetcode_data.json
│   ├── main.py
│   ├── requirements.txt
│   └── README.md
├── supabase/                       # Supabase schema
│   └── schema.sql
└── README.md
```
