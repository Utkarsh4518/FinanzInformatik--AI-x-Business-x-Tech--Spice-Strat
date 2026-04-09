# FinBridge AI Starter

Premium full-stack fintech AI dashboard starter built with:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Shadcn-style UI primitives
- Recharts
- FastAPI
- REST API communication

## Project Structure

```text
.
|-- backend/
|   |-- app/
|   |   |-- main.py
|   |   |-- schemas.py
|   |   `-- services/
|   |       `-- analyzer.py
|   `-- requirements.txt
|-- frontend/
|   |-- app/
|   |   |-- globals.css
|   |   |-- layout.tsx
|   |   `-- page.tsx
|   |-- components/
|   |   |-- dashboard-shell.tsx
|   |   |-- financial-chart.tsx
|   |   |-- ai-chat-panel.tsx
|   |   |-- output-tabs.tsx
|   |   `-- ui/
|   |-- lib/
|   |-- package.json
|   `-- tailwind.config.ts
`-- README.md
```

## Run Locally

### 1. Start the backend

```powershell
cd backend
pip install --user -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend will run on [http://127.0.0.1:8000](http://127.0.0.1:8000).

### 2. Start the frontend

Open a second terminal:

```powershell
cd frontend
Copy-Item .env.example .env.local -Force
npm.cmd install
npm.cmd run dev -- --hostname 127.0.0.1 --port 3000
```

Frontend will run on [http://127.0.0.1:3000](http://127.0.0.1:3000).

## API

### `POST /analyze`

Request body:

```json
{
  "prompt": "Generate an analyst-ready insight",
  "financial_data": [
    {
      "period": "Jan",
      "revenue": 82,
      "expenses": 54,
      "cashflow": 19
    }
  ]
}
```

Response body:

```json
{
  "insight": "Revenue expanded while margin stayed resilient...",
  "rule": "IF revenue growth exceeds 8% ...",
  "code": "from dataclasses import dataclass ..."
}
```

## Notes

- The backend uses mock AI responses for now, so it is safe to iterate on UX without wiring a real model.
- The dashboard uses a premium gradient background, blurred glow layers, and glass-style cards for a product-style look instead of a tutorial layout.
