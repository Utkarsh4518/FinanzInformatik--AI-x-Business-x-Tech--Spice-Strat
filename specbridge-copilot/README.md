# SpecBridge Copilot

SpecBridge Copilot is a Jira Cloud Forge app that helps business analysts and delivery teams do two things well:

1. choose a sensible developer for a ticket
2. keep the requester and implementer connected through a structured clarification bridge

This implementation uses Forge Custom UI as the main presentation layer, Jira issue panel as the primary workspace, Jira issue glance as the compact summary surface, Jira issue activity for the lifecycle feed, Jira REST APIs for issue/user/search/comment/transition operations, and Forge storage for MVP persistence.

## What The App Includes

- `Assignment Copilot`
  Analyzes summary, description, labels, priority, status, component and comments, computes requirement stability, classifies domain and stack, then ranks developers with transparent scoring.
- `Clarification Bridge`
  Creates a structured thread between requester and assignee, rewrites questions in business and technical language, tracks open and resolved questions, highlights pending side, and suggests acceptance criteria updates.
- `Ticket Watcher`
  Logs lifecycle events such as created, analyzed, recommended assignee, assigned, clarification requested, clarified, status changed, review started, approved, and done.

## Current Product Notes

- The app intentionally preserves `jira:issueGlance` because it was explicitly requested, even though Atlassian documents that module as deprecated in favor of issue context for newer apps.
- The AI layer is wired as an abstraction and ships with a working heuristic provider for the MVP, so the app still functions without external LLM credentials.
- If Jira assignable-user data is sparse, the app falls back to demo profiles so the UI remains usable.

## Architecture

### Forge backend

- `manifest.yml`
  Forge app descriptor with issue panel, issue glance, issue activity, background script, Jira product triggers, and queue consumer.
- `src/index.js`
  Resolver entry point plus trigger, dynamic properties, and queue exports.
- `src/lib/jira-client.js`
  Jira Cloud REST API wrapper for issue snapshot reads, comments, changelog, assignable-user lookup, assignment, comment posting, similar issue search, and transitions.
- `src/lib/storage.js`
  Forge storage adapter for developer profiles, ticket intelligence, clarification threads, and lifecycle events.
- `src/services/analysis/*.js`
  Stability scoring, candidate ranking, clarification derivation, and lifecycle watcher logic.
- `src/services/orchestrator/ticket-orchestrator.js`
  Main orchestration flow that hydrates issue intelligence and powers UI actions.

### Custom UI frontend

- `static/specbridge-ui/src/App.jsx`
  Surface router for issue panel, issue glance, issue activity, and background script.
- `static/specbridge-ui/src/components/*`
  Enterprise-style cards for assignment guidance, candidate ranking, clarification bridge, summary, and lifecycle timeline.
- `static/specbridge-ui/src/lib/forge.js`
  Bridge/invoke/event helpers for Forge Custom UI.
- `static/specbridge-ui/src/styles.css`
  Visual system and responsive layout styling.

## Setup

### 1. Install dependencies

```bash
cd specbridge-copilot
npm install
npm --prefix static/specbridge-ui install
```

### 2. Build the Custom UI bundle

```bash
cd specbridge-copilot
npm run build
```

### 3. Register the Forge app

Replace the placeholder app id in `manifest.yml` after you run Forge registration for your Atlassian account.

### 4. Configure optional variables

The MVP works with the built-in heuristic provider and does not require external AI credentials.

If you later add an OpenAI-backed provider, set Forge variables such as:

```bash
forge variables set SPECBRIDGE_AI_PROVIDER openai
forge variables set OPENAI_API_KEY <your-key>
forge variables set OPENAI_MODEL gpt-4.1-mini
```

### 5. Deploy and install

```bash
forge deploy
forge install
```

## Working Model

### Assignment Copilot

- Builds a requirement stability score from ambiguity, open questions, vague wording, recent description changes, comment conflicts, and missing acceptance criteria.
- When stability is high enough, recommends the best assignee plus two backups.
- When stability is low, blocks confident assignment and surfaces clarification questions instead.

### Clarification Bridge

- Tracks open questions and resolved answers at the issue level.
- Rewrites each bridge message into business and technical variants.
- Posts structured Jira comments so the bridge remains visible in the issue history.
- Suggests acceptance-criteria updates from resolved clarifications.

### Ticket Watcher

- Persists lifecycle events in Forge storage.
- Generates short AI-style interpretations for each event.
- Keeps the latest summary, blocker list, open-question count, and transitions visible in the issue view.

## Commands

```bash
cd specbridge-copilot
npm run build
```

## Limitations

- The placeholder manifest app id must be replaced before deployment.
- The heuristic AI provider is intentionally deterministic for the MVP; deeper LLM integration can be added behind the existing abstraction later.
- Developer profile metrics are estimated unless you replace the demo/inferred profile flow with a configured team-profile source.
