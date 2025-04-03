
---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

-   [Node.js](https://nodejs.org/) (v18 or higher recommended) & npm
-   [Python](https://www.python.org/) (v3.8 or higher) & pip
-   [Git](https://git-scm.com/)
-   A [Supabase](https://supabase.com/) account and project.
-   A [Google Cloud Project](https://console.cloud.google.com/) with the Gemini API enabled to obtain an API key.

---

## 🚀 Getting Started

Follow these steps to set up and run the project locally:

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/sahilahmed21/LeetNotes.git
    cd leetcode-notes-app
    ```

2.  **Set up Supabase:**
    *   Go to your Supabase project dashboard.
    *   Navigate to `SQL Editor` > `New query`.
    *   Paste the contents of `supabase/schema.sql` and run it to create the necessary tables.
    *   Go to `Project Settings` > `API`. Find your:
        *   **Project URL** (e.g., `https://xyz.supabase.co`)
        *   **`anon` public key**
        *   **`service_role` secret key** (Keep this safe!)

3.  **Configure Backend:**
    *   Navigate to the backend directory: `cd backend`
    *   Install dependencies: `npm install`
    *   Create a `.env` file in the `backend` directory (`backend/.env`) and add your secrets:
        ```dotenv
        # backend/.env
        PORT=3000
        SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
        SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_SECRET
        GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY
        ```
    *   Replace the placeholder values with your actual Supabase URL, service role key, and Gemini API key.

4.  **Configure Frontend:**
    *   Navigate to the frontend directory: `cd ../frontend` (from `backend`) or `cd frontend` (from root)
    *   Install dependencies: `npm install`
    *   Create a `.env` file in the `frontend` directory (`frontend/.env`) and add your public keys:
        ```dotenv
        # frontend/.env
        VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
        VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_PUBLIC_KEY
        ```
    *   Replace the placeholder values with your actual Supabase URL and anon key.

5.  **Set up Python Fetcher:**
    *   Navigate to the fetcher directory: `cd ../fetcher` (from `frontend`) or `cd fetcher` (from root)
    *   (Recommended) Create and activate a virtual environment:
        ```bash
        python -m venv venv
        # On Windows:
        .\venv\Scripts\activate
        # On macOS/Linux:
        source venv/bin/activate
        ```
    *   Install Python dependencies: `pip install -r requirements.txt`
    *   *Note: You don't typically run the fetcher directly; the backend executes it.*

6.  **Run the Application:**
    *   **Start the Backend Server:**
        Open a terminal in the `backend` directory and run:
        ```bash
        npm run dev
        ```
        The backend should start, usually on port 3000. Keep this terminal running.
    *   **Start the Frontend Development Server:**
        Open *another* terminal in the `frontend` directory and run:
        ```bash
        npm run dev
        ```
        The frontend should start, usually on port 5173.
    *   Open your browser and navigate to `http://localhost:5173` (or the port specified by Vite).

---

## 🔑 Environment Variables Summary

**Backend (`backend/.env`):**

-   `PORT`: Port for the Express server (default: `3000`).
-   `SUPABASE_URL`: Your Supabase project URL.
-   `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (secret).
-   `GEMINI_API_KEY`: Your Google Cloud Gemini API Key.

**Frontend (`frontend/.env`):**

-   `VITE_SUPABASE_URL`: Your Supabase project URL (must start with `VITE_`).
-   `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key (public, must start with `VITE_`).

---

## 💡 Usage

1.  **Sign Up / Login**: Create an account or log in using the interface at `http://localhost:5173`.
2.  **Navigate**: Once logged in, you'll see the main dashboard.
3.  **Fetch Data**: Use the "Fetch LeetCode Data" form:
    *   Enter your LeetCode username.
    *   Provide your `LEETCODE_SESSION` cookie and `csrftoken` (find these in your browser's developer tools under Application > Cookies for leetcode.com while logged into LeetCode).
    *   Click "Fetch Data". The backend will run the Python script to gather your profile stats, solved problems, and submission details. This may take a few minutes depending on your history. You should see toast notifications for progress/completion.
4.  **Generate Notes**: After data is fetched and stored, problems you've solved should appear in a list or display area. Click "Generate Notes" (or a similar button) next to a problem to trigger the Gemini API request via the backend.
5.  **View Notes**: Once generated, the structured notes (Intuition, Algorithm, etc.) will be displayed for the selected problem.

---

## 🤝 Contributing

Contributions are welcome! If you'd like to contribute, please fork the repository and create a pull request. You can also open an issue for bugs or feature requests on the [GitHub Issues page](https://github.com/sahilahmed21/LeetNotes/issues).

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Enjoy using LeetNotes! Let me know if you build something cool with it! 🎉