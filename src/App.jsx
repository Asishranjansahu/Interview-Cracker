import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'greenroom_sessions_v1';
const PROFILE_KEY = 'greenroom_profile_v1';

const defaultProfile = {
  company: 'Cognizant',
  role: 'Java Developer Fresher',
  interviewType: 'technical',
  resumeText:
    'Built REST APIs in Java and Spring Boot, improved application reliability, and collaborated with QA to ship features on time.',
  jobDescription:
    'We are hiring a Java developer who can write clean API code, reason about performance, and communicate trade-offs clearly.',
  companyCulture: 'Fast-moving, practical, and collaborative.',
  apiKey: '',
};

const navItems = [
  { id: 'sessions', label: 'Call Sessions' },
  { id: 'resumes', label: 'CVs & Resumes' },
  { id: 'documents', label: 'Documents' },
];

function loadStoredSessions() {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val ? JSON.parse(val) : [];
  } catch {
    return [];
  }
}

function loadProfile() {
  try {
    const val = localStorage.getItem(PROFILE_KEY);
    return val ? { ...defaultProfile, ...JSON.parse(val) } : defaultProfile;
  } catch {
    return defaultProfile;
  }
}

function formatDuration(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}m ${secs}s`;
}

function getQuestionWords() {
  return [
    'who',
    'what',
    'when',
    'where',
    'why',
    'how',
    'tell me',
    'walk me',
    'describe',
    'explain',
    'can you',
    'could you',
    'would you',
    'do you',
    'did you',
    'have you',
  ];
}

function looksLikeQuestion(text) {
  const clean = (text || '').replace(/[^a-zA-Z0-9 ?]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return false;
  const wordCount = clean.split(/\s+/).length;
  if (wordCount < 4) return false;
  const questionWords = getQuestionWords();
  const containsQuestionWord = questionWords.some((w) => clean.toLowerCase().includes(w));
  return containsQuestionWord || clean.endsWith('?');
}

function buildPrompt({ mode, questionType, role, company, resumeText, jobDescription, companyCulture, question, candidateAnswer }) {
  const template = `You are Greenroom, an AI interview co-pilot. Mode: {mode} ("live" or "practice"). Question type: {question_type} ("behavioral"|"technical"|"case"|"general").

CANDIDATE CONTEXT
- Target role: {role}
- Target company: {company}
- Resume/background: {resume_text}
- Job description: {job_description}
- Company culture notes: {company_culture}

INTERVIEWER'S QUESTION: "{question}"
CANDIDATE'S OWN ANSWER (practice mode only): "{candidate_answer}"

If mode is "live": produce material the candidate can glance at and speak from naturally.
- Ground every suggestion strictly in the candidate's actual background. Never invent experience or metrics.
- headline_answer: one bolded sentence, the fastest possible answer.
- bullets: 3-5 items, each under 12 words.
  - behavioral/general: sketch a STAR arc without labeling it.
  - technical/case: solution outline (clarifying question if underspecified → approach → steps → tradeoffs). No full code.
- tradeoff: one optional line noting a caveat or tradeoff, empty string if none.
- full_answer: natural spoken language, contractions, no corporate filler.
- note: flag if question was garbled or context was too thin; empty string otherwise.

Respond with ONLY this JSON, no markdown fences, no preamble:
{
  "headline_answer": "...",
  "bullets": ["...", "...", "..."],
  "tradeoff": "",
  "full_answer": "...",
  "note": ""
}

If mode is "practice": evaluate the candidate's transcribed answer honestly.
- Check STAR structure (behavioral) or correctness/tradeoffs (technical).
- rewritten_answer stays close to what they actually said, sharpened not replaced.

Respond with ONLY this JSON:
{
  "score": 1-5,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "rewritten_answer": "...",
  "note": ""
}`;

  return template
    .replace('{mode}', mode)
    .replace('{question_type}', questionType)
    .replace('{role}', role || 'N/A')
    .replace('{company}', company || 'N/A')
    .replace('{resume_text}', resumeText || 'Not provided')
    .replace('{job_description}', jobDescription || 'Not provided')
    .replace('{company_culture}', companyCulture || 'Not provided')
    .replace('{question}', question || '')
    .replace('{candidate_answer}', candidateAnswer || '');
}

function buildLocalLiveResult({ role, company, questionType, question }) {
  const q = question || 'Tell me about a challenge you handled.';
  const isTechnical = questionType === 'technical' || questionType === 'case';

  if (isTechnical) {
    return {
      headline_answer: 'I would clarify constraints, then choose the simplest scalable design.',
      bullets: [
        'Clarify scale, latency, and failure constraints.',
        'Start with a simple reliable approach.',
        'Measure trade-offs before optimizing.',
        'Document edge cases and fallback paths.',
      ],
      tradeoff: 'The simplest solution may not be the fastest at extreme scale.',
      full_answer:
        "I’d start by clarifying the real constraints: traffic, latency, and failure modes. Then I’d choose the simplest design that solves the requirement reliably, and only add complexity if the data actually calls for it. I’d also call out the trade-offs clearly, especially around performance, cost, and operational risk.",
      note: '',
    };
  }

  return {
    headline_answer: 'I focused on the problem, aligned the team, and shipped the fix quickly.',
    bullets: [
      'Defined the problem and responsibilities clearly.',
      'Aligned cross-functional stakeholders early.',
      'Moved quickly with short feedback loops.',
      'Measured the outcome and improved the process.',
    ],
    tradeoff: 'A quick fix can create debt if the team does not learn from it.',
    full_answer:
      "I’d frame it as a cross-functional problem. First, I narrowed the issue and aligned everyone on the goal. Then I worked with the right partners to make a decision quickly, kept the feedback loop short, and focused on the outcome rather than just activity. After the change, I checked what actually improved and used that learning for the next iteration.",
    note: '',
  };
}

function buildLocalPracticeResult({ questionType, question, candidateAnswer }) {
  const base = {
    score: 4,
    strengths: ['Clear goal and structure.', 'Good use of practical examples.'],
    weaknesses: ['Add one more concrete metric or outcome.', 'Be more explicit on trade-offs.'],
    rewritten_answer:
      'I started by clarifying the actual problem and aligning the team on the goal. Then I worked with the right stakeholders, kept the feedback loop short, and focused on delivering a practical fix while measuring the result.',
    note: '',
  };

  if (questionType === 'technical') {
    return {
      score: 3,
      strengths: ['You identified the core trade-off.', 'You showed a reasonable first-principles approach.'],
      weaknesses: ['Explain the edge cases more clearly.', 'State the decision criteria before choosing a design.'],
      rewritten_answer:
        'I would first clarify the constraints, then choose the simplest design that satisfies the requirement. After that, I would test the trade-offs around latency, cost, and operational complexity before scaling or optimizing further.',
      note: '',
    };
  }

  return base;
}

async function callAnthropic({ apiKey, prompt }) {
  const key = apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error('No API key');
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Anthropic request failed');
  }

  const data = await res.json();
  const content = data?.content?.[0]?.text || '';
  if (!content) {
    throw new Error('Empty response');
  }

  return content.replace(/```json|```/g, '').trim();
}

async function generateGreenroomAnswer({ mode, session, question, candidateAnswer, apiKey }) {
  const prompt = buildPrompt({
    mode,
    questionType: session?.questionType || 'general',
    role: session?.role,
    company: session?.company,
    resumeText: session?.resumeText,
    jobDescription: session?.jobDescription,
    companyCulture: session?.companyCulture,
    question,
    candidateAnswer,
  });

  try {
    const rawJson = await callAnthropic({ apiKey, prompt });
    const parsed = JSON.parse(rawJson);
    if (mode === 'live') {
      return {
        headline_answer: parsed.headline_answer || 'I’d focus on the root cause and move quickly.',
        bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
        tradeoff: parsed.tradeoff || '',
        full_answer: parsed.full_answer || '',
        note: parsed.note || '',
      };
    }

    return {
      score: typeof parsed.score === 'number' ? parsed.score : 3,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Clear communication.'],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : ['Add more concrete outcomes.'],
      rewritten_answer: parsed.rewritten_answer || '',
      note: parsed.note || '',
    };
  } catch {
    if (mode === 'live') {
      return buildLocalLiveResult({
        role: session?.role,
        company: session?.company,
        questionType: session?.questionType,
        question,
      });
    }

    return buildLocalPracticeResult({
      questionType: session?.questionType,
      question,
      candidateAnswer,
    });
  }
}

function App() {
  const [nav, setNav] = useState('sessions');
  const [profile, setProfile] = useState(loadProfile);
  const [sessions, setSessions] = useState(loadStoredSessions);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [createMode, setCreateMode] = useState('live');
  const [showSetup, setShowSetup] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState('Listening for the next question...');
  const [manualQuestion, setManualQuestion] = useState('');
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [cue, setCue] = useState(null);
  const [errorText, setErrorText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [durationSecs, setDurationSecs] = useState(0);
  const [selectedImage, setSelectedImage] = useState('');
  const [viewingSessionId, setViewingSessionId] = useState(null);
  const [transcriptBuffer, setTranscriptBuffer] = useState('');
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) || null,
    [sessions, activeSessionId]
  );

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      setDurationSecs((v) => v + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSessionId]);

  useEffect(() => {
    if (!activeSession || !micEnabled || createMode !== 'live') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorText('This browser does not support Web Speech API. Use the manual question input instead.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          interimText += transcript;
        }
      }

      if (!interimText.trim()) return;
      const merged = `${transcriptBuffer} ${interimText}`.replace(/\s+/g, ' ').trim();
      setTranscriptBuffer(merged);
      if (looksLikeQuestion(merged)) {
        const question = merged.replace(/\s+[?!.]+$/, '').trim();
        setCurrentQuestion(question);
        setTranscriptBuffer('');
        if (question) {
          handleAnswerForQuestion(question);
        }
      }
    };

    recognition.onerror = () => {
      setErrorText('Listening paused. Try turning mic back on.');
    };

    recognition.onend = () => {
      if (micEnabled) {
        try {
          recognition.start();
        } catch {
          // Chrome restart guard
        }
      }
    };

    try {
      recognition.start();
    } catch {
      // ignore repeated start exceptions
    }

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [activeSessionId, micEnabled, createMode, transcriptBuffer]);

  const handleAnswerForQuestion = useCallback(
    async (questionText) => {
      if (!activeSession || !questionText?.trim()) return;
      setIsGenerating(true);
      setErrorText('');
      setCurrentQuestion(questionText);

      try {
        const payload = await generateGreenroomAnswer({
          mode: createMode,
          session: activeSession,
          question: questionText,
          candidateAnswer,
          apiKey: profile.apiKey,
        });

        const nextCue = payload;
        setCue(nextCue);

        const nextPair = {
          id: Date.now(),
          question: questionText,
          answer: nextCue,
          timestamp: new Date().toISOString(),
          screenshot: selectedImage || null,
        };

        setSessions((prev) =>
          prev.map((session) =>
            session.id === activeSession.id
              ? { ...session, qaPairs: [...(session.qaPairs || []), nextPair] }
              : session
          )
        );
      } catch {
        setCue({
          headline_answer: 'Could not reach the model. Try again.',
          bullets: ['Check your API key.', 'Retry the question.', 'Use the manual input as a fallback.'],
          tradeoff: '',
          full_answer: 'I could not reach the model. Please retry or use the manual input to continue.',
          note: 'Model request failed.',
        });
        setErrorText("Couldn't reach the model, try again.");
      } finally {
        setIsGenerating(false);
      }
    },
    [activeSession, candidateAnswer, createMode, profile.apiKey, selectedImage]
  );

  const createSession = (mode) => {
    const session = {
      id: `session-${Date.now()}`,
      company: profile.company,
      role: profile.role,
      questionType: profile.interviewType,
      resumeText: profile.resumeText,
      jobDescription: profile.jobDescription,
      companyCulture: profile.companyCulture,
      createdAt: new Date().toISOString(),
      duration: 0,
      status: 'Active',
      mode,
      qaPairs: [],
    };

    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.id);
    setCreateMode(mode);
    setShowSetup(false);
    setMicEnabled(mode === 'live');
    setDurationSecs(0);
    setCue(null);
    setCurrentQuestion(mode === 'live' ? 'Listening for the next question...' : 'Practice mode is ready.');
    setErrorText('');
  };

  const endSession = () => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === activeSessionId ? { ...session, status: 'Ended', duration: durationSecs } : session
      )
    );
    setMicEnabled(false);
    setShowSetup(false);
    setCurrentQuestion('Session ended.');
  };

  const handleManualSubmit = () => {
    const value = manualQuestion.trim();
    if (!value) return;
    setManualQuestion('');
    handleAnswerForQuestion(value);
  };

  const handleCaptureScreenshot = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  const latestSessionList = useMemo(() => sessions.slice(0, 6), [sessions]);

  return (
    <div className="min-h-screen bg-[#14171F] text-slate-100">
      <div className="mx-auto max-w-[1600px] p-3 md:p-6">
        <header className="flex items-center justify-between rounded-t-2xl border border-white/10 bg-[#F6F6F2]/90 px-5 py-4 text-slate-900 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600">
              <span className="h-3 w-3 rounded-full bg-[#0d1f1a]" />
            </div>
            <div className="text-2xl font-bold tracking-[-0.05em]">Parakeet <span className="font-black">AI</span></div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
            <a href="#" className="hover:text-slate-900">Features</a>
            <a href="#" className="hover:text-slate-900">Reviews</a>
            <a href="#" className="hover:text-slate-900">Privacy</a>
            <a href="#" className="hover:text-slate-900">Pricing</a>
          </nav>

          <button className="rounded-xl border border-slate-300 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800">
            Dashboard
          </button>
        </header>

        <div className="grid min-h-[calc(100vh-110px)] grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-r border-slate-200 bg-[#ECECEC] p-3 text-slate-800">
            <div className="mb-4 flex items-center gap-3 rounded-xl px-2 py-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand-400 to-brand-600">
                <span className="h-3 w-3 rounded-full bg-[#0d1f1a]" />
              </div>
              <div className="font-bold tracking-[-0.04em]">Parakeet <span>AI</span></div>
            </div>

            <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Workspace</div>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setNav(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium ${
                    nav === item.id ? 'bg-slate-200/80 text-slate-900' : 'text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  <span className="text-base">{item.id === 'sessions' ? '◔' : item.id === 'resumes' ? '▣' : '▤'}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="mt-8 px-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Support</div>
            <div className="mt-2 space-y-2">
              <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-200/50">
                <span>◍</span>
                <span>Tutorials</span>
              </button>
              <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-200/50">
                <span>◌</span>
                <span>Support Chat</span>
              </button>
            </div>

            <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-100/90 p-4 shadow-soft">
              <div className="mb-2 text-lg font-bold">Free Plan</div>
              <p className="mb-4 text-sm leading-5 text-slate-600">
                Start a 10 min free session or buy credits for full-length calls.
              </p>
              <button type="button" className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
                Upgrade
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-200/50">
                <span>☼</span>
                <span>Theme</span>
                <span className="ml-auto text-slate-500">Auto</span>
              </button>
              <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-200/50">
                <span>▣</span>
                <span>Open Desktop App</span>
              </button>
              <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-200/50">
                <span>↩</span>
                <span>Log Out</span>
              </button>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-xl px-2 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-700 text-xs font-bold text-white">
                AS
              </div>
              <div className="min-w-0">
                <div className="truncate text-[11px] font-bold uppercase tracking-[0.08em]">ASISH RANJAN SAHU</div>
                <div className="truncate text-[11px] text-slate-500">asishranjansahu2003@gmail.com</div>
              </div>
            </div>
          </aside>

          <main className="bg-[#F4F6F3] p-4 text-slate-900 md:p-6">
            {nav === 'sessions' && (
              <>
                {!activeSession && !showSetup && (
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-[2.2rem] font-bold tracking-[-0.06em]">Call Sessions</div>
                      <p className="mt-1 text-sm text-slate-600">Prepare for calls and review past sessions.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSetup(true)}
                      className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-soft"
                    >
                      + Create Session
                    </button>
                  </div>
                )}

                {showSetup && !activeSession && (
                  <div className="glass-panel rounded-2xl p-5 md:p-6">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xl font-bold">Session setup</div>
                        <div className="text-sm text-slate-400">Create a fresh interview profile</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setCreateMode('practice')}
                          className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                            createMode === 'practice' ? 'bg-brand-500 text-slate-950' : 'bg-white/5 text-slate-200'
                          }`}
                        >
                          Practice
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreateMode('live')}
                          className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                            createMode === 'live' ? 'bg-brand-500 text-slate-950' : 'bg-white/5 text-slate-200'
                          }`}
                        >
                          Live
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 text-sm text-slate-300">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Company</span>
                        <input
                          value={profile.company}
                          onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))}
                          className="w-full rounded-xl border border-white/10 bg-[#111821] px-3 py-2.5 text-slate-100 outline-none ring-0 placeholder:text-slate-500"
                        />
                      </label>

                      <label className="space-y-2 text-sm text-slate-300">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Role / Title</span>
                        <input
                          value={profile.role}
                          onChange={(e) => setProfile((p) => ({ ...p, role: e.target.value }))}
                          className="w-full rounded-xl border border-white/10 bg-[#111821] px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-500"
                        />
                      </label>

                      <label className="space-y-2 text-sm text-slate-300">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Interview Type</span>
                        <select
                          value={profile.interviewType}
                          onChange={(e) => setProfile((p) => ({ ...p, interviewType: e.target.value }))}
                          className="w-full rounded-xl border border-white/10 bg-[#111821] px-3 py-2.5 text-slate-100 outline-none"
                        >
                          <option value="behavioral">Behavioral</option>
                          <option value="technical">Technical</option>
                          <option value="case">Case</option>
                          <option value="general">General</option>
                        </select>
                      </label>

                      <label className="space-y-2 text-sm text-slate-300">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Anthropic API Key</span>
                        <input
                          type="password"
                          value={profile.apiKey}
                          onChange={(e) => setProfile((p) => ({ ...p, apiKey: e.target.value }))}
                          placeholder="Optional: private key for direct model access"
                          className="w-full rounded-xl border border-white/10 bg-[#111821] px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-500"
                        />
                      </label>

                      <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Resume / Background</span>
                        <textarea
                          value={profile.resumeText}
                          onChange={(e) => setProfile((p) => ({ ...p, resumeText: e.target.value }))}
                          className="min-h-[110px] w-full rounded-xl border border-white/10 bg-[#111821] px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-500"
                        />
                      </label>

                      <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Job Description</span>
                        <textarea
                          value={profile.jobDescription}
                          onChange={(e) => setProfile((p) => ({ ...p, jobDescription: e.target.value }))}
                          className="min-h-[110px] w-full rounded-xl border border-white/10 bg-[#111821] px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-500"
                        />
                      </label>

                      <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Company Culture Notes</span>
                        <textarea
                          value={profile.companyCulture}
                          onChange={(e) => setProfile((p) => ({ ...p, companyCulture: e.target.value }))}
                          className="min-h-[90px] w-full rounded-xl border border-white/10 bg-[#111821] px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-500"
                        />
                      </label>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => createSession(createMode)}
                        className="primary-btn flex-1"
                      >
                        Create session
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSetup(false)}
                        className="panel-btn flex-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {activeSession && (
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-soft">
                    <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
                      <div>
                        <div className="text-2xl font-bold tracking-[-0.05em]">{activeSession.company}</div>
                        <div className="text-sm text-slate-600">{activeSession.role}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700">
                          {activeSession.mode}
                        </span>
                        <button type="button" onClick={endSession} className="rounded-xl bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-700">
                          End session
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                      <div className="space-y-4">
                        <div className="glass-panel rounded-2xl p-4">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <button type="button" className="panel-btn">Answer</button>
                            <button type="button" className="panel-btn">Screenshot</button>
                            <button type="button" className="panel-btn">Chat</button>
                            <button type="button" onClick={endSession} className="panel-btn border-red-500/30 bg-red-500/8 text-red-700">
                              End
                            </button>
                          </div>

                          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-100 p-3">
                            <div className="text-sm text-slate-600">Session time</div>
                            <div className="font-semibold">{formatDuration(durationSecs)}</div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setMicEnabled((v) => !v)}
                              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                                micEnabled ? 'bg-brand-500 text-slate-950' : 'bg-slate-900 text-white'
                              }`}
                            >
                              {micEnabled ? 'Mic on' : 'Mic off'}
                            </button>

                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="panel-btn"
                            >
                              Screenshot
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCaptureScreenshot} />
                          </div>

                          {selectedImage && (
                            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                              <img src={selectedImage} alt="User capture" className="h-32 w-full object-cover" />
                            </div>
                          )}
                        </div>

                        <div className="glass-panel rounded-2xl p-4">
                          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Detected question</div>
                          <div className="rounded-xl bg-slate-900 p-3 text-lg font-medium text-slate-50">{currentQuestion}</div>

                          <div className="mt-4 flex gap-2">
                            <input
                              value={manualQuestion}
                              onChange={(e) => setManualQuestion(e.target.value)}
                              placeholder="Or type the question here"
                              className="flex-1 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 outline-none"
                            />
                            <button type="button" onClick={handleManualSubmit} className="primary-btn">
                              Send
                            </button>
                          </div>
                        </div>

                        {cue && (
                          <div className="glass-panel rounded-2xl p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Cue card</div>
                              <div className="flex items-center gap-2 text-xl">
                                <button type="button" aria-label="Thumbs up">👍</button>
                                <button type="button" aria-label="Thumbs down">👎</button>
                              </div>
                            </div>

                            <div className="mb-3 rounded-xl bg-slate-900 p-3 text-base font-bold text-slate-50">
                              {cue.headline_answer}
                            </div>

                            <ul className="space-y-2 text-sm text-slate-200">
                              {(cue.bullets || []).map((bullet, index) => (
                                <li key={`${bullet}-${index}`} className="flex gap-2">
                                  <span className="text-brand-400">•</span>
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>

                            {cue.tradeoff && <div className="mt-3 text-sm text-slate-300">Trade-off: {cue.tradeoff}</div>}
                            {cue.full_answer && <div className="mt-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">{cue.full_answer}</div>}
                            {cue.note && <div className="mt-3 text-sm text-amber-600">Note: {cue.note}</div>}
                          </div>
                        )}
                      </div>

                      <aside className="glass-panel rounded-2xl p-4">
                        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Transcript</div>
                        <div className="space-y-3">
                          {(activeSession.qaPairs || []).length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                              No questions captured yet.
                            </div>
                          ) : (
                            activeSession.qaPairs.slice(-5).reverse().map((pair) => (
                              <div key={pair.id} className="rounded-xl border border-slate-200 bg-slate-100 p-3">
                                <div className="mb-2 text-[11px] uppercase tracking-[0.08em] text-slate-500">
                                  {new Date(pair.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="font-semibold text-slate-800">Q: {pair.question}</div>
                                <div className="mt-2 text-sm text-slate-600">A: {pair.answer?.headline_answer || pair.answer?.rewritten_answer || 'Answer ready'}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </aside>
                    </div>
                  </div>
                )}

                {!activeSession && (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-soft">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="text-xl font-bold">Recent sessions</div>
                      <span className="text-sm text-slate-500">{sessions.length} total</span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {latestSessionList.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                          No session history yet.
                        </div>
                      ) : (
                        latestSessionList.map((session) => (
                          <div key={session.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                              {new Date(session.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                            <div className="mb-2 flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                                {session.company?.slice(0, 1).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800">{session.company}</div>
                                <div className="text-sm text-slate-500">{session.role}</div>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] uppercase tracking-[0.08em] text-slate-700">{session.mode}</span>
                              <span className="rounded-full bg-brand-500/10 px-2 py-1 text-[11px] uppercase tracking-[0.08em] text-brand-700">{session.status}</span>
                            </div>

                            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                              <span>{session.qaPairs?.length || 0} Q&A</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveSessionId(session.id);
                                  setShowSetup(false);
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold"
                              >
                                Open
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {nav === 'resumes' && (
              <div className="glass-panel rounded-2xl p-6">
                <div className="mb-3 text-2xl font-bold tracking-[-0.05em]">CVs & Resumes</div>
                <textarea
                  value={profile.resumeText}
                  onChange={(e) => setProfile((p) => ({ ...p, resumeText: e.target.value }))}
                  className="min-h-[260px] w-full rounded-2xl border border-white/10 bg-[#111821] p-4 text-slate-100 outline-none"
                />
              </div>
            )}

            {nav === 'documents' && (
              <div className="glass-panel rounded-2xl p-6">
                <div className="mb-3 text-2xl font-bold tracking-[-0.05em]">Documents</div>
                <textarea
                  value={profile.jobDescription}
                  onChange={(e) => setProfile((p) => ({ ...p, jobDescription: e.target.value }))}
                  className="min-h-[260px] w-full rounded-2xl border border-white/10 bg-[#111821] p-4 text-slate-100 outline-none"
                />
              </div>
            )}
          </main>
        </div>
      </div>

      {errorText && (
        <div className="fixed bottom-5 right-5 rounded-xl border border-amber-500/30 bg-[#1B212C] px-4 py-3 text-sm text-amber-200 shadow-soft">
          {errorText}
        </div>
      )}

      {isGenerating && (
        <div className="fixed inset-x-0 top-6 mx-auto w-fit rounded-full border border-brand-500/40 bg-[#0d1218] px-4 py-2 text-sm text-brand-300 shadow-soft">
          Generating answer…
        </div>
      )}
    </div>
  );
}

export default App;
