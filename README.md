# Bridge -- AI-Powered Business & Tech Collaboration

Bridge is a collaboration platform that helps business and technical teams understand each other. It connects GitHub, Jira, and AI translation in one place, with a dual-mode interface that adapts to your role.

Built for the **"Making AI a Teamwork Booster between Business & Tech"** hackathon.

## What It Does

- **Dual-Mode UI** -- Toggle between Business and Developer views. Colors, language, and content adapt to each perspective.
- **GitHub Integration** -- Browse all your repositories with stats, tech stacks, and README previews. Forked repos are clearly labeled.
- **Jira Board** -- View projects and issues in a Kanban layout. Create tickets manually or let AI generate them from plain-language requirements.
- **AI Chat** -- Ask questions in natural language. The AI responds in business-friendly or technical language depending on your mode.
- **AI Translation** -- Translate READMEs and Jira tickets between business and developer language with one click.
- **Voice Input** -- Speak your Jira ticket requirements or chat messages using the built-in microphone (Web Speech API).
- **Voice Output** -- Listen to ticket descriptions, translations, and AI replies read aloud via ElevenLabs text-to-speech.
- **Scenario Library** -- Pre-built collaboration scenarios you can try directly in the AI chat.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, React, TypeScript, Tailwind CSS, Framer Motion |
| Backend | FastAPI, Python, Pydantic, httpx |
| AI | Google Gemini API (cascading model selection with fallback) |
| Voice | Browser Web Speech API (STT), ElevenLabs API (TTS) |
| Integrations | GitHub REST API, Atlassian Jira Cloud API |
| Theme | Finance Informatik / Sparkasse corporate palette |

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI routes (GitHub, Jira, AI, TTS)
│   │   ├── schemas.py           # Pydantic request/response models
│   │   └── services/
│   │       ├── ai_service.py    # Gemini integration with smart fallback
│   │       ├── github_service.py
│   │       └── jira_service.py
│   ├── requirements.txt
│   └── .env                     # API keys (not committed)
├── frontend/
│   ├── app/                     # Next.js pages and global styles
│   ├── components/              # Dashboard, sidebar, Jira board, chat
│   ├── lib/                     # API client, hooks, types, context
│   ├── package.json
│   └── tailwind.config.ts
└── README.md
```

## Run Locally

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Create a `backend/.env` file with your keys:

```
GITHUB_TOKEN=your_github_token
GEMINI_API_KEY=your_gemini_key
JIRA_DOMAIN=your-instance.atlassian.net
JIRA_EMAIL=your@email.com
JIRA_API_TOKEN=your_jira_token
ELEVENLABS_API_KEY=your_elevenlabs_key
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key Features in Detail

### Dual-Mode Toggle
Switch between Business and Developer perspectives from the navbar. The entire UI adapts -- accent colors, terminology, and content focus change instantly.

### Voice-Powered Jira Tickets
Click the microphone icon on the Jira ticket creation form to describe your requirement by voice. The transcript fills in live, and AI generates a structured ticket with acceptance criteria.

### AI Translation
Select any GitHub project or Jira issue and translate its content between business and technical language. Listen to the translation read aloud via ElevenLabs.

### Smart AI Fallback
The backend tries multiple Gemini models in order, with automatic retry on rate limits. If all models are unavailable, it falls back to curated mock responses so the demo always works.
