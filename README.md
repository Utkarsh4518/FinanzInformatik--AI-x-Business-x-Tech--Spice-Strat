# SpecBridge

SpecBridge is a production-style hackathon prototype for business analysts, developers, and reviewers who need a shared understanding of software changes. It translates requirements into a shared spec, explains code in business language, summarizes pull requests, and highlights alignment gaps between requested behavior and implementation.

## Stack

- Next.js App Router with TypeScript
- Tailwind CSS with shadcn-style component scaffolding
- React Query for network state
- Zustand for local workspace and UI state
- Next.js Route Handlers for API endpoints
- Supabase/Postgres schema with `pgvector` scaffolding
- Demo-first SSE streaming for long-running actions

## Main routes

- `/` dashboard
- `/workspace` requirement studio
- `/codebase` codebase explorer
- `/alignment` alignment checker
- `/pr-summary` PR explainer
- `/settings` provider and connection settings
- `/demo` demo scenario loader
- `/activity` audit trail

## API routes

- `POST /api/requirements/analyze`
- `POST /api/requirements/clarify`
- `POST /api/spec/generate`
- `POST /api/repo/index`
- `POST /api/repo/ask`
- `POST /api/diff/explain`
- `POST /api/alignment/check`
- `GET /api/activity/:workspaceId`
- `POST /api/settings/test-connection`
- `POST /api/demo/load`
- `POST /api/voice/transcribe`
- `POST /api/voice/speak`
- `POST /api/voice/translate-text`
- `POST /api/voice/dub-audio`
- `POST /api/voice/comment`
- `GET /api/voice/history/:ticketId`

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill the values you want to use.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

If you do not configure live providers, the app still works in demo mode using seeded requirement, repo, diff, and alignment data.

## Live backend setup

To move beyond demo fallback behavior:

1. Set `LLM_PROVIDER` to one of `openai-compatible`, `gemini-compatible`, `groq-compatible`, or `ollama-local`.
2. Add `LLM_API_KEY`.
3. Optionally set `LLM_BASE_URL`, `LLM_MODEL`, and `LLM_EMBEDDING_MODEL`.
4. Add `GITHUB_TOKEN` if you want higher-rate or private repository indexing.

Current behavior:

- Requirement analysis uses the live AI provider when configured, otherwise heuristic fallback.
- Repository indexing fetches real GitHub repository trees and text files, builds semantic chunks, and stores them in the in-memory server store for Q&A.
- Codebase Q&A uses indexed repository chunks and the live AI provider when configured.
- Diff explanation and alignment checks use the live AI provider when configured, otherwise structured fallback logic.

## Voice collaboration setup

The app now includes an ElevenLabs-powered voice layer for:

- voice requirement capture with auto-analysis and shared spec generation
- voice comments attached to specs and review flows
- live discussion capture with saved session summaries
- ElevenLabs text-to-speech playback for summaries, checklists, PR notes, and risk reports
- transcript translation and rewriting for business or developer audiences

Required env vars:

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`
- `ELEVENLABS_TTS_MODEL`
- `ELEVENLABS_TTS_QUALITY_MODEL`
- `ELEVENLABS_STT_MODEL`
- `DEFAULT_SOURCE_LANGUAGE`
- `DEFAULT_TARGET_LANGUAGE`

After changing `.env.local`, restart `npm run dev` so Next.js reloads the server-side voice configuration.

## Demo flow

1. Open `/demo` and click `Load demo scenario`.
2. Review the requirement analysis in `/workspace`.
3. Switch to `/codebase` and ask where the feature should be implemented.
4. Open `/pr-summary` to generate business-language change notes.
5. Run `/alignment` to compare requirement versus implementation evidence.

## Persistence and schema

- `supabase/schema.sql` contains the production-style schema scaffold.
- The current prototype uses an in-memory server store plus client-side Zustand persistence so the app remains fully demoable without infrastructure.
- `scripts/seed-demo.mjs` provides a minimal seed helper stub for database onboarding.

## Notes

- No proprietary Sparkasse or Finanz Informatik assets are used.
- The UI is brand-aligned only: structured, enterprise, red-accented, and accessibility-first.
- Secrets remain server-side. When provider variables are missing, the UI surfaces warning states and the backend falls back to mock results.
