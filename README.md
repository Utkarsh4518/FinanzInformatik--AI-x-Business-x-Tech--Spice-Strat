# synapse

**AI-powered bridge between Business and Tech teams.**

synapse is a collaboration tool that lets business stakeholders and developers view the same data — GitHub repos, Jira tickets, commits — through their own lens. Toggle between **Business** and **Developer** mode, and the entire interface adapts: language, colors, content focus, and AI behavior all shift to match your perspective.

Built for the **"Making AI a Teamwork Booster between Business & Tech"** hackathon.

> **Live demo:** Frontend on [Vercel]((https://spicestrat.vercel.app/)) · Backend on [Render](https://render.com) (free tier — first request after idle may take ~50s)

---

## Features

### Dual-Mode Interface

Pick your role on the landing page. The app remembers it everywhere:

| Aspect | Business Mode | Developer Mode |
|--------|--------------|----------------|
| Accent color | Warm coral / Sparkasse palette | Cool blue / dark theme |
| Repo view | Business impact, plain-English overview | Tech stack breakdown, README, language bars |
| Jira view | High-level summaries | Technical details and acceptance criteria |
| AI responses | Non-technical, outcome-focused | Code-aware, implementation-focused |
| Commit explanation | "What changed and why it matters" | Patch-level diff with file breakdowns |

Toggle anytime from the header — no page reload.

### GitHub Integration

- Browse all repositories for any GitHub user/org
- View repo stats (stars, forks, open issues, topics)
- Inspect individual commits with full diff view
- AI-powered commit explanations tailored to your mode
- Forked repos clearly labeled
- README preview with language distribution bars (dev mode)

### Jira Board

- Connect to Jira Cloud — view projects and issues in a Kanban layout (To Do / In Progress / Done)
- Open issue details with description, status, and assignee
- **Create tickets manually** or **let AI generate them** from a plain-English requirement
- Voice-to-ticket: speak your requirement, AI structures it into a proper ticket with acceptance criteria
- Works offline with local demo data when Jira credentials aren't configured

### AI Chat

Two flavors of AI chat, both mode-aware:

- **Global chat** (header icon) — general Q&A, quick prompts, conversation history
- **Contextual chat** (floating button on repo/commit/Jira pages) — automatically includes page context so the AI knows what you're looking at
- Auto-speak option reads assistant replies aloud
- Per-message "Listen" and "Translate to German" buttons

### AI Translation

- **Business ↔ Tech translation** — rewrite any text for the other audience with one click
- **EN ↔ DE language translation** — powered by DeepL (primary), Gemini (fallback), or MyMemory (last resort)
- Available on repo pages, Jira issue details, commit explanations, and chat messages

### Voice Input & Output

- **Speech-to-text** — browser-native Web Speech API with 3-second silence auto-stop; works in chat input, ticket creation, and anywhere there's a mic icon
- **Text-to-speech** — ElevenLabs API streams high-quality MP3 audio for translations, explanations, and AI replies

### Smart AI Fallback

The backend cascades through multiple providers so the app always responds:

```
Manus AI → Gemini (multiple models, auto-retry on rate limits) → OpenAI GPT-3.5 → curated mock responses
```

Rate-limit errors and model unavailability are handled automatically. In demo mode without API keys, mock responses keep the UI fully functional.

### Visual Polish

- **WebGL galaxy background** on the landing page (OGL shader with starfield and mouse-reactive parallax)
- **Animated border-glow cards** that react to cursor position
- Framer Motion page transitions throughout
- Responsive layout with mobile hamburger menu

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion, Radix UI |
| Backend | FastAPI, Python, Pydantic, httpx, uvicorn |
| AI | Google Gemini API, OpenAI API, Manus AI (cascading with fallback) |
| Translation | DeepL API, Gemini, MyMemory (cascading) |
| Voice | Web Speech API (STT), ElevenLabs API (TTS) |
| Integrations | GitHub REST API, Atlassian Jira Cloud REST API v3 |
| Deployment | Vercel (frontend), Render (backend) |

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI routes and middleware
│   │   ├── schemas.py             # Pydantic request/response models
│   │   └── services/
│   │       ├── ai_service.py      # LLM orchestration with multi-provider fallback
│   │       ├── github_service.py  # GitHub REST client (repos, commits, READMEs)
│   │       ├── jira_service.py    # Jira Cloud client (projects, issues, create)
│   │       └── manus_service.py   # Manus AI task polling client
│   └── requirements.txt
├── frontend/
│   ├── app/                       # Next.js pages and global styles
│   ├── components/                # All UI components
│   │   ├── landing-page.tsx       # Role selection screen
│   │   ├── dashboard-shell.tsx    # Main app shell with header and routing
│   │   ├── sidebar.tsx            # Projects / Commits / Jira navigation
│   │   ├── project-dashboard.tsx  # Repository detail view
│   │   ├── jira-board.tsx         # Kanban board and ticket creation
│   │   ├── commit-detail.tsx      # Commit inspection with AI explanation
│   │   ├── ai-chat-panel.tsx      # Global AI chat
│   │   ├── contextual-chat.tsx    # Floating contextual chat + ticket creator
│   │   ├── Galaxy.jsx             # WebGL starfield background
│   │   └── BorderGlow.jsx         # Cursor-reactive card glow effect
│   ├── lib/
│   │   ├── api.ts                 # Axios API client
│   │   ├── types.ts               # Shared TypeScript types
│   │   ├── mode-context.tsx       # Business/Developer mode context
│   │   ├── use-tts.ts             # ElevenLabs TTS hook
│   │   ├── use-voice-input.ts     # Web Speech API hook
│   │   └── mock-data.ts           # Demo defaults and quick prompts
│   └── package.json
├── render.yaml                    # Render deployment blueprint
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env`:

```env
GITHUB_TOKEN=your_github_personal_access_token
GEMINI_API_KEY=your_google_gemini_key
JIRA_DOMAIN=your-instance.atlassian.net
JIRA_EMAIL=your@email.com
JIRA_API_TOKEN=your_jira_api_token
ELEVENLABS_API_KEY=your_elevenlabs_key

# Optional — enhances AI fallback
OPENAI_API_KEY=your_openai_key
MANUS_API_KEY=your_manus_key
DEEPL_API_KEY=your_deepl_key
```

All keys are optional. The app gracefully degrades: GitHub features work without a token (lower rate limits), AI uses mock responses when no LLM keys are set, and Jira falls back to local demo data.

```bash
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The frontend defaults to `http://127.0.0.1:8000` for API calls. To point at a different backend, create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Service info and status |
| `GET` | `/health` | Health check |
| `GET` | `/github/repos` | List repos for an owner |
| `GET` | `/github/repos/:owner/:repo` | Repo detail with README |
| `GET` | `/github/commits` | List recent commits |
| `GET` | `/github/commits/:owner/:repo/:sha` | Commit detail with file diffs |
| `POST` | `/ai/explain-commit` | AI-generated commit explanation |
| `POST` | `/ai/translate` | Business ↔ Tech text translation |
| `POST` | `/ai/translate-language` | EN ↔ DE language translation |
| `POST` | `/ai/chat` | Mode-aware AI chat |
| `POST` | `/ai/generate-ticket` | AI-generated Jira ticket from requirement |
| `GET` | `/jira/projects` | List Jira projects |
| `GET` | `/jira/issues` | Search Jira issues (JQL supported) |
| `GET` | `/jira/issues/:key` | Issue detail |
| `POST` | `/jira/issues` | Create a Jira issue |
| `POST` | `/tts` | Text-to-speech via ElevenLabs |

---

## Deployment

**Frontend** is deployed on Vercel. The only build-time variable needed:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com
```

**Backend** is deployed on Render using `render.yaml`. Add your API keys as environment variables in the Render dashboard. The health check is configured at `/health`.

---

## License

MIT
