<div align="center">

# 🎙️ Interview Cracker

**AI-powered interview preparation copilot**

Live answer cues, practice feedback, and transcript review — all in real time.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)](https://nodejs.org)
[![Anthropic](https://img.shields.io/badge/Claude-Sonnet-4-D97706?logo=anthropic)](https://anthropic.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎤 **Real-time Question Detection** | Web Speech API listens for interviewer questions automatically |
| 🧠 **AI-Powered Answers** | Claude generates context-aware responses based on your profile |
| 🎭 **Stealth Mode** | Discreet floating panel for use during screen sharing |
| 📊 **Practice Mode** | Submit your own answers and get scored with rewrite suggestions |
| 📸 **Screenshot Capture** | Attach screenshots of code, slides, or whiteboard notes |
| 📜 **Session History** | Review past interviews with full Q&A transcripts |
| ⚡ **Instant Fallback** | Local response generation when API is unavailable |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (React)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│   │   Web Speech  │───▶│   Question   │───▶│  Prompt      │     │
│   │   API         │    │   Detector   │    │  Builder     │     │
│   └──────────────┘    └──────────────┘    └──────┬───────┘     │
│                                                    │             │
│   ┌──────────────┐    ┌──────────────┐    ┌───────▼──────┐     │
│   │  Cue Card    │◀───│   Answer     │◀───│  Anthropic   │     │
│   │  Renderer    │    │   Parser     │    │  API / Local │     │
│   └──────────────┘    └──────────────┘    └──────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **Anthropic API Key** ([Get one here](https://console.anthropic.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/Asishranjansahu/Interview-Cracker.git
cd Interview-Cracker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### Development

```bash
# Start the development server
npm run dev
```

Open [http://localhost:4173](http://localhost:4173) in your browser.

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key for Claude |
| `PORT` | No | Server port (default: `3001`) |

---

## 📁 Project Structure

```
Interview-Cracker/
├── src/                          # React frontend
│   ├── App.jsx                   # Main application component
│   ├── main.jsx                  # React entry point
│   └── index.css                 # Global styles + Tailwind
├── server/                       # Express backend
│   ├── index.js                  # Server entry point
│   ├── routes/
│   │   └── suggest.js           # Suggestion API endpoint
│   └── lib/
│       └── anthropicClient.js   # Anthropic API client
├── docs/                         # Documentation
│   ├── ethics-and-scope.md
│   ├── pipeline-diagram.md
│   └── prompt-design.md
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── package.json
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/suggest` | Generate interview response suggestion |

### POST `/api/suggest`

**Request Body:**
```json
{
  "mode": "live",
  "question": "Tell me about a time you solved a difficult problem",
  "role": "Software Engineer",
  "company": "Google",
  "resume_text": "...",
  "job_description": "..."
}
```

**Response:**
```json
{
  "headline_answer": "I identified the root cause, aligned stakeholders, and shipped a fix in 48 hours.",
  "bullets": [
    "Clarified the problem scope first",
    "Aligned cross-functional team",
    "Implemented incremental solution",
    "Measured and documented results"
  ],
  "tradeoff": "Quick fix required follow-up refactoring",
  "full_answer": "Full paragraph answer..."
}
```

---

## 🎯 Usage Modes

### Live Mode
- Real-time question detection via microphone
- Instant AI-generated answer suggestions
- Stealth mode available for discreet use

### Practice Mode
- Manually input questions and your answers
- Get scored on STAR structure, clarity, and impact
- Receive rewritten versions of your answers

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Tailwind CSS 3.4, Vite 8 |
| **Backend** | Node.js, Express 4.x |
| **AI** | Anthropic Claude (Sonnet 4 / Haiku) |
| **Speech** | Web Speech API (browser-native) |
| **State** | React Hooks + localStorage |

---

## ⚠️ Ethics & Disclaimer

> This tool is designed for **interview preparation and practice only**.
>
> Using AI assistance during actual interviews may violate company policies
> and could be considered deceptive. Always use this tool responsibly and
> in accordance with your organization's guidelines.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for interview preparation**

[Report Bug](https://github.com/Asishranjansahu/Interview-Cracker/issues) · [Request Feature](https://github.com/Asishranjansahu/Interview-Cracker/issues)

</div>