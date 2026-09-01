# Interview Cracker

Interview Cracker is an AI-assisted interview preparation application for live guidance and structured practice.

It combines voice-based question capture, prompt orchestration, and response generation to help candidates prepare concise, role-aligned answers.

## Key Capabilities

- **Live mode support** for real-time interviewer question handling
- **Practice mode coaching** with scoring, strengths, weaknesses, and rewritten answers
- **Speech-driven workflows** using browser-native speech features
- **Fallback generation** when remote model calls are unavailable
- **Session history and transcript export** for post-session review

## Architecture Overview

The repository contains:

- **Frontend (`src/`)**: React + Vite application with live/practice UX, speech capture, and local pipeline logic
- **Backend (`server/`)**: Express API for `/api/suggest` prompt execution and fallback responses

High-level flow:

1. Capture interviewer question (voice/manual input)
2. Build mode-specific prompt and context
3. Generate structured suggestion
4. Render coaching output in the UI
5. Persist session data for review

## Technology Stack

- React 19
- Vite 8
- Tailwind CSS 3
- Node.js + Express 4
- Anthropic Messages API (optional)

## Prerequisites

- Node.js 18+
- npm 9+
- Optional Anthropic API key for model-backed suggestions

## Setup

```bash
git clone https://github.com/Asishranjansahu/Interview-Cracker.git
cd Interview-Cracker
npm install
cp .env.example .env
```

Configure `.env` values as needed:

- `ANTHROPIC_API_KEY` (backend API route)
- `VITE_ANTHROPIC_API_KEY` (frontend pipeline)
- `VITE_DEEPGRAM_API_KEY` (optional streaming STT path)

## Running the Application

### Frontend (primary)

```bash
npm run dev
```

Vite dev server runs on `http://localhost:3000`.

### Backend API (optional)

```bash
node server/index.js
```

Backend health endpoint:

- `GET /health`

Suggestion endpoint:

- `POST /api/suggest`

## NPM Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run lint` — currently mapped to build validation
- `npm run preview` — preview production build locally

## API Contract

### `POST /api/suggest`

Request body (common fields):

```json
{
  "mode": "live",
  "question": "Tell me about a difficult problem you solved",
  "role": "Software Engineer",
  "company": "Example Corp",
  "resume_text": "...",
  "job_description": "..."
}
```

Live mode response:

```json
{
  "bullets": ["...", "...", "..."],
  "full_answer": "...",
  "note": ""
}
```

Practice mode response:

```json
{
  "score": 4,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "rewritten_answer": "...",
  "note": ""
}
```

## Project Structure

```text
Interview-Cracker/
├── src/                  # React application
├── server/               # Express API
├── docs/                 # Supporting documentation
├── package.json
└── README.md
```

## Responsible Use

This project is intended for interview preparation and mock practice. Ensure usage aligns with employer and platform policies.

## License

MIT License. See `LICENSE`.
