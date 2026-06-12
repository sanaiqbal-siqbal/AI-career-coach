# 🚀 AI Career Coach

> Your AI-powered career toolkit — analyze resumes, discover career paths, and ace interviews with real-time AI coaching.

![AI Career Coach](https://img.shields.io/badge/AI_Career_Coach-Live-6366f1?style=for-the-badge&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-AI_Engine-F55036?style=for-the-badge&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## ✨ Features

### 📄 Resume Analysis
- Upload your PDF resume and get an instant **ATS compatibility score**
- Detailed breakdown of **strengths, weaknesses, and keyword density**
- Prioritized **improvement checklist** with progress tracking
- **Skill keyword scoring** ranked by emphasis in your resume

### 🗺️ Career Path Recommendations
- AI-generated **3 personalized career paths** matched to your resume
- Visual **match percentage arc** for each role
- **Skill gap analysis** showing exactly what to learn next

### 🎙️ Mock Interview Practice
- AI interviewer asks **questions tailored to your actual resume**
- Real-time responses powered by **Llama 3.3 70B via Groq**
- **Persistent conversation history** — pick up where you left off
- Auto-saves on tab switch, browser close, and navigation away

### 🔐 Secure by Design
- **JWT authentication** via Supabase Auth
- **Row Level Security (RLS)** — users only ever see their own data
- Every query scoped to `auth.uid()` at the database level

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) |
| AI Engine | Groq API — Llama 3.3 70B Versatile |
| PDF Parsing | pdfjs-dist |
| Deployment | Vercel |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│                  React App                   │
│  Dashboard │ Upload │ Analysis │ Interview   │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │   Supabase Client   │
        │  Auth + DB + Storage│
        └──────────┬──────────┘
                   │
     ┌─────────────▼─────────────┐
     │   Edge Function (Deno)    │
     │   ai-career-coach         │
     │  ┌─────────────────────┐  │
     │  │ analyze_resume      │  │
     │  │ interview_reply     │  │
     │  │ save_conversation   │  │
     │  └─────────────────────┘  │
     └─────────────┬─────────────┘
                   │
          ┌────────▼────────┐
          │   Groq API      │
          │ Llama 3.3 70B   │
          └─────────────────┘
```

---

## 🗄️ Database Schema

```sql
users         → id, name, email, created_at
resumes       → id, user_id, file_name, file_path, uploaded_at, ai_feedback (jsonb)
career_paths  → id, user_id, resume_id, paths (jsonb)
interviews    → id, user_id, resume_id, conversation (jsonb), created_at
```

All tables protected with **Row Level Security** — users can only access their own rows.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone the repo
```bash
git clone https://github.com/sanaiqbal-siqbal/AI-career-coach.git
cd AI-career-coach
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```

Fill in your `.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_STORAGE_BUCKET=resumes
VITE_SUPABASE_AI_FUNCTION_NAME=ai-career-coach
```

### 3. Set up Supabase

Run the following SQL in your Supabase SQL editor to enable RLS:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Own data only" ON users USING (id = auth.uid());
CREATE POLICY "Own data only" ON resumes USING (user_id = auth.uid());
CREATE POLICY "Own data only" ON career_paths USING (user_id = auth.uid());
CREATE POLICY "Own data only" ON interviews USING (user_id = auth.uid());
```

### 4. Deploy the Edge Function
```bash
supabase functions deploy ai-career-coach
supabase secrets set GROQ_API_KEY=your_groq_key
```

### 5. Run locally
```bash
npm run dev
```

---

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AppSidebar.tsx
│   ├── AppHeader.tsx
│   ├── CircularProgress.tsx
│   ├── ProgressBar.tsx
│   └── EmptyState.tsx
├── contexts/
│   └── AuthContext.tsx   # JWT auth context
├── lib/
│   ├── data.ts           # All Supabase queries
│   ├── pdf.ts            # PDF text extraction
│   └── supabase.ts       # Supabase client
├── pages/
│   ├── Dashboard.tsx
│   ├── UploadResume.tsx
│   ├── ResumeAnalysis.tsx
│   ├── CareerPaths.tsx
│   ├── MockInterview.tsx
│   ├── Login.tsx
│   └── Signup.tsx
supabase/
└── functions/
    └── ai-career-coach/
        └── index.ts      # Groq AI edge function
```

---

## ⚡ Performance Optimizations

- **Conversation trimming** — only last 10 messages sent to Groq per request
- **Auto-save strategy** — saves on every AI reply, tab switch, and browser close
- **Local state updates** — sidebar previews update without re-fetching from DB
- **sendBeacon** — guarantees data save even when tab is closed mid-session

---

## 🔒 Security

- All routes protected with `<ProtectedRoute />` — unauthenticated users redirected to `/login`
- Supabase RLS policies ensure complete data isolation between users
- API keys never exposed to the client — all AI calls go through Edge Functions
- Groq API key stored only as a Supabase secret, never in `.env`

---

## 📄 License

MIT — feel free to use this project as a template or reference.

---

<div align="center">
  <p>Built with ❤️ using React, Supabase, and Groq</p>
  <p>
    <a href="https://github.com/sanaiqbal-siqbal/AI-career-coach">GitHub</a> ·
    <a href="https://console.groq.com">Groq Console</a> ·
    <a href="https://supabase.com">Supabase</a>
  </p>
</div>
