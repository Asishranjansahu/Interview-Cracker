# Interview Cracker (Greenroom)

Greenroom is a real-time interview practice copilot that listens to interview questions, builds context-aware prompts, and surfaces concise guidance during mock sessions.

## Features

- Real-time question capture from microphone and system-audio modes
- Prompt assembly based on interview context and candidate profile
- Backend suggestion generation with model fallback behavior
- Lightweight browser cue card UI with suggestion history

## Tech Stack

- **Frontend:** Vite + Vanilla JavaScript
- **Backend:** Node.js + Express
- **AI Integration:** Anthropic API (with local fallback guidance)

## Repository Structure

- `src/` — core Greenroom pipeline and UI components
- `server/` — API routes, prompt orchestration, model client
- `docs/` — architecture, prompt, and ethics notes

## Prerequisites

- Node.js and npm installed
- Valid API keys for configured providers

## Environment Setup

1. Copy `.env.example` to `.env`.
2. Populate required keys:
   - `ANTHROPIC_API_KEY`
   - `STT_PROVIDER_KEY`

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start client and server in development mode:
   ```bash
   npm run dev
   ```
3. Open the app at `http://localhost:4173`.

## Available Scripts

- `npm run dev` — run server and client concurrently
- `npm run dev:server` — run Express server on port `3001` (or `PORT`)
- `npm run dev:client` — run Vite dev server on port `4173`
- `npm run build` — create production build
- `npm run preview` — preview production build locally

## API

- `GET /health` — health check endpoint
- `POST /api/suggest` — generate interview response suggestions

## Ethics and Intended Use

This project is intended for interview preparation, mock interviews, and coaching.  
Do **not** use it for unauthorized real-time assistance in live interviews.