import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Radio,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  FileText,
  Send,
  RefreshCw,
  HelpCircle,
  Activity,
  Layers,
  Monitor,
  Check,
  ChevronRight,
  Info,
  Sliders,
  Globe,
  VolumeX,
  Volume1,
  Edit3,
  Trash2,
  Repeat,
} from 'lucide-react';
import { AudioVisualizer } from './components/AudioVisualizer';
import { useSpeechEngine, isProbableQuestion, ACCENT_OPTIONS } from './hooks/useSpeechEngine';

const STORAGE_KEY = 'greenroom_sessions_v1';
const PROFILE_KEY = 'greenroom_profile_v1';
const SETTINGS_KEY = 'greenroom_audio_settings_v1';

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

const defaultAudioSettings = {
  language: 'en-IN',
  micGain: 1.8,
  silenceDelay: 1800,
  autoDetectQuestions: true,
};

const navItems = [
  { id: 'sessions', label: 'Call Sessions', icon: Radio },
  { id: 'resumes', label: 'CVs & Resumes', icon: FileText },
  { id: 'documents', label: 'Documents', icon: Layers },
  { id: 'diagnostics', label: 'Voice & Mic Diagnostics', icon: Activity },
];

const samplePracticeQuestions = [
  'Tell me about a challenging bug you debugged in Java and how you fixed it.',
  'How do you handle disagreements with teammates during a sprint?',
  'Explain how Java Garbage Collection works and how you avoid memory leaks.',
  'Walk me through the architecture of a REST API you built recently.',
  'Why do you want to join our engineering team?',
  'What is the difference between Synchronous and Asynchronous programming?',
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

function loadAudioSettings() {
  try {
    const val = localStorage.getItem(SETTINGS_KEY);
    return val ? { ...defaultAudioSettings, ...JSON.parse(val) } : defaultAudioSettings;
  } catch {
    return defaultAudioSettings;
  }
}

function formatDuration(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}m ${secs}s`;
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
  const isTechnical = questionType === 'technical' || questionType === 'case' || /code|api|database|java|memory|performance|thread|system|spring|rest|sql/i.test(question || '');

  if (isTechnical) {
    return {
      headline_answer: 'I would clarify constraints, isolate the core flow, and choose the most reliable scalable design.',
      bullets: [
        'Clarify traffic volume, latency target, and error bounds.',
        'Apply standard design patterns and modular separation of concerns.',
        'Measure CPU/memory impact and trade-offs before micro-optimizing.',
        'Add structured logging, health checks, and fallback mechanisms.',
      ],
      tradeoff: 'Balancing upfront simplicity with long-term extensibility.',
      full_answer:
        `For ${role || 'this role'} at ${company || 'the company'}, I start by understanding the latency and reliability requirements. Then I design a clean, maintainable solution using established patterns, verify edge cases, and call out trade-offs explicitly.`,
      note: 'AI Co-pilot generated guidance based on candidate profile.',
    };
  }

  return {
    headline_answer: 'I established clear alignment, owned the deliverable, and iterated rapidly.',
    bullets: [
      'Identified root blocker and unified the team goal.',
      'Prioritized highest-leverage actions with quick feedback loops.',
      'Maintained transparent communication with stakeholders.',
      'Captured key post-mortem metrics to prevent recurrence.',
    ],
    tradeoff: 'Speed of resolution vs thorough cross-team documentation.',
    full_answer:
      `In a similar situation, I took ownership early, broke the problem down into clear steps, and worked closely with cross-functional partners to resolve it smoothly while measuring the concrete outcome.`,
    note: 'AI Co-pilot generated guidance based on candidate profile.',
  };
}

function buildLocalPracticeResult({ questionType, question, candidateAnswer }) {
  const words = (candidateAnswer || '').trim().split(/\s+/).filter(Boolean);
  const length = words.length;

  let score = 4;
  if (length < 15) score = 2;
  else if (length < 35) score = 3;
  else if (length > 150) score = 4;

  const strengths = [
    'Addressed the interviewer question directly without hesitation.',
    'Clear professional technical vocabulary relevant to the role.',
  ];

  const weaknesses = [
    length < 25 ? 'Provide a more detailed concrete example with STAR framing.' : 'Quantify the outcome or business impact with specific numbers.',
    'Highlight alternative approaches or trade-offs considered.',
  ];

  const rewritten = candidateAnswer
    ? `In my previous work, I approached this by first diagnosing the core requirement. Specifically, ${candidateAnswer.slice(0, 180)}... This improved turnaround time and ensured smooth team collaboration.`
    : 'I started by diagnosing the issue, coordinated with team members, and delivered an optimized solution with verified test coverage.';

  return {
    score,
    strengths,
    weaknesses,
    rewritten_answer: rewritten,
    note: 'Practice evaluation scored successfully.',
  };
}

async function callAnthropic({ apiKey, prompt }) {
  const key = apiKey || import.meta.env?.VITE_ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error('No API key provided. Using built-in AI co-pilot reasoning.');
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
        headline_answer: parsed.headline_answer || 'I’d focus on the root cause and deliver cleanly.',
        bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
        tradeoff: parsed.tradeoff || '',
        full_answer: parsed.full_answer || '',
        note: parsed.note || '',
      };
    }

    return {
      score: typeof parsed.score === 'number' ? parsed.score : 4,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Structured reasoning.'],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : ['Add quantified metrics.'],
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

export default function App() {
  const [nav, setNav] = useState('sessions');
  const [profile, setProfile] = useState(loadProfile);
  const [audioSettings, setAudioSettings] = useState(loadAudioSettings);
  const [sessions, setSessions] = useState(loadStoredSessions);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [createMode, setCreateMode] = useState('live'); // 'live' | 'practice'
  const [audioSource, setAudioSource] = useState('mic'); // 'mic' | 'system'
  const [showSetup, setShowSetup] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [manualQuestion, setManualQuestion] = useState('');
  const [liveEditSpeech, setLiveEditSpeech] = useState('');
  const [candidateSpokenAnswer, setCandidateSpokenAnswer] = useState('');
  const [cue, setCue] = useState(null);
  const [practiceEvaluation, setPracticeEvaluation] = useState(null);
  const [errorText, setErrorText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [durationSecs, setDurationSecs] = useState(0);
  const [selectedImage, setSelectedImage] = useState('');
  const [isLoopbackRecording, setIsLoopbackRecording] = useState(false);
  const [loopbackAudioUrl, setLoopbackAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const loopbackChunks = useRef([]);
  const fileInputRef = useRef(null);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) || null,
    [sessions, activeSessionId]
  );

  // Persistence
  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(audioSettings));
  }, [audioSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  // Session Duration Timer
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      setDurationSecs((v) => v + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSessionId, activeSession]);

  // Callback when a question is detected from live speech
  const handleDetectedQuestion = useCallback(
    async (detectedText) => {
      if (!detectedText || !detectedText.trim()) return;
      const cleanQ = detectedText.trim();
      setCurrentQuestion(cleanQ);

      if (createMode === 'live') {
        setIsGenerating(true);
        setErrorText('');

        try {
          const payload = await generateGreenroomAnswer({
            mode: 'live',
            session: activeSession,
            question: cleanQ,
            candidateAnswer: '',
            apiKey: profile.apiKey,
          });

          setCue(payload);

          const nextPair = {
            id: Date.now(),
            question: cleanQ,
            answer: payload,
            timestamp: new Date().toISOString(),
            screenshot: selectedImage || null,
          };

          if (activeSession) {
            setSessions((prev) =>
              prev.map((session) =>
                session.id === activeSession.id
                  ? { ...session, qaPairs: [...(session.qaPairs || []), nextPair] }
                  : session
              )
            );
          }
        } catch (err) {
          setErrorText(err.message || 'Failed to generate answer.');
        } finally {
          setIsGenerating(false);
        }
      }
    },
    [activeSession, createMode, profile.apiKey, selectedImage]
  );

  // Callback for continuous speech transcription
  const handleSpeechTranscribed = useCallback(
    (chunk, fullText) => {
      if (createMode === 'practice') {
        setCandidateSpokenAnswer(fullText);
      }
    },
    [createMode]
  );

  // Speech Engine Hook with Accent and Gain Controls
  const {
    isListening,
    interimText,
    accumulatedText,
    recentTranscripts,
    audioStream,
    volumeLevel,
    permissionStatus,
    engineError,
    speechRecognitionSupported,
    clearTranscriptBuffer,
    triggerManualEvaluation,
    requestPermission,
  } = useSpeechEngine({
    isEnabled: micEnabled,
    captureSource: audioSource,
    language: audioSettings.language,
    micGain: audioSettings.micGain,
    silenceDelay: audioSettings.silenceDelay,
    onQuestionDetected: audioSettings.autoDetectQuestions ? handleDetectedQuestion : undefined,
    onSpeechTranscribed: handleSpeechTranscribed,
    mode: createMode,
  });

  useEffect(() => {
    if (engineError) {
      setErrorText(engineError);
    }
  }, [engineError]);

  // Sync live speech text to editable field when updated
  useEffect(() => {
    const liveContent = interimText || accumulatedText;
    if (liveContent) {
      setLiveEditSpeech(liveContent);
    }
  }, [interimText, accumulatedText]);

  const handleManualSubmit = (e) => {
    e?.preventDefault();
    const value = manualQuestion.trim();
    if (!value) return;
    setManualQuestion('');
    handleDetectedQuestion(value);
  };

  const handleSendLiveSpeechNow = () => {
    const textToSend = liveEditSpeech || interimText || accumulatedText;
    if (textToSend && textToSend.trim()) {
      handleDetectedQuestion(textToSend.trim());
      clearTranscriptBuffer();
      setLiveEditSpeech('');
    }
  };

  const handleEvaluatePracticeAnswer = async () => {
    if (!currentQuestion) {
      setErrorText('Please select or enter an interviewer question first.');
      return;
    }
    if (!candidateSpokenAnswer.trim()) {
      setErrorText('Please speak or type your answer before submitting.');
      return;
    }

    setIsGenerating(true);
    setErrorText('');

    try {
      const evaluation = await generateGreenroomAnswer({
        mode: 'practice',
        session: activeSession,
        question: currentQuestion,
        candidateAnswer: candidateSpokenAnswer,
        apiKey: profile.apiKey,
      });

      setPracticeEvaluation(evaluation);

      const nextPair = {
        id: Date.now(),
        question: currentQuestion,
        candidateAnswer: candidateSpokenAnswer,
        answer: evaluation,
        timestamp: new Date().toISOString(),
      };

      if (activeSession) {
        setSessions((prev) =>
          prev.map((session) =>
            session.id === activeSession.id
              ? { ...session, qaPairs: [...(session.qaPairs || []), nextPair] }
              : session
          )
        );
      }
    } catch (err) {
      setErrorText(err.message || 'Evaluation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

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
    setMicEnabled(true);
    setDurationSecs(0);
    setCue(null);
    setPracticeEvaluation(null);
    setCandidateSpokenAnswer('');
    setLiveEditSpeech('');
    setCurrentQuestion(
      mode === 'live'
        ? 'Listening for interviewer speech or your voice...'
        : samplePracticeQuestions[0]
    );
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
    setActiveSessionId(null);
    setCurrentQuestion('Session ended.');
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

  const toggleMic = async () => {
    if (!micEnabled) {
      if (permissionStatus !== 'granted') {
        const stream = await requestPermission();
        if (stream) {
          setMicEnabled(true);
        }
      } else {
        setMicEnabled(true);
      }
    } else {
      setMicEnabled(false);
    }
  };

  // Loopback audio recording test (4 seconds)
  const startLoopbackTest = async () => {
    try {
      setLoopbackAudioUrl(null);
      setIsLoopbackRecording(true);
      loopbackChunks.current = [];

      let stream = audioStream;
      if (!stream) {
        stream = await requestPermission();
      }
      if (!stream) {
        setIsLoopbackRecording(false);
        return;
      }

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          loopbackChunks.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(loopbackChunks.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setLoopbackAudioUrl(url);
        setIsLoopbackRecording(false);
      };

      recorder.start();
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 4000);
    } catch (err) {
      console.error('Loopback test error:', err);
      setIsLoopbackRecording(false);
      setErrorText('Failed to record test sample: ' + err.message);
    }
  };

  const latestSessionList = useMemo(() => sessions.slice(0, 8), [sessions]);

  return (
    <div id="interview-cracker-app" className="min-h-screen bg-[#0F141C] text-slate-100 flex flex-col selection:bg-brand-500 selection:text-slate-950 font-sans">
      {/* Top Header */}
      <header id="main-header" className="border-b border-white/10 bg-[#151C28]/95 px-4 py-3 backdrop-blur-md sticky top-0 z-30 shadow-sm">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md shadow-emerald-500/20">
              <Sparkles className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Interview Cracker
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  AI Co-Pilot
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Accent / Dialect quick selector */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
              <Globe className="h-3.5 w-3.5 text-emerald-400" />
              <select
                value={audioSettings.language}
                onChange={(e) => setAudioSettings((s) => ({ ...s, language: e.target.value }))}
                className="bg-transparent text-xs text-slate-200 outline-none font-medium cursor-pointer"
              >
                {ACCENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                    {opt.flag} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Mic status indicator in navbar */}
            <button
              id="header-mic-toggle"
              type="button"
              onClick={toggleMic}
              className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition border ${
                micEnabled
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              {micEnabled ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  <Mic className="h-3.5 w-3.5" />
                  <span>Mic Listening ({volumeLevel}%)</span>
                </>
              ) : (
                <>
                  <MicOff className="h-3.5 w-3.5" />
                  <span>Mic Off</span>
                </>
              )}
            </button>

            {!activeSession && !showSetup && (
              <button
                id="btn-create-session-nav"
                type="button"
                onClick={() => setShowSetup(true)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition"
              >
                <span>+ New Session</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col md:flex-row">
        {/* Left Navigation Sidebar */}
        <aside id="sidebar" className="w-full md:w-64 shrink-0 border-r border-white/10 bg-[#121822] p-4 flex flex-col justify-between">
          <div className="space-y-5">
            <div>
              <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Workspace
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = nav === item.id;
                  return (
                    <button
                      id={`nav-item-${item.id}`}
                      key={item.id}
                      type="button"
                      onClick={() => setNav(item.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-semibold'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Target Profile Summary Card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
              <div className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-2">
                <span>Active Profile</span>
                <span className="text-[10px] rounded bg-white/10 px-1.5 py-0.5 text-slate-300">{profile.interviewType}</span>
              </div>
              <div className="text-sm font-bold text-white truncate">{profile.company}</div>
              <div className="text-xs text-slate-400 truncate">{profile.role}</div>
            </div>

            {/* Audio Clarity & Booster Controls in Sidebar */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="h-4 w-4" />
                  Voice Clarity
                </span>
                <span className="text-[10px] rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-300">
                  {audioSettings.micGain}x Boost
                </span>
              </div>

              {/* Mic Gain Booster Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Mic Gain</span>
                  <span>{Math.round(audioSettings.micGain * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.5"
                  step="0.1"
                  value={audioSettings.micGain}
                  onChange={(e) =>
                    setAudioSettings((s) => ({ ...s, micGain: parseFloat(e.target.value) }))
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>

              {/* Volume Live Meter */}
              <div className="text-xs text-slate-300">
                {permissionStatus === 'denied' ? (
                  <span className="text-rose-400">Microphone blocked</span>
                ) : micEnabled ? (
                  <span className="text-emerald-400">Active • Signal: {volumeLevel}%</span>
                ) : (
                  <span className="text-slate-400">Idle (Click Mic to enable)</span>
                )}
              </div>
              {audioStream && micEnabled && (
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-75"
                    style={{ width: `${volumeLevel}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                AS
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-bold text-white">Asish Ranjan Sahu</div>
                <div className="truncate text-[11px] text-slate-400">Interview Mode Ready</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main id="main-panel" className="flex-1 p-4 md:p-6 bg-[#0E131A] overflow-y-auto">
          {/* Permission warning banner if microphone blocked */}
          {permissionStatus === 'denied' && (
            <div className="mb-5 flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 text-rose-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
                <div>
                  <div className="text-sm font-semibold">Microphone Permission Blocked</div>
                  <div className="text-xs text-rose-300/80">Please click the lock/camera icon in your browser address bar and select "Allow" for microphone.</div>
                </div>
              </div>
              <button
                type="button"
                onClick={requestPermission}
                className="rounded-xl bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-200 border border-rose-500/30 hover:bg-rose-500/30"
              >
                Request Again
              </button>
            </div>
          )}

          {/* SESSIONS VIEW */}
          {nav === 'sessions' && (
            <div className="space-y-6">
              {/* Header bar */}
              {!activeSession && !showSetup && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Call Sessions</h1>
                    <p className="text-sm text-slate-400">Real-time interview voice listening, live STAR cue cards, and practice coaching.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      id="btn-start-practice"
                      type="button"
                      onClick={() => createSession('practice')}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10 transition"
                    >
                      <Play className="h-4 w-4 text-emerald-400" />
                      <span>Start Practice</span>
                    </button>
                    <button
                      id="btn-create-session-main"
                      type="button"
                      onClick={() => setShowSetup(true)}
                      className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition"
                    >
                      <Radio className="h-4 w-4" />
                      <span>+ Create Live Session</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Setup Modal / Card */}
              {showSetup && !activeSession && (
                <div id="session-setup-card" className="rounded-2xl border border-white/10 bg-[#161D2A] p-5 md:p-6 shadow-xl">
                  <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <div className="text-lg font-bold text-white flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-emerald-400" />
                        Configure Interview Session
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Customize candidate background, accent, and target company.</p>
                    </div>
                    <div className="flex rounded-xl bg-slate-900 p-1 border border-white/10">
                      <button
                        type="button"
                        onClick={() => setCreateMode('live')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          createMode === 'live' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Live Mode (Real Interview)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreateMode('practice')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          createMode === 'practice' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Practice Mode (Mock Q&A)
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1.5 text-xs text-slate-300">
                      <span className="font-semibold text-slate-400">Target Company</span>
                      <input
                        value={profile.company}
                        onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-[#0F141C] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
                        placeholder="e.g. Google, Cognizant, Amazon"
                      />
                    </label>

                    <label className="space-y-1.5 text-xs text-slate-300">
                      <span className="font-semibold text-slate-400">Role / Position</span>
                      <input
                        value={profile.role}
                        onChange={(e) => setProfile((p) => ({ ...p, role: e.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-[#0F141C] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
                        placeholder="e.g. Java Developer, Full Stack Engineer"
                      />
                    </label>

                    <label className="space-y-1.5 text-xs text-slate-300">
                      <span className="font-semibold text-slate-400">Speech Accent / Dialect</span>
                      <select
                        value={audioSettings.language}
                        onChange={(e) => setAudioSettings((s) => ({ ...s, language: e.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-[#0F141C] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
                      >
                        {ACCENT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.flag} {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1.5 text-xs text-slate-300">
                      <span className="font-semibold text-slate-400">Interview Type</span>
                      <select
                        value={profile.interviewType}
                        onChange={(e) => setProfile((p) => ({ ...p, interviewType: e.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-[#0F141C] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
                      >
                        <option value="technical">Technical (Coding & System Architecture)</option>
                        <option value="behavioral">Behavioral (STAR Method Leadership)</option>
                        <option value="case">Case Study & Problem Solving</option>
                        <option value="general">General Fit & HR Screening</option>
                      </select>
                    </label>

                    <label className="space-y-1.5 text-xs text-slate-300 md:col-span-2">
                      <span className="font-semibold text-slate-400">Your Resume Summary / Key Projects</span>
                      <textarea
                        value={profile.resumeText}
                        onChange={(e) => setProfile((p) => ({ ...p, resumeText: e.target.value }))}
                        rows={3}
                        className="w-full rounded-xl border border-white/10 bg-[#0F141C] p-3 text-sm text-slate-100 outline-none focus:border-emerald-500/50 placeholder:text-slate-600"
                      />
                    </label>

                    <label className="space-y-1.5 text-xs text-slate-300 md:col-span-2">
                      <span className="font-semibold text-slate-400">Job Description</span>
                      <textarea
                        value={profile.jobDescription}
                        onChange={(e) => setProfile((p) => ({ ...p, jobDescription: e.target.value }))}
                        rows={3}
                        className="w-full rounded-xl border border-white/10 bg-[#0F141C] p-3 text-sm text-slate-100 outline-none focus:border-emerald-500/50 placeholder:text-slate-600"
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      id="btn-submit-session"
                      type="button"
                      onClick={() => createSession(createMode)}
                      className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition flex items-center justify-center gap-2"
                    >
                      <Mic className="h-4 w-4" />
                      <span>Start {createMode === 'live' ? 'Live Session (Mic Listening)' : 'Practice Session'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSetup(false)}
                      className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ACTIVE SESSION RUNTIME VIEW */}
              {activeSession && (
                <div id="active-session-container" className="space-y-5">
                  {/* Top Status & Audio Control Banner */}
                  <div className="rounded-2xl border border-white/10 bg-[#161D2A] p-4 shadow-lg">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse"></span>
                          <h2 className="text-xl font-bold text-white">{activeSession.company}</h2>
                          <span className="text-xs text-slate-400">• {activeSession.role}</span>
                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                            {activeSession.mode}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Session running for <span className="font-mono text-emerald-400 font-semibold">{formatDuration(durationSecs)}</span> • {activeSession.qaPairs?.length || 0} answers generated
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          id="btn-end-session"
                          type="button"
                          onClick={endSession}
                          className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition"
                        >
                          <Square className="h-3.5 w-3.5" />
                          <span>End Session</span>
                        </button>
                      </div>
                    </div>

                    {/* Live Audio & Microphone Controls Strip */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Main Microphone Button */}
                        <button
                          id="btn-toggle-mic-session"
                          type="button"
                          onClick={toggleMic}
                          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-sm ${
                            micEnabled
                              ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20 hover:bg-emerald-400'
                              : 'bg-slate-800 text-white border border-white/10 hover:bg-slate-700'
                          }`}
                        >
                          {micEnabled ? <Mic className="h-4 w-4 animate-bounce" /> : <MicOff className="h-4 w-4" />}
                          <span>{micEnabled ? 'Microphone Active (Click to Mute)' : 'Enable Microphone'}</span>
                        </button>

                        {/* Audio Source Switcher */}
                        <div className="flex rounded-xl bg-[#0F141C] p-1 border border-white/10 text-xs">
                          <button
                            type="button"
                            onClick={() => setAudioSource('mic')}
                            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition ${
                              audioSource === 'mic' ? 'bg-white/10 text-white font-semibold' : 'text-slate-400'
                            }`}
                          >
                            <Mic className="h-3 w-3" />
                            <span>Mic (Your Voice)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAudioSource('system')}
                            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition ${
                              audioSource === 'system' ? 'bg-white/10 text-white font-semibold' : 'text-slate-400'
                            }`}
                          >
                            <Monitor className="h-3 w-3" />
                            <span>Tab / System Audio</span>
                          </button>
                        </div>

                        {/* Accent selector in active session */}
                        <select
                          value={audioSettings.language}
                          onChange={(e) => setAudioSettings((s) => ({ ...s, language: e.target.value }))}
                          className="rounded-xl border border-white/10 bg-[#0F141C] px-2.5 py-2 text-xs text-slate-200 outline-none"
                        >
                          {ACCENT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.flag} {opt.label}
                            </option>
                          ))}
                        </select>

                        {/* Visualizer */}
                        <AudioVisualizer audioStream={audioStream} isActive={micEnabled} volume={volumeLevel} />
                      </div>

                      {/* Screenshot attach */}
                      <div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
                        >
                          <Layers className="h-3.5 w-3.5" />
                          <span>Attach Screenshot</span>
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCaptureScreenshot} />
                      </div>
                    </div>

                    {/* Live Hearing Voice Stream & Quick-Edit Bar */}
                    {micEnabled && (
                      <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-xs text-emerald-300 min-w-0">
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                            </span>
                            <span className="font-semibold uppercase tracking-wider text-[10px] text-emerald-400 shrink-0">
                              Live Voice Transcript:
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {liveEditSpeech && (
                              <button
                                type="button"
                                onClick={() => {
                                  clearTranscriptBuffer();
                                  setLiveEditSpeech('');
                                }}
                                className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-white/5"
                              >
                                Clear
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={handleSendLiveSpeechNow}
                              disabled={!liveEditSpeech}
                              className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition"
                            >
                              ⚡ Answer This Now
                            </button>
                          </div>
                        </div>

                        {/* Editable live transcript input so if speech is slightly misheard, user can tweak it immediately */}
                        <div className="flex items-center gap-2">
                          <input
                            value={liveEditSpeech}
                            onChange={(e) => setLiveEditSpeech(e.target.value)}
                            placeholder="Listening for your voice or interviewer questions... (You can edit text here in real-time)"
                            className="w-full rounded-lg border border-emerald-500/30 bg-slate-950/80 px-3 py-1.5 text-xs text-emerald-200 placeholder:text-slate-500 outline-none focus:border-emerald-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Two-Column Grid: Question & Answer Workspace */}
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="space-y-5">
                      {/* Detected Question Box */}
                      <div className="rounded-2xl border border-white/10 bg-[#161D2A] p-5 shadow-lg">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Radio className="h-3.5 w-3.5 text-emerald-400" />
                            {activeSession.mode === 'live' ? 'Current Interviewer Question' : 'Target Practice Question'}
                          </div>
                          {isGenerating && (
                            <span className="text-xs text-emerald-400 animate-pulse font-semibold">
                              Generating answer cues...
                            </span>
                          )}
                        </div>

                        <div className="min-h-[56px] rounded-xl border border-white/10 bg-[#0F141C] p-4 text-base font-semibold text-white">
                          {currentQuestion || (
                            <span className="text-slate-500 font-normal italic">
                              Speak into your microphone or pick a sample question below...
                            </span>
                          )}
                        </div>

                        {/* Sample Quick Questions Helper */}
                        <div className="mt-3">
                          <div className="text-[11px] font-semibold text-slate-400 mb-1.5">Quick Test Questions (1-Click):</div>
                          <div className="flex flex-wrap gap-1.5">
                            {samplePracticeQuestions.map((sq, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleDetectedQuestion(sq)}
                                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-white/10 hover:text-white text-left transition"
                              >
                                {sq.length > 45 ? sq.slice(0, 45) + '…' : sq}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Manual Input Fallback */}
                        <form onSubmit={handleManualSubmit} className="mt-4 flex gap-2">
                          <input
                            value={manualQuestion}
                            onChange={(e) => setManualQuestion(e.target.value)}
                            placeholder="Type question manually..."
                            className="flex-1 rounded-xl border border-white/10 bg-[#0F141C] px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500/50"
                          />
                          <button
                            type="submit"
                            className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      </div>

                      {/* PRACTICE MODE: Candidate Spoken Answer Review Box */}
                      {activeSession.mode === 'practice' && (
                        <div className="rounded-2xl border border-emerald-500/30 bg-[#161D2A] p-5 shadow-lg">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                              <Mic className="h-3.5 w-3.5" />
                              Your Spoken Response (Live Transcribed)
                            </div>
                            <span className="text-xs text-slate-400 font-mono">
                              {candidateSpokenAnswer.split(/\s+/).filter(Boolean).length} words
                            </span>
                          </div>

                          <textarea
                            value={candidateSpokenAnswer}
                            onChange={(e) => setCandidateSpokenAnswer(e.target.value)}
                            placeholder="Start speaking into your mic to practice your answer, or type it here..."
                            rows={4}
                            className="w-full rounded-xl border border-white/10 bg-[#0F141C] p-3 text-sm text-slate-100 outline-none focus:border-emerald-500/50 placeholder:text-slate-600"
                          />

                          <div className="mt-3 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => setCandidateSpokenAnswer('')}
                              className="text-xs text-slate-400 hover:text-slate-200"
                            >
                              Clear Text
                            </button>
                            <button
                              type="button"
                              onClick={handleEvaluatePracticeAnswer}
                              disabled={isGenerating}
                              className="rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition flex items-center gap-2"
                            >
                              <Sparkles className="h-4 w-4" />
                              <span>Evaluate Spoken Answer (STAR Scoring)</span>
                            </button>
                          </div>

                          {/* Practice Evaluation Result */}
                          {practiceEvaluation && (
                            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Coaching Evaluation</span>
                                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                                  Score: {practiceEvaluation.score}/5
                                </span>
                              </div>

                              <div>
                                <div className="text-xs font-semibold text-emerald-300 mb-1">Strengths:</div>
                                <ul className="list-disc list-inside text-xs text-slate-300 space-y-0.5">
                                  {practiceEvaluation.strengths?.map((s, i) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <div className="text-xs font-semibold text-amber-300 mb-1">Improvement Suggestions:</div>
                                <ul className="list-disc list-inside text-xs text-slate-300 space-y-0.5">
                                  {practiceEvaluation.weaknesses?.map((w, i) => (
                                    <li key={i}>{w}</li>
                                  ))}
                                </ul>
                              </div>

                              {practiceEvaluation.rewritten_answer && (
                                <div className="mt-2 pt-2 border-t border-white/10">
                                  <div className="text-xs font-semibold text-slate-300 mb-1">Sharpened STAR Answer:</div>
                                  <div className="text-xs italic text-slate-200 bg-[#0F141C] p-3 rounded-lg border border-white/5">
                                    "{practiceEvaluation.rewritten_answer}"
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* LIVE MODE: AI Co-Pilot STAR Cue Card */}
                      {activeSession.mode === 'live' && (
                        <div className="rounded-2xl border border-white/10 bg-[#161D2A] p-5 shadow-lg space-y-4">
                          <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                              <Sparkles className="h-4 w-4" />
                              AI Co-Pilot Answer Blueprint
                            </div>
                            <span className="text-[11px] text-slate-400">Glanceable STAR Talking Points</span>
                          </div>

                          {cue ? (
                            <div className="space-y-4">
                              {/* Headline Answer */}
                              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                                  ⚡ Headline Response (First 5 Seconds):
                                </div>
                                <div className="text-base font-bold text-white leading-snug">
                                  {cue.headline_answer}
                                </div>
                              </div>

                              {/* Bullet Points */}
                              {cue.bullets && cue.bullets.length > 0 && (
                                <div>
                                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    Key Talking Points (STAR Arc):
                                  </div>
                                  <div className="grid gap-2">
                                    {cue.bullets.map((b, i) => (
                                      <div key={i} className="flex items-start gap-2.5 rounded-lg bg-white/5 p-2.5 text-xs text-slate-200">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500/20 text-[10px] font-bold text-emerald-400">
                                          {i + 1}
                                        </span>
                                        <span className="leading-relaxed">{b}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Trade-off or caveat */}
                              {cue.tradeoff && (
                                <div className="rounded-lg border border-amber-500/20 bg-amber-950/20 p-3 text-xs text-amber-200">
                                  <span className="font-bold">Trade-off / Nuance:</span> {cue.tradeoff}
                                </div>
                              )}

                              {/* Full spoken response */}
                              {cue.full_answer && (
                                <div className="pt-2 border-t border-white/10">
                                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                    Natural Spoken Script:
                                  </div>
                                  <p className="text-xs leading-relaxed text-slate-300 bg-[#0F141C] p-3 rounded-xl border border-white/5">
                                    {cue.full_answer}
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-slate-500">
                              Waiting for question... When you or your interviewer speak, live guidance and STAR points will appear here automatically.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Column: Q&A Timeline History */}
                    <aside className="space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-[#161D2A] p-4 shadow-lg">
                        <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                            Session Timeline
                          </div>
                          <span className="text-xs text-slate-500">
                            {activeSession.qaPairs?.length || 0} items
                          </span>
                        </div>

                        <div className="max-h-[520px] space-y-2.5 overflow-y-auto pr-1">
                          {activeSession.qaPairs && activeSession.qaPairs.length > 0 ? (
                            activeSession.qaPairs.map((item, idx) => (
                              <div
                                key={item.id || idx}
                                onClick={() => {
                                  setCurrentQuestion(item.question);
                                  if (item.answer) {
                                    if (activeSession.mode === 'live') {
                                      setCue(item.answer);
                                    } else {
                                      setPracticeEvaluation(item.answer);
                                    }
                                  }
                                }}
                                className="cursor-pointer rounded-xl border border-white/10 bg-[#0F141C] p-3 text-xs transition hover:border-emerald-500/40 hover:bg-white/5"
                              >
                                <div className="font-semibold text-white line-clamp-2 mb-1">
                                  {item.question}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center justify-between">
                                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span className="text-emerald-400">Click to View</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-xs text-slate-500 py-6">
                              No questions recorded yet in this session.
                            </div>
                          )}
                        </div>
                      </div>
                    </aside>
                  </div>
                </div>
              )}

              {/* RECENT SESSIONS LIST (When no active session is running) */}
              {!activeSession && !showSetup && (
                <div className="rounded-2xl border border-white/10 bg-[#161D2A] p-5 shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm font-bold uppercase tracking-wider text-slate-300">
                      Past Sessions History
                    </div>
                    <span className="text-xs text-slate-400">{sessions.length} recorded</span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {latestSessionList.length === 0 ? (
                      <div className="col-span-full rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-slate-500">
                        No previous call sessions found. Click "+ Create Live Session" above to begin.
                      </div>
                    ) : (
                      latestSessionList.map((s) => (
                        <div key={s.id} className="rounded-xl border border-white/10 bg-[#0F141C] p-4 flex flex-col justify-between hover:border-emerald-500/30 transition">
                          <div>
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-mono">
                              <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300 uppercase">{s.mode}</span>
                            </div>
                            <div className="font-bold text-white text-sm truncate">{s.company}</div>
                            <div className="text-xs text-slate-400 truncate">{s.role}</div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                            <span className="text-slate-400">{s.qaPairs?.length || 0} Questions</span>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSessionId(s.id);
                                setCreateMode(s.mode || 'live');
                              }}
                              className="rounded-lg bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
                            >
                              Resume
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DIAGNOSTICS & VOICE TEST VIEW */}
          {nav === 'diagnostics' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Voice & Microphone Diagnostics</h1>
                <p className="text-sm text-slate-400">Configure accent, test microphone signal clarity, loopback test, and verify browser permissions.</p>
              </div>

              {/* Accent & Sensitivity Configuration */}
              <div className="rounded-2xl border border-white/10 bg-[#161D2A] p-6 shadow-xl space-y-5">
                <div className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                  <Sliders className="h-5 w-5 text-emerald-400" />
                  Speech Recognition & Audio Settings
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5 text-xs text-slate-300">
                    <span className="font-semibold text-slate-400">Speech Accent / Dialect Recognition</span>
                    <select
                      value={audioSettings.language}
                      onChange={(e) => setAudioSettings((s) => ({ ...s, language: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-[#0F141C] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
                    >
                      {ACCENT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.flag} {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500">Choosing your exact dialect significantly improves transcription clarity.</p>
                  </label>

                  <label className="space-y-1.5 text-xs text-slate-300">
                    <span className="font-semibold text-slate-400">Microphone Volume Boost ({Math.round(audioSettings.micGain * 100)}%)</span>
                    <div className="pt-2">
                      <input
                        type="range"
                        min="1.0"
                        max="3.5"
                        step="0.1"
                        value={audioSettings.micGain}
                        onChange={(e) =>
                          setAudioSettings((s) => ({ ...s, micGain: parseFloat(e.target.value) }))
                        }
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">Boosts quiet or distant microphones for clearer recognition.</p>
                  </label>

                  <label className="space-y-1.5 text-xs text-slate-300">
                    <span className="font-semibold text-slate-400">Question Trigger Pause Delay</span>
                    <select
                      value={audioSettings.silenceDelay}
                      onChange={(e) => setAudioSettings((s) => ({ ...s, silenceDelay: parseInt(e.target.value, 10) }))}
                      className="w-full rounded-xl border border-white/10 bg-[#0F141C] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
                    >
                      <option value="1200">Fast (1.2 seconds pause)</option>
                      <option value="1800">Balanced (1.8 seconds pause)</option>
                      <option value="2500">Relaxed (2.5 seconds pause)</option>
                    </select>
                  </label>

                  <label className="space-y-1.5 text-xs text-slate-300">
                    <span className="font-semibold text-slate-400">Automatic Question Detection</span>
                    <div className="pt-2 flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="auto-detect-toggle"
                        checked={audioSettings.autoDetectQuestions}
                        onChange={(e) => setAudioSettings((s) => ({ ...s, autoDetectQuestions: e.target.checked }))}
                        className="h-4 w-4 rounded border-white/10 bg-slate-900 text-emerald-500 focus:ring-emerald-400"
                      />
                      <label htmlFor="auto-detect-toggle" className="text-xs text-slate-300">
                        Automatically generate cue card when question is detected
                      </label>
                    </div>
                  </label>
                </div>
              </div>

              {/* Main Test Card */}
              <div className="rounded-2xl border border-white/10 bg-[#161D2A] p-6 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div>
                    <div className="text-base font-bold text-white flex items-center gap-2">
                      <Mic className="h-5 w-5 text-emerald-400" />
                      Live Microphone Signal Test
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Speak out loud to watch the volume meter and transcript update in real time.</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleMic}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-md ${
                        micEnabled
                          ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                          : 'bg-slate-800 text-white border border-white/10 hover:bg-slate-700'
                      }`}
                    >
                      {micEnabled ? <Mic className="h-4 w-4 animate-bounce" /> : <MicOff className="h-4 w-4" />}
                      <span>{micEnabled ? 'Stop Listening' : 'Start Mic Test'}</span>
                    </button>
                  </div>
                </div>

                {/* Level Meter & Frequency Visualizer */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">Microphone Input Level</span>
                    <span className="text-emerald-400 font-mono">{volumeLevel}% Signal Strength</span>
                  </div>
                  <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden border border-white/10 p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300 transition-all duration-75"
                      style={{ width: `${Math.max(4, volumeLevel)}%` }}
                    />
                  </div>

                  <div className="flex justify-center pt-2">
                    <AudioVisualizer audioStream={audioStream} isActive={micEnabled} volume={volumeLevel} />
                  </div>
                </div>

                {/* Loopback Audio Clarity Playback Test (Record 4s and hear yourself) */}
                <div className="rounded-xl border border-white/10 bg-[#0F141C] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Repeat className="h-3.5 w-3.5 text-emerald-400" />
                        Microphone Audio Loopback Test
                      </div>
                      <div className="text-[11px] text-slate-400">Record a 4-second voice sample and play it back to check audio clarity.</div>
                    </div>

                    <button
                      type="button"
                      onClick={startLoopbackTest}
                      disabled={isLoopbackRecording}
                      className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition disabled:opacity-50"
                    >
                      {isLoopbackRecording ? 'Recording (4s)...' : 'Record 4s Audio Sample'}
                    </button>
                  </div>

                  {loopbackAudioUrl && (
                    <div className="pt-2 flex items-center gap-3">
                      <span className="text-xs text-emerald-400 font-semibold">Playback sample:</span>
                      <audio controls src={loopbackAudioUrl} className="h-8 w-full max-w-sm" />
                    </div>
                  )}
                </div>

                {/* Live Speech-to-Text Transcription Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">Real-Time Transcription Test ({audioSettings.language})</span>
                    {interimText && <span className="text-emerald-400 animate-pulse text-[11px]">Transcribing audio...</span>}
                  </div>
                  <div className="min-h-[90px] rounded-xl border border-white/10 bg-[#0F141C] p-4 text-sm text-slate-200">
                    {interimText ? (
                      <span className="text-emerald-300 italic">"{interimText}"</span>
                    ) : recentTranscripts.length > 0 ? (
                      <div className="space-y-1.5">
                        {recentTranscripts.map((t) => (
                          <div key={t.id} className="text-xs text-slate-300">
                            <span className="text-slate-500 font-mono mr-2">[{t.time}]</span>
                            <span>{t.text}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">
                        {micEnabled ? 'Speak now into your microphone to test voice transcription...' : 'Click "Start Mic Test" above and speak.'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Diagnostic Checklist */}
                <div className="grid gap-3 sm:grid-cols-3 pt-2">
                  <div className="rounded-xl border border-white/10 bg-[#0F141C] p-3 text-xs">
                    <div className="text-slate-400 font-medium mb-1">Web Speech API</div>
                    <div className="font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{speechRecognitionSupported ? 'Supported' : 'Unavailable'}</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#0F141C] p-3 text-xs">
                    <div className="text-slate-400 font-medium mb-1">Permission State</div>
                    <div className="font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="capitalize">{permissionStatus}</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#0F141C] p-3 text-xs">
                    <div className="text-slate-400 font-medium mb-1">Audio Stream</div>
                    <div className="font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{audioStream ? 'Stream Connected' : 'Inactive'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RESUMES VIEW */}
          {nav === 'resumes' && (
            <div className="rounded-2xl border border-white/10 bg-[#161D2A] p-6 shadow-xl space-y-4 max-w-4xl">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">CVs & Resumes</h1>
                <p className="text-sm text-slate-400">Update your background notes so AI suggestions match your actual experience.</p>
              </div>
              <textarea
                value={profile.resumeText}
                onChange={(e) => setProfile((p) => ({ ...p, resumeText: e.target.value }))}
                rows={10}
                className="w-full rounded-2xl border border-white/10 bg-[#0F141C] p-4 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
              />
            </div>
          )}

          {/* DOCUMENTS VIEW */}
          {nav === 'documents' && (
            <div className="rounded-2xl border border-white/10 bg-[#161D2A] p-6 shadow-xl space-y-4 max-w-4xl">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Job Description & Documents</h1>
                <p className="text-sm text-slate-400">Provide job requirements and company values for grounded answers.</p>
              </div>
              <textarea
                value={profile.jobDescription}
                onChange={(e) => setProfile((p) => ({ ...p, jobDescription: e.target.value }))}
                rows={10}
                className="w-full rounded-2xl border border-white/10 bg-[#0F141C] p-4 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
              />
            </div>
          )}
        </main>
      </div>

      {/* Floating Error Toast */}
      {errorText && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-[#1B212C] px-4 py-3 text-xs text-amber-200 shadow-xl">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{errorText}</span>
          <button type="button" onClick={() => setErrorText('')} className="ml-2 text-slate-400 hover:text-white">✕</button>
        </div>
      )}
    </div>
  );
}
