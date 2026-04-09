# BridgeFlow

BridgeFlow is an AI project coordinator that turns messy multilingual project input into structured tickets, business-friendly summaries, and clear handovers so managers, business analysts, and developers can stay aligned and move faster.

## Core MVP Features

- Manager project intake
- AI organizes messy input into structured tickets
- Kanban board as the primary view
- Ticket table as the secondary view
- Translation between business and technical language
- Progress summaries for managers
- Handover generation when someone is unavailable
- Optional repo impact analysis using a local snapshot

## Local Setup

1. Clone the repo.
2. Install project dependencies with `npm install`.
3. Copy `.env.example` to `.env.local` and set `DATABASE_URL` for PostgreSQL.
4. If you want Jira import, also set `JIRA_BASE_URL`, `JIRA_EMAIL` or `JIRA_USER`, `JIRA_API_TOKEN`, and optionally `JIRA_PROJECT_KEY`.
5. Start the app with `npm run dev`. BridgeFlow will bootstrap the schema and seed the demo scenario automatically when PostgreSQL is available.
6. During local development, `BRIDGEFLOW_ALLOW_FILE_FALLBACK=true` keeps the app runnable if PostgreSQL is unavailable.
7. Use sample project notes to test intake, ticket generation, summaries, handovers, and optional Jira import.

## Hackathon Goal

Build a focused MVP in 18 hours that proves AI can take rough project input and turn it into an actionable, manager-friendly coordination workflow for delivery teams.
