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
  Layers,
  Monitor,
  Copy,
  Check,
  Globe,
  Repeat,
  Sliders,
  Trash2,
  Download,
  Search,
  BookOpen,
  HelpCircle,
  VolumeX,
  RefreshCw,
  Plus,
  ArrowRight,
  Code2,
  Terminal,
  Eye,
  EyeOff,
  Zap,
  Maximize2,
} from 'lucide-react';
import { AudioVisualizer } from './components/AudioVisualizer';
import { useSpeechEngine, ACCENT_OPTIONS } from './hooks/useSpeechEngine';
import { findMatchingAnswer } from './utils/interviewKnowledgeBase';
import { StealthTeleprompter } from './components/StealthTeleprompter';
import { CodingProblemSolver } from './components/CodingProblemSolver';

const STORAGE_KEY = 'greenroom_sessions_v2';
const PROFILE_KEY = 'greenroom_profile_v2';
const SETTINGS_KEY = 'greenroom_audio_settings_v2';

const RESUME_PRESETS = [
  {
    id: 'java-fresher',
    name: 'Java Developer Fresher (Cognizant / IT Services)',
    company: 'Cognizant',
    role: 'Java Developer Fresher',
    interviewType: 'technical',
    resumeText:
      'Core Java (OOP, Collections, Multithreading, Streams, Exception Handling), Spring Boot REST APIs, Hibernate/JPA, PostgreSQL, JUnit. Built a Student Management & Order Processing REST API with JWT Authentication and Dockerized deployment.',
    jobDescription:
      'We are looking for an energetic Java developer to join our backend team. Must understand OOP concepts, write clean RESTful web services, debug SQL queries, and collaborate in Agile sprint cycles.',
    companyCulture: 'Client-focused, structured delivery, continuous learning, and collaborative teamwork.',
  },
  {
    id: 'spring-backend',
    name: 'Spring Boot & Microservices Backend Engineer',
    company: 'Fintech Corp',
    role: 'Backend Software Engineer',
    interviewType: 'technical',
    resumeText:
      '4 years experience designing microservices using Spring Cloud, Kafka event-driven architectures, Redis caching, and PostgreSQL. Reduced API latency by 35% through query optimization and connection pooling.',
    jobDescription:
      'Design high-throughput transaction processing systems. Experience with distributed caching, message queues, relational database indexing, and fault tolerance patterns.',
    companyCulture: 'High ownership, fast-paced shipping, observability-first mindset.',
  },
  {
    id: 'behavioral-lead',
    name: 'Behavioral & Leadership Fit',
    company: 'Global Tech Solutions',
    role: 'Associate Tech Lead',
    interviewType: 'behavioral',
    resumeText:
      'Led a squad of 5 engineers delivering customer-facing web platforms on tight quarterly deadlines. Mentored juniors, resolved cross-team dependency blockers, and conducted technical code reviews.',
    jobDescription:
      'Looking for a collaborative engineer who communicates clearly with product managers, resolves conflicts constructively, and leads by example using data-driven decisions.',
    companyCulture: 'Empathy, transparent communication, customer obsession, and continuous mentorship.',
  },
];

const defaultProfile = {
  company: 'Cognizant',
  role: 'Java Developer Fresher',
  interviewType: 'technical',
  resumeText:
    'Core Java (OOP, Collections Framework, Multithreading, Exception Handling, Streams), Spring Boot REST APIs, Hibernate/JPA, MySQL, Git, Maven. Built an Employee Management REST service with token authentication.',
  jobDescription:
    'We are hiring a Java Developer who can build reliable APIs, reason about data structures, write unit tests, and articulate technical decisions clearly.',
  companyCulture: 'Fast-moving, practical, collaborative, and quality-driven.',
  apiKey: '',
};

const defaultAudioSettings = {
  language: 'en-IN',
  micGain: 1.8,
  silenceDelay: 1800,
  autoDetectQuestions: true,
};

const sampleCategories = [
  {
    title: 'Java & Spring Boot Core',
    type: 'technical',
    questions: [
      'Explain how Java Garbage Collection works and how you prevent memory leaks.',
      'What is the difference between HashMap and ConcurrentHashMap in Java?',
      'How does Spring Boot Dependency Injection work under the hood (@Autowired vs Constructor)?',
      'Walk me through the architecture of a REST API you built recently.',
      'Explain the difference between Synchronous and Asynchronous programming in Java.',
      'What are Java 8 Streams and how do they differ from Collections?',
    ],
  },
  {
    title: 'Database & System Architecture',
    type: 'technical',
    questions: [
      'How do you optimize slow SQL queries and when should you add database indexes?',
      'What is the difference between SQL and NoSQL databases, and when would you choose each?',
      'How do you design a scalable rate limiter for an API endpoint?',
      'Explain the ACID properties of a relational database with real-world examples.',
      'How would you handle cache invalidation with Redis in a high-traffic application?',
    ],
  },
  {
    title: 'Behavioral & STAR Method',
    type: 'behavioral',
    questions: [
      'Tell me about a challenging bug you debugged under a tight deadline and how you resolved it.',
      'How do you handle disagreements with teammates or code review pushback?',
      'Describe a time when a project requirement changed midway. How did you adapt?',
      'Tell me about a mistake you made in production code and what you learned from it.',
      'Give an example of how you explained a complex technical concept to a non-technical stakeholder.',
    ],
  },
  {
    title: 'HR & Motivation',
    type: 'general',
    questions: [
      'Tell me about yourself and your background in software engineering.',
      'Why do you want to join our company and this specific engineering team?',
      'Where do you see yourself in 3 years as a developer?',
      'What are your greatest technical strengths and one area you are actively improving?',
    ],
  },
];

function loadStoredSessions() {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    const parsed = val ? JSON.parse(val) : [];
    if (parsed && parsed.length > 0) return parsed;
  } catch {
    // fallback
  }
  return [
    {
      id: 'sess_live_default',
      company: 'Cognizant',
      role: 'Java Developer Fresher',
      interviewType: 'technical',
      mode: 'live',
      resumeText: defaultProfile.resumeText,
      jobDescription: defaultProfile.jobDescription,
      companyCulture: defaultProfile.companyCulture,
      status: 'Active',
      createdAt: new Date().toISOString(),
      qaPairs: [],
    },
  ];
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
  return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
}

// Intelligent dynamic AI engine tailored to the question, resume, and role
function generateSmartAnswer({ mode, session, question, candidateAnswer }) {
  if (mode === 'live' || !mode) {
    return findMatchingAnswer({
      question,
      session,
      candidateAnswer,
      mode: 'live',
    });
  }

  // PRACTICE MODE EVALUATION
  const words = (candidateAnswer || '').trim().split(/\s+/).filter(Boolean);
  const length = words.length;

  let score = 4;
  if (length < 12) score = 2;
  else if (length < 25) score = 3;
  else if (length > 120) score = 5;

  const strengths = [];
  const weaknesses = [];

  if (length >= 25) {
    strengths.push('Good detail provided with clear technical terminology.');
    strengths.push('Addressed the question directly with logical flow.');
  } else {
    strengths.push('Direct initial response without excessive filler words.');
    weaknesses.push('Answer is too brief. Expand with concrete details and metrics (STAR method).');
  }

  if (/java|spring|sql|api|cache|thread|test|database|docker|rest/i.test(candidateAnswer || '')) {
    strengths.push('Included relevant domain keywords matching the role requirements.');
  } else {
    weaknesses.push('Incorporate more specific technical tools, libraries, or architectural terms.');
  }

  if (!/result|improved|reduced|shipped|outcome|percent|%/i.test(candidateAnswer || '')) {
    weaknesses.push('Quantify the final result (e.g. "reduced latency by 20%", "shipped 2 days ahead of schedule").');
  }

  const rewritten =
    candidateAnswer && candidateAnswer.length > 15
      ? `In my previous project, I addressed this directly: ${candidateAnswer.trim().replace(/\.$/, '')}. This ensured smooth reliability, verified test coverage with JUnit, and allowed our team to deliver on time.`
      : `In my previous experience with Java and Spring Boot, I approached this systematically: first diagnosing the core requirement, implementing a decoupled service layer, and verifying with integration tests to ensure 99.9% uptime.`;

  return {
    score,
    strengths: strengths.length ? strengths : ['Clear communication.'],
    weaknesses: weaknesses.length ? weaknesses : ['Mention alternative trade-offs considered.'],
    rewritten_answer: rewritten,
    note: 'Evaluated using STAR criteria and role technical benchmarks.',
  };
}

export default function App() {
  const [nav, setNav] = useState('sessions'); // 'sessions' | 'resumes' | 'documents' | 'diagnostics' | 'presets'
  const [profile, setProfile] = useState(loadProfile);
  const [audioSettings, setAudioSettings] = useState(loadAudioSettings);
  const [sessions, setSessions] = useState(loadStoredSessions);
  const [activeSessionId, setActiveSessionId] = useState(() => {
    const init = loadStoredSessions();
    return init[0]?.id || null;
  });
  const [createMode, setCreateMode] = useState('live'); // 'live' | 'practice'
  const [audioSource, setAudioSource] = useState('mic'); // 'mic' | 'system'
  const [showSetup, setShowSetup] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(() => sampleCategories[0].questions[0]);
  const [manualQuestion, setManualQuestion] = useState('');
  const [liveEditSpeech, setLiveEditSpeech] = useState('');
  const [candidateSpokenAnswer, setCandidateSpokenAnswer] = useState('');
  const [cue, setCue] = useState(() =>
    generateSmartAnswer({
      mode: 'live',
      session: defaultProfile,
      question: sampleCategories[0].questions[0],
    })
  );
  const [practiceEvaluation, setPracticeEvaluation] = useState(null);
  const [errorText, setErrorText] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [durationSecs, setDurationSecs] = useState(0);
  const [isSpeakingTTS, setIsSpeakingTTS] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [showStealthTeleprompter, setShowStealthTeleprompter] = useState(true);

  // Keyboard shortcut listener for Parakeet Stealth Teleprompter (Shift + P)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.shiftKey && (e.key === 'P' || e.key === 'p')) || e.key === 'F8') {
        e.preventDefault();
        setShowStealthTeleprompter((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Audio Loopback test state
  const [isLoopbackRecording, setIsLoopbackRecording] = useState(false);
  const [loopbackAudioUrl, setLoopbackAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const loopbackChunks = useRef([]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) || sessions[0] || {
      id: 'sess_live_default',
      company: profile.company || 'Cognizant',
      role: profile.role || 'Java Developer Fresher',
      interviewType: profile.interviewType || 'technical',
      mode: 'live',
      resumeText: profile.resumeText,
      jobDescription: profile.jobDescription,
      companyCulture: profile.companyCulture,
      status: 'Active',
      createdAt: new Date().toISOString(),
      qaPairs: [],
    },
    [sessions, activeSessionId, profile]
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
    if (!activeSession || activeSession.status === 'Ended') return;
    const interval = setInterval(() => {
      setDurationSecs((v) => v + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSessionId, activeSession]);

  // Auto-hide success toast after 3s
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Callback when a question is detected from live speech or user click
  const handleDetectedQuestion = useCallback(
    (detectedText) => {
      if (!detectedText || !detectedText.trim()) return;
      const cleanQ = detectedText.trim();
      setCurrentQuestion(cleanQ);

      let targetSession = activeSession;
      if (!targetSession) {
        const newSession = {
          id: `session-${Date.now()}`,
          company: profile.company || 'Cognizant',
          role: profile.role || 'Java Developer Fresher',
          questionType: profile.interviewType || 'technical',
          resumeText: profile.resumeText,
          jobDescription: profile.jobDescription,
          companyCulture: profile.companyCulture,
          createdAt: new Date().toISOString(),
          duration: 0,
          status: 'Active',
          mode: createMode || 'live',
          qaPairs: [],
        };
        targetSession = newSession;
        setActiveSessionId(newSession.id);
        setSessions((prev) => [newSession, ...prev]);
        setShowSetup(false);
        setNav('sessions');
      }

      if (createMode === 'live' || !createMode) {
        setIsGenerating(true);
        setErrorText('');

        try {
          const payload = generateSmartAnswer({
            mode: 'live',
            session: targetSession || profile,
            question: cleanQ,
            candidateAnswer: '',
          });

          setCue(payload);

          const nextPair = {
            id: Date.now(),
            question: cleanQ,
            answer: payload,
            timestamp: new Date().toISOString(),
          };

          setSessions((prev) =>
            prev.map((session) =>
              session.id === targetSession.id
                ? { ...session, qaPairs: [...(session.qaPairs || []), nextPair] }
                : session
            )
          );
        } catch (err) {
          setErrorText(err.message || 'Failed to generate answer.');
        } finally {
          setIsGenerating(false);
        }
      }
    },
    [activeSession, createMode, profile]
  );

  // Speech engine hook
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
    requestPermission,
  } = useSpeechEngine({
    isEnabled: micEnabled,
    captureSource: audioSource,
    language: audioSettings.language,
    micGain: audioSettings.micGain,
    silenceDelay: audioSettings.silenceDelay,
    onQuestionDetected: audioSettings.autoDetectQuestions ? handleDetectedQuestion : undefined,
    onSpeechTranscribed: (chunk, fullText) => {
      if (createMode === 'practice') {
        setCandidateSpokenAnswer(fullText);
      }
    },
    mode: createMode,
  });

  // Sync live speech text to editable field
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

  const handleEvaluatePracticeAnswer = () => {
    if (!currentQuestion) {
      setErrorText('Please select or enter an interviewer question first.');
      return;
    }
    if (!candidateSpokenAnswer.trim()) {
      setErrorText('Please speak or type your answer before evaluating.');
      return;
    }

    setIsGenerating(true);
    setErrorText('');

    try {
      const evaluation = generateSmartAnswer({
        mode: 'practice',
        session: activeSession || profile,
        question: currentQuestion,
        candidateAnswer: candidateSpokenAnswer,
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
    setDurationSecs(0);
    setCue(null);
    setPracticeEvaluation(null);
    setCandidateSpokenAnswer('');
    setLiveEditSpeech('');
    setCurrentQuestion(
      mode === 'live'
        ? sampleCategories[0].questions[0]
        : sampleCategories[0].questions[0]
    );
    setErrorText('');
    setNav('sessions');

    // Generate initial cue card immediately for instant preview
    if (mode === 'live') {
      const initialCue = generateSmartAnswer({
        mode: 'live',
        session,
        question: sampleCategories[0].questions[0],
      });
      setCue(initialCue);
    }
  };

  const endSession = () => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === activeSessionId ? { ...session, status: 'Ended', duration: durationSecs } : session
      )
    );
    setMicEnabled(false);
    setActiveSessionId(null);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeakingTTS(false);
    }
  };

  const deleteSession = (id, e) => {
    e?.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setMicEnabled(false);
    }
    setSuccessToast('Session deleted.');
  };

  const clearAllSessions = () => {
    if (window.confirm('Are you sure you want to clear all past sessions?')) {
      setSessions([]);
      setActiveSessionId(null);
      setMicEnabled(false);
      setSuccessToast('All sessions cleared.');
    }
  };

  const exportSessionTranscript = (session) => {
    if (!session || !session.qaPairs?.length) {
      setErrorText('No Q&A pairs to export in this session.');
      return;
    }

    let markdown = `# Interview Session: ${session.company} - ${session.role}\n`;
    markdown += `Date: ${new Date(session.createdAt).toLocaleString()}\n`;
    markdown += `Mode: ${session.mode.toUpperCase()} | Type: ${session.questionType}\n\n`;
    markdown += `## Candidate Background\n${session.resumeText}\n\n---\n\n`;

    session.qaPairs.forEach((pair, idx) => {
      markdown += `### Q${idx + 1}: ${pair.question}\n\n`;
      if (pair.answer?.headline_answer) {
        markdown += `**Headline Answer:** ${pair.answer.headline_answer}\n\n`;
        markdown += `**Key Talking Points:**\n`;
        pair.answer.bullets?.forEach((b) => {
          markdown += `- ${b}\n`;
        });
        if (pair.answer.tradeoff) {
          markdown += `\n**Trade-off:** ${pair.answer.tradeoff}\n`;
        }
        if (pair.answer.full_answer) {
          markdown += `\n**Spoken Script:**\n${pair.answer.full_answer}\n`;
        }
      } else if (pair.candidateAnswer) {
        markdown += `**Candidate's Spoken Answer:** ${pair.candidateAnswer}\n\n`;
        markdown += `**Coaching Score:** ${pair.answer?.score || 'N/A'}/5\n`;
        markdown += `**Sharpened Version:** ${pair.answer?.rewritten_answer || ''}\n`;
      }
      markdown += `\n---\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Interview-${session.company.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccessToast('Session transcript exported successfully!');
  };

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
    setSuccessToast('Copied to clipboard!');
  };

  // Text to speech narration of generated answers
  const stopTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingTTS(false);
  };

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) {
      setErrorText('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isSpeakingTTS) {
      stopTTS();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeakingTTS(false);
    utterance.onerror = () => setIsSpeakingTTS(false);

    setIsSpeakingTTS(true);
    window.speechSynthesis.speak(utterance);
  };

  const toggleMic = async () => {
    if (!micEnabled) {
      if (!activeSessionId) {
        const newSession = {
          id: `session-${Date.now()}`,
          company: profile.company || 'Cognizant',
          role: profile.role || 'Java Developer Fresher',
          questionType: profile.interviewType || 'technical',
          resumeText: profile.resumeText,
          jobDescription: profile.jobDescription,
          companyCulture: profile.companyCulture,
          createdAt: new Date().toISOString(),
          duration: 0,
          status: 'Active',
          mode: createMode || 'live',
          qaPairs: [],
        };
        setActiveSessionId(newSession.id);
        setSessions((prev) => [newSession, ...prev]);
        setShowSetup(false);
        setNav('sessions');
      }

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

  const applyPreset = (preset) => {
    setProfile({
      ...profile,
      company: preset.company,
      role: preset.role,
      interviewType: preset.interviewType,
      resumeText: preset.resumeText,
      jobDescription: preset.jobDescription,
      companyCulture: preset.companyCulture,
    });
    setSuccessToast(`Applied preset: ${preset.name}`);
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

  const filteredSessions = useMemo(() => {
    if (!historySearch.trim()) return sessions;
    const sLower = historySearch.toLowerCase();
    return sessions.filter(
      (s) =>
        s.company.toLowerCase().includes(sLower) ||
        s.role.toLowerCase().includes(sLower) ||
        s.qaPairs?.some((q) => q.question.toLowerCase().includes(sLower))
    );
  }, [sessions, historySearch]);

  return (
    <div id="interview-cracker-app" className="min-h-screen bg-[#0C1017] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Top Header */}
      <header id="main-header" className="border-b border-white/10 bg-[#131924]/95 px-4 py-3 backdrop-blur-md sticky top-0 z-30 shadow-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-500/20 text-slate-950">
              <Sparkles className="h-5 w-5 font-bold" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Interview Cracker</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  AI Co-Pilot
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dialect selector */}
            <div className="hidden md:flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
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

            {/* Parakeet Stealth Teleprompter Toggle */}
            <button
              id="header-teleprompter-toggle"
              type="button"
              onClick={() => setShowStealthTeleprompter((v) => !v)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition border ${
                showStealthTeleprompter
                  ? 'border-emerald-400 bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
              }`}
              title="Toggle Floating Teleprompter HUD (Shortcut: Shift + P)"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{showStealthTeleprompter ? 'HUD Active' : '⚡ Stealth HUD'}</span>
              <span className="hidden lg:inline text-[10px] opacity-75 font-mono">(Shift+P)</span>
            </button>

            {/* Quick Mic status indicator */}
            <button
              id="header-mic-toggle"
              type="button"
              onClick={toggleMic}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition border ${
                micEnabled
                  ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-sm'
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
                  <span>Mic Listening</span>
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
                <Plus className="h-3.5 w-3.5" />
                <span>New Session</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col md:flex-row">
        {/* Left Navigation Sidebar */}
        <aside id="sidebar" className="w-full md:w-64 shrink-0 border-r border-white/10 bg-[#10151E] p-4 flex flex-col justify-between">
          <div className="space-y-5">
            <div>
              <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Workspace
              </div>
              <nav className="space-y-1">
                <button
                  id="nav-item-sessions"
                  type="button"
                  onClick={() => setNav('sessions')}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    nav === 'sessions'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-semibold'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <Radio className={`h-4 w-4 ${nav === 'sessions' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>Call Sessions</span>
                </button>

                <button
                  id="nav-item-coding"
                  type="button"
                  onClick={() => setNav('coding')}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    nav === 'coding'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-semibold'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <Terminal className={`h-4 w-4 ${nav === 'coding' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>LeetCode & Code Solver</span>
                </button>

                <button
                  id="nav-item-presets"
                  type="button"
                  onClick={() => setNav('presets')}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    nav === 'presets'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-semibold'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <BookOpen className={`h-4 w-4 ${nav === 'presets' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>Role Presets & Questions</span>
                </button>

                <button
                  id="nav-item-resumes"
                  type="button"
                  onClick={() => setNav('resumes')}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    nav === 'resumes'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-semibold'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <FileText className={`h-4 w-4 ${nav === 'resumes' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>CVs & Resumes</span>
                </button>

                <button
                  id="nav-item-documents"
                  type="button"
                  onClick={() => setNav('documents')}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    nav === 'documents'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-semibold'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <Layers className={`h-4 w-4 ${nav === 'documents' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>Job Description</span>
                </button>

                <button
                  id="nav-item-diagnostics"
                  type="button"
                  onClick={() => setNav('diagnostics')}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    nav === 'diagnostics'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-semibold'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <Sliders className={`h-4 w-4 ${nav === 'diagnostics' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>Voice & Mic Settings</span>
                </button>
              </nav>
            </div>

            {/* Active Target Profile */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 space-y-1.5">
              <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Active Profile</span>
                <span className="text-[10px] rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-300 uppercase font-bold">
                  {profile.interviewType}
                </span>
              </div>
              <div className="text-sm font-bold text-white truncate">{profile.company}</div>
              <div className="text-xs text-slate-400 truncate">{profile.role}</div>
            </div>

            {/* Audio Clarity Booster */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="h-4 w-4" />
                  Voice Clarity
                </span>
                <span className="text-[10px] rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-300">
                  {audioSettings.micGain}x Boost
                </span>
              </div>

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

              <div className="text-xs text-slate-300">
                {micEnabled ? (
                  <span className="text-emerald-400">Listening • Level: {volumeLevel}%</span>
                ) : (
                  <span className="text-slate-400">Idle (Toggle mic to listen)</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                AS
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-bold text-white">Asish Ranjan Sahu</div>
                <div className="truncate text-[11px] text-slate-400">Ready for Interview</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main id="main-panel" className="flex-1 p-4 md:p-6 bg-[#0B0F16] overflow-y-auto">
          {/* SESSIONS VIEW */}
          {nav === 'sessions' && (
            <div className="space-y-6">
              {/* Header bar */}
              {!activeSession && !showSetup && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Call Sessions</h1>
                    <p className="text-sm text-slate-400">
                      Real-time interview voice listening, live STAR cue cards, and practice coaching.
                    </p>
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
                <div id="session-setup-card" className="rounded-2xl border border-white/10 bg-[#141A26] p-5 md:p-6 shadow-xl">
                  <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
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
                        className="w-full rounded-xl border border-white/10 bg-[#0C1017] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
                        placeholder="e.g. Cognizant, Google, Amazon"
                      />
                    </label>

                    <label className="space-y-1.5 text-xs text-slate-300">
                      <span className="font-semibold text-slate-400">Role / Position</span>
                      <input
                        value={profile.role}
                        onChange={(e) => setProfile((p) => ({ ...p, role: e.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-[#0C1017] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
                        placeholder="e.g. Java Developer Fresher"
                      />
                    </label>

                    <label className="space-y-1.5 text-xs text-slate-300">
                      <span className="font-semibold text-slate-400">Speech Accent / Dialect</span>
                      <select
                        value={audioSettings.language}
                        onChange={(e) => setAudioSettings((s) => ({ ...s, language: e.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-[#0C1017] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
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
                        className="w-full rounded-xl border border-white/10 bg-[#0C1017] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
                      >
                        <option value="technical">Technical (Coding, Architecture, Core Concepts)</option>
                        <option value="behavioral">Behavioral (STAR Method Leadership)</option>
                        <option value="general">General Fit & HR Screening</option>
                      </select>
                    </label>

                    <label className="space-y-1.5 text-xs text-slate-300 md:col-span-2">
                      <span className="font-semibold text-slate-400">Your Resume Summary / Key Skills</span>
                      <textarea
                        value={profile.resumeText}
                        onChange={(e) => setProfile((p) => ({ ...p, resumeText: e.target.value }))}
                        rows={3}
                        className="w-full rounded-xl border border-white/10 bg-[#0C1017] p-3 text-sm text-slate-100 outline-none focus:border-emerald-500/50 placeholder:text-slate-600"
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
                      <Sparkles className="h-4 w-4" />
                      <span>Start {createMode === 'live' ? 'Live Session' : 'Practice Session'}</span>
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
                  <div className="rounded-2xl border border-white/10 bg-[#141A26] p-4 shadow-lg">
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
                          Duration: <span className="font-mono text-emerald-400 font-semibold">{formatDuration(durationSecs)}</span> •{' '}
                          {activeSession.qaPairs?.length || 0} Q&A generated
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => exportSessionTranscript(activeSession)}
                          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
                        >
                          <Download className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Export Markdown</span>
                        </button>
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

                    {/* Live Audio & Controls Strip */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Microphone Button */}
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
                          <span>{micEnabled ? 'Mic Listening (Click to Mute)' : 'Enable Live Mic'}</span>
                        </button>

                        {/* Visualizer */}
                        <AudioVisualizer audioStream={audioStream} isActive={micEnabled} volume={volumeLevel} />
                      </div>

                      {/* TTS Voice Narration */}
                      {cue?.full_answer && (
                        <button
                          type="button"
                          onClick={() => speakText(cue.full_answer)}
                          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition border ${
                            isSpeakingTTS
                              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                              : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {isSpeakingTTS ? <VolumeX className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5 text-emerald-400" />}
                          <span>{isSpeakingTTS ? 'Stop Speaking' : 'Read Aloud'}</span>
                        </button>
                      )}
                    </div>

                    {/* Live Voice Transcript Strip */}
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

                        <input
                          value={liveEditSpeech}
                          onChange={(e) => setLiveEditSpeech(e.target.value)}
                          placeholder="Listening for your voice or interviewer questions... (You can also edit this text live)"
                          className="w-full rounded-lg border border-emerald-500/30 bg-slate-950/80 px-3 py-1.5 text-xs text-emerald-200 placeholder:text-slate-500 outline-none focus:border-emerald-400"
                        />
                      </div>
                    )}
                  </div>

                  {/* Two-Column Grid: Question & Answer Workspace */}
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="space-y-5">
                      {/* Detected Question Box */}
                      <div className="rounded-2xl border border-white/10 bg-[#141A26] p-5 shadow-lg">
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

                        <div className="min-h-[56px] rounded-xl border border-white/10 bg-[#0C1017] p-4 text-base font-semibold text-white">
                          {currentQuestion || (
                            <span className="text-slate-500 font-normal italic">
                              Speak into your microphone or pick a sample question below...
                            </span>
                          )}
                        </div>

                        {/* Quick Question Selector Chips & 1-Click Simulation */}
                        <div className="mt-4 border-t border-white/5 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                              ⚡ 1-Click Practice & Simulation Questions:
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">Instant AI generation</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                              { text: "Explain HashMap internals & Java 8 Red-Black Tree collision handling", tag: "Java Core" },
                              { text: "How Java Garbage Collection works and how to prevent memory leaks", tag: "JVM & Memory" },
                              { text: "Spring Boot Dependency Injection under the hood (@Autowired vs Constructor)", tag: "Spring Boot" },
                              { text: "How to solve N+1 query problem in Spring Data JPA & Hibernate", tag: "Hibernate / ORM" },
                              { text: "How to optimize slow SQL queries using EXPLAIN & B-Tree indexing", tag: "Database" },
                              { text: "Tell me about a challenging production bug you solved under tight deadlines", tag: "STAR Behavioral" },
                              { text: "Tell me about yourself and your background in Java & Spring development", tag: "Elevator Pitch" },
                              { text: "Microservices vs Monolith: Service Discovery, API Gateway & Circuit Breakers", tag: "System Design" },
                            ].map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleDetectedQuestion(item.text)}
                                className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-slate-200 hover:border-emerald-500/40 hover:bg-emerald-950/30 hover:text-emerald-300 transition text-left group"
                              >
                                <span className="truncate font-medium">{item.text}</span>
                                <span className="shrink-0 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 group-hover:bg-emerald-500/20">
                                  {item.tag}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Manual Input Fallback */}
                        <form onSubmit={handleManualSubmit} className="mt-4 flex gap-2">
                          <input
                            value={manualQuestion}
                            onChange={(e) => setManualQuestion(e.target.value)}
                            placeholder="Type any interview question manually..."
                            className="flex-1 rounded-xl border border-white/10 bg-[#0C1017] px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500/50"
                          />
                          <button
                            type="submit"
                            className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      </div>

                      {/* PRACTICE MODE: Candidate Response Review */}
                      {activeSession.mode === 'practice' && (
                        <div className="rounded-2xl border border-emerald-500/30 bg-[#141A26] p-5 shadow-lg">
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
                            placeholder="Speak into your mic to practice your answer, or type it here..."
                            rows={4}
                            className="w-full rounded-xl border border-white/10 bg-[#0C1017] p-3 text-sm text-slate-100 outline-none focus:border-emerald-500/50 placeholder:text-slate-600"
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
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                                  Coaching Evaluation
                                </span>
                                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                                  Score: {practiceEvaluation.score}/5 ★
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
                                  <div className="text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                                    <span>Sharpened STAR Answer:</span>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(practiceEvaluation.rewritten_answer, 'eval')}
                                      className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                                    >
                                      {copiedKey === 'eval' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                      <span>Copy</span>
                                    </button>
                                  </div>
                                  <div className="text-xs italic text-slate-200 bg-[#0C1017] p-3 rounded-lg border border-white/5">
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
                        <div className="rounded-2xl border border-white/10 bg-[#141A26] p-5 shadow-lg space-y-4">
                          <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                              <Sparkles className="h-4 w-4" />
                              AI Co-Pilot Answer Blueprint
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setShowStealthTeleprompter(true)}
                                className="flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
                                title="Open stealth teleprompter overlay (Shift+P)"
                              >
                                <Zap className="h-3 w-3" />
                                <span>Parakeet HUD</span>
                              </button>
                              <span className="hidden sm:inline text-[11px] text-slate-400">Glanceable STAR Talking Points</span>
                            </div>
                          </div>

                          {cue ? (
                            <div className="space-y-4">
                              {/* Headline Answer */}
                              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 relative group">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                                    <span>⚡ Headline Response (First 5 Seconds):</span>
                                    {cue.complexity && (
                                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[10px] text-emerald-300 font-mono">
                                        {cue.complexity}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(cue.headline_answer, 'headline')}
                                    className="text-slate-400 hover:text-white"
                                    title="Copy Headline"
                                  >
                                    {copiedKey === 'headline' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                  </button>
                                </div>
                                <div className="text-base font-bold text-white leading-snug">
                                  {cue.headline_answer}
                                </div>
                              </div>

                              {/* Code Snippet Card (Parakeet Coding Rounds) */}
                              {cue.codeSnippet && (
                                <div className="rounded-xl border border-white/10 bg-[#0B0F17] overflow-hidden">
                                  <div className="flex items-center justify-between bg-slate-900/80 px-3.5 py-2 border-b border-white/10 text-xs">
                                    <div className="flex items-center gap-2 font-mono text-emerald-400">
                                      <Code2 className="h-3.5 w-3.5" />
                                      <span>Optimized Solution</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {cue.complexity && (
                                        <span className="text-[10px] font-mono text-slate-400">
                                          {cue.complexity}
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(cue.codeSnippet, 'codesnip')}
                                        className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                                      >
                                        {copiedKey === 'codesnip' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                        <span>Copy Code</span>
                                      </button>
                                    </div>
                                  </div>
                                  <pre className="p-3 text-xs font-mono text-emerald-300/90 overflow-x-auto leading-relaxed bg-[#080B10]">
                                    <code>{cue.codeSnippet}</code>
                                  </pre>
                                </div>
                              )}

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
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                      Natural Spoken Script:
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => speakText(cue.full_answer)}
                                        className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                                      >
                                        <Volume2 className="h-3 w-3" />
                                        <span>Listen</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(cue.full_answer, 'script')}
                                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                                      >
                                        {copiedKey === 'script' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                        <span>Copy</span>
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-xs leading-relaxed text-slate-300 bg-[#0C1017] p-3 rounded-xl border border-white/5">
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
                      <div className="rounded-2xl border border-white/10 bg-[#141A26] p-4 shadow-lg">
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
                                className="cursor-pointer rounded-xl border border-white/10 bg-[#0C1017] p-3 text-xs transition hover:border-emerald-500/40 hover:bg-white/5"
                              >
                                <div className="font-semibold text-white line-clamp-2 mb-1">
                                  {item.question}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center justify-between">
                                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span className="text-emerald-400">View</span>
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
                <div className="rounded-2xl border border-white/10 bg-[#141A26] p-5 shadow-lg space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-bold uppercase tracking-wider text-slate-300">
                        Past Sessions History
                      </div>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400 font-mono">
                        {filteredSessions.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-56">
                        <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          value={historySearch}
                          onChange={(e) => setHistorySearch(e.target.value)}
                          placeholder="Search past sessions..."
                          className="w-full rounded-xl border border-white/10 bg-[#0C1017] pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      {sessions.length > 0 && (
                        <button
                          type="button"
                          onClick={clearAllSessions}
                          className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredSessions.length === 0 ? (
                      <div className="col-span-full rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-slate-500">
                        {historySearch ? 'No matching sessions found.' : 'No previous call sessions found. Click "+ Create Live Session" above to begin.'}
                      </div>
                    ) : (
                      filteredSessions.map((s) => (
                        <div
                          key={s.id}
                          className="rounded-xl border border-white/10 bg-[#0C1017] p-4 flex flex-col justify-between hover:border-emerald-500/30 transition group"
                        >
                          <div>
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-mono">
                              <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300 uppercase font-semibold">
                                {s.mode}
                              </span>
                            </div>
                            <div className="font-bold text-white text-sm truncate">{s.company}</div>
                            <div className="text-xs text-slate-400 truncate">{s.role}</div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                            <span className="text-slate-400">{s.qaPairs?.length || 0} Questions</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => deleteSession(s.id, e)}
                                className="text-slate-500 hover:text-rose-400 p-1"
                                title="Delete session"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
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
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PARAKEET LEETCODE & CODE SOLVER VIEW */}
          {nav === 'coding' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                  <Terminal className="h-6 w-6 text-emerald-400" />
                  <span>LeetCode & Live Coding Co-Pilot</span>
                </h1>
                <p className="text-sm text-slate-400">
                  Parakeet AI coding round assistant: solve live LeetCode/HackerRank algorithmic challenges, analyze Big-O time & space complexity, and push optimal code directly to your stealth teleprompter.
                </p>
              </div>

              <CodingProblemSolver
                onSendToTeleprompter={(solution) => {
                  setCue({
                    headline_answer: solution.title,
                    bullets: solution.keyPoints || [],
                    codeSnippet: solution.code,
                    complexity: solution.complexity,
                    full_answer: solution.code,
                    tradeoff: `Optimal algorithm trade-off: ${solution.complexity}`,
                    category: 'Coding & Algorithms',
                  });
                  setCurrentQuestion(solution.title);
                  setShowStealthTeleprompter(true);
                  setSuccessToast('Code solution sent to Parakeet Stealth Teleprompter HUD!');
                }}
              />
            </div>
          )}

          {/* ROLE PRESETS & SAMPLE QUESTIONS VIEW */}
          {nav === 'presets' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Interview Presets & Question Bank</h1>
                <p className="text-sm text-slate-400">
                  Select 1-click profiles and explore categorized interview questions for practice and live simulation.
                </p>
              </div>

              {/* Ready-to-use Presets */}
              <div className="grid gap-4 md:grid-cols-3">
                {RESUME_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="rounded-2xl border border-white/10 bg-[#141A26] p-5 flex flex-col justify-between hover:border-emerald-500/40 transition space-y-4"
                  >
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
                        {preset.interviewType}
                      </div>
                      <div className="text-base font-bold text-white mb-1">{preset.name}</div>
                      <div className="text-xs text-slate-400 line-clamp-3">{preset.resumeText}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="w-full rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 py-2 text-xs font-bold text-slate-200 hover:text-emerald-300 transition flex items-center justify-center gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Apply This Preset</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Categorized Question Library */}
              <div className="space-y-4">
                <div className="text-lg font-bold text-white">Categorized Question Bank</div>
                <div className="grid gap-4 md:grid-cols-2">
                  {sampleCategories.map((cat, idx) => (
                    <div key={idx} className="rounded-2xl border border-white/10 bg-[#141A26] p-5 space-y-3">
                      <div className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span>{cat.title}</span>
                      </div>
                      <div className="space-y-2">
                        {cat.questions.map((q, qIdx) => (
                          <div
                            key={qIdx}
                            onClick={() => {
                              handleDetectedQuestion(q);
                              setNav('sessions');
                              if (!activeSession) {
                                createSession('live');
                              }
                            }}
                            className="cursor-pointer rounded-xl border border-white/5 bg-[#0C1017] p-3 text-xs text-slate-200 hover:border-emerald-500/40 hover:bg-white/5 transition flex items-center justify-between group"
                          >
                            <span className="line-clamp-2 pr-2">{q}</span>
                            <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0 transition" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DIAGNOSTICS & VOICE TEST VIEW */}
          {nav === 'diagnostics' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Voice & Microphone Diagnostics</h1>
                <p className="text-sm text-slate-400">
                  Configure accent recognition, test microphone gain booster, loopback test, and verify audio clarity.
                </p>
              </div>

              {/* Settings Card */}
              <div className="rounded-2xl border border-white/10 bg-[#141A26] p-6 shadow-xl space-y-5">
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
                      className="w-full rounded-xl border border-white/10 bg-[#0C1017] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
                    >
                      {ACCENT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.flag} {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1.5 text-xs text-slate-300">
                    <span className="font-semibold text-slate-400">
                      Microphone Volume Gain Boost ({Math.round(audioSettings.micGain * 100)}%)
                    </span>
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
                  </label>

                  <label className="space-y-1.5 text-xs text-slate-300">
                    <span className="font-semibold text-slate-400">Question Trigger Pause Delay</span>
                    <select
                      value={audioSettings.silenceDelay}
                      onChange={(e) => setAudioSettings((s) => ({ ...s, silenceDelay: parseInt(e.target.value, 10) }))}
                      className="w-full rounded-xl border border-white/10 bg-[#0C1017] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
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
                      <label htmlFor="auto-detect-toggle" className="text-xs text-slate-300 cursor-pointer">
                        Auto-generate cue card on question detection
                      </label>
                    </div>
                  </label>
                </div>
              </div>

              {/* Main Test Card */}
              <div className="rounded-2xl border border-white/10 bg-[#141A26] p-6 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div>
                    <div className="text-base font-bold text-white flex items-center gap-2">
                      <Mic className="h-5 w-5 text-emerald-400" />
                      Live Microphone Signal Test
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Speak into your mic to watch the live signal and visualizer.</div>
                  </div>

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

                {/* Level Meter & Visualizer */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">Microphone Input Level</span>
                    <span className="text-emerald-400 font-mono">{volumeLevel}% Signal Strength</span>
                  </div>
                  <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-white/10 p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300 transition-all duration-75"
                      style={{ width: `${Math.max(4, volumeLevel)}%` }}
                    />
                  </div>

                  <div className="flex justify-center pt-2">
                    <AudioVisualizer audioStream={audioStream} isActive={micEnabled} volume={volumeLevel} />
                  </div>
                </div>

                {/* Loopback Audio Playback Test */}
                <div className="rounded-xl border border-white/10 bg-[#0C1017] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Repeat className="h-3.5 w-3.5 text-emerald-400" />
                        Microphone Loopback Clarity Test
                      </div>
                      <div className="text-[11px] text-slate-400">Record a 4-second voice sample and play it back to test audio clarity.</div>
                    </div>

                    <button
                      type="button"
                      onClick={startLoopbackTest}
                      disabled={isLoopbackRecording}
                      className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition disabled:opacity-50"
                    >
                      {isLoopbackRecording ? 'Recording (4s)...' : 'Record 4s Sample'}
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
                  <div className="min-h-[80px] rounded-xl border border-white/10 bg-[#0C1017] p-4 text-sm text-slate-200">
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

                {/* Diagnostics Check status */}
                <div className="grid gap-3 sm:grid-cols-3 pt-2">
                  <div className="rounded-xl border border-white/10 bg-[#0C1017] p-3 text-xs">
                    <div className="text-slate-400 font-medium mb-1">Web Speech API</div>
                    <div className="font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{speechRecognitionSupported ? 'Supported' : 'Manual Mode'}</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#0C1017] p-3 text-xs">
                    <div className="text-slate-400 font-medium mb-1">Permission State</div>
                    <div className="font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="capitalize">{permissionStatus}</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#0C1017] p-3 text-xs">
                    <div className="text-slate-400 font-medium mb-1">Audio Pipeline</div>
                    <div className="font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{audioStream ? 'Gain Filter Active' : 'Ready'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RESUMES VIEW */}
          {nav === 'resumes' && (
            <div className="rounded-2xl border border-white/10 bg-[#141A26] p-6 shadow-xl space-y-4 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">CVs & Resumes</h1>
                  <p className="text-sm text-slate-400">Update your background notes so AI suggestions match your actual experience.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessToast('Resume details saved!')}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                >
                  Save Profile
                </button>
              </div>
              <textarea
                value={profile.resumeText}
                onChange={(e) => setProfile((p) => ({ ...p, resumeText: e.target.value }))}
                rows={10}
                className="w-full rounded-2xl border border-white/10 bg-[#0C1017] p-4 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
              />
            </div>
          )}

          {/* DOCUMENTS VIEW */}
          {nav === 'documents' && (
            <div className="rounded-2xl border border-white/10 bg-[#141A26] p-6 shadow-xl space-y-4 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">Job Description & Documents</h1>
                  <p className="text-sm text-slate-400">Provide job requirements and company values for grounded answers.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessToast('Job description saved!')}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                >
                  Save Documents
                </button>
              </div>
              <textarea
                value={profile.jobDescription}
                onChange={(e) => setProfile((p) => ({ ...p, jobDescription: e.target.value }))}
                rows={10}
                className="w-full rounded-2xl border border-white/10 bg-[#0C1017] p-4 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
              />
            </div>
          )}
        </main>
      </div>

      {/* Stealth Teleprompter Floating HUD Overlay (Parakeet AI Engine) */}
      <StealthTeleprompter
        isOpen={showStealthTeleprompter}
        onClose={() => setShowStealthTeleprompter(false)}
        onOpen={() => setShowStealthTeleprompter(true)}
        cue={cue}
        currentQuestion={currentQuestion}
        micEnabled={micEnabled}
        onToggleMic={toggleMic}
        isListening={isListening}
        interimText={interimText}
        onSpeakAnswer={speakText}
        isSpeaking={isSpeakingTTS}
        onStopSpeech={stopTTS}
        onRegenerate={() => {
          if (currentQuestion) {
            handleDetectedQuestion(currentQuestion);
          }
        }}
        company={profile.company}
        role={profile.role}
      />

      {/* Floating Success Toast */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-[#131924] px-4 py-3 text-xs text-emerald-300 shadow-2xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

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
