import { useState, useEffect, useRef, useCallback } from 'react';

const QUESTION_STARTERS = [
  'who', 'what', 'when', 'where', 'why', 'how',
  'tell me', 'walk me', 'describe', 'explain',
  'can you', 'could you', 'would you', 'do you',
  'did you', 'have you', 'is there', 'are there',
  'what is', 'how do', 'why should', 'which',
  'give me', 'share an', 'talk about', 'in what',
];

// Common tech domain word correction dictionary for interviews
const COMMON_TECH_REPLACEMENTS = [
  [/\bgest\b/gi, 'Jest'],
  [/\bsequel\b/gi, 'SQL'],
  [/\bno sequel\b/gi, 'NoSQL'],
  [/\brest a p i\b/gi, 'REST API'],
  [/\ba p i\b/gi, 'API'],
  [/\ba p is\b/gi, 'APIs'],
  [/\bspring boot\b/gi, 'Spring Boot'],
  [/\bfront end\b/gi, 'frontend'],
  [/\bback end\b/gi, 'backend'],
  [/\bci cd\b/gi, 'CI/CD'],
  [/\bgit hub\b/gi, 'GitHub'],
  [/\bjava script\b/gi, 'JavaScript'],
  [/\btype script\b/gi, 'TypeScript'],
  [/\bkubernetees\b/gi, 'Kubernetes'],
  [/\bmicro services\b/gi, 'microservices'],
  [/\baws\b/gi, 'AWS'],
  [/\bgcp\b/gi, 'GCP'],
];

export function cleanAndEnhanceTranscript(text) {
  if (!text) return '';
  let cleaned = text.trim();
  for (const [pattern, replacement] of COMMON_TECH_REPLACEMENTS) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  return cleaned;
}

export function isProbableQuestion(text) {
  if (!text) return false;
  const clean = text.replace(/[^a-zA-Z0-9 ?]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return false;
  const words = clean.split(/\s+/);
  if (words.length < 3) return false;
  const lower = clean.toLowerCase();
  const hasQuestionWord = QUESTION_STARTERS.some((w) => lower.startsWith(w) || lower.includes(` ${w} `) || lower.includes(` ${w}`));
  const hasQuestionMark = clean.endsWith('?');
  return hasQuestionMark || hasQuestionWord;
}

export const ACCENT_OPTIONS = [
  { value: 'en-IN', label: 'English (India - Indian Accent)', flag: '🇮🇳' },
  { value: 'en-US', label: 'English (US - American Accent)', flag: '🇺🇸' },
  { value: 'en-GB', label: 'English (UK - British Accent)', flag: '🇬🇧' },
  { value: 'en-AU', label: 'English (Australia)', flag: '🇦🇺' },
  { value: 'en-CA', label: 'English (Canada)', flag: '🇨🇦' },
  { value: 'hi-IN', label: 'Hindi (India)', flag: '🇮🇳' },
  { value: 'es-ES', label: 'Spanish (Spain/LatAm)', flag: '🇪🇸' },
  { value: 'fr-FR', label: 'French', flag: '🇫🇷' },
  { value: 'de-DE', label: 'German', flag: '🇩🇪' },
];

export function useSpeechEngine({
  isEnabled = false,
  captureSource = 'mic', // 'mic' | 'system'
  language = 'en-IN', // Default to en-IN or selected accent
  micGain = 1.5, // 1.0x to 3.0x gain boost
  silenceDelay = 1800, // ms pause before question trigger
  onQuestionDetected,
  onSpeechTranscribed,
  mode = 'live', // 'live' | 'practice'
}) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [accumulatedText, setAccumulatedText] = useState('');
  const [recentTranscripts, setRecentTranscripts] = useState([]);
  const [audioStream, setAudioStream] = useState(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied' | 'unsupported'
  const [engineError, setEngineError] = useState(null);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(true);

  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const fullTranscriptAccumulator = useRef('');
  const isManuallyStopped = useRef(false);

  // Check speech recognition support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechRecognitionSupported(false);
      setPermissionStatus('unsupported');
    }
  }, []);

  // Monitor Volume Level and apply Web Audio API Gain
  const startVolumeMeter = useCallback((stream, gainValue = 1.5) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try { audioContextRef.current.close(); } catch { /* ignore */ }
      }

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);

      // Gain booster to make quiet microphones loud & clear
      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(gainValue, audioCtx.currentTime);
      gainNodeRef.current = gainNode;

      // High-pass filter to remove low-frequency desk vibrations/hum (under 85 Hz)
      const biquadFilter = audioCtx.createBiquadFilter();
      biquadFilter.type = 'highpass';
      biquadFilter.frequency.value = 85;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Connect pipeline: source -> gain -> filter -> analyser
      source.connect(gainNode);
      gainNode.connect(biquadFilter);
      biquadFilter.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        // Boost sensitivity calculation for responsive meter
        const normalized = Math.min(100, Math.round((average / 110) * 100));
        setVolumeLevel(normalized);

        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn('[useSpeechEngine] Volume meter setup error:', err);
    }
  }, []);

  // Dynamically update gain when prop changes
  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      try {
        gainNodeRef.current.gain.setValueAtTime(micGain, audioContextRef.current.currentTime);
      } catch {
        // ignore
      }
    }
  }, [micGain]);

  const stopVolumeMeter = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch { /* ignore */ }
      audioContextRef.current = null;
    }
    setVolumeLevel(0);
  }, []);

  // Request audio media stream (Microphone or Tab/System audio)
  const acquireMediaStream = useCallback(async () => {
    try {
      let stream = null;
      if (captureSource === 'system') {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          throw new Error('Tab / System audio capture is not supported in this browser.');
        }
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
        const audioTracks = stream.getAudioTracks();
        if (!audioTracks || audioTracks.length === 0) {
          stream.getTracks().forEach((t) => t.stop());
          throw new Error('No audio selected. Please ensure you checked "Share tab audio" in the popup.');
        }
      } else {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Microphone access is not supported in this browser.');
        }
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: 48000,
          },
        });
      }

      setAudioStream(stream);
      setPermissionStatus('granted');
      startVolumeMeter(stream, micGain);
      return stream;
    } catch (err) {
      console.error('[useSpeechEngine] Media stream error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionStatus('denied');
        setEngineError('Microphone permission was denied. Please click the lock icon in your address bar to allow.');
      } else {
        setEngineError(err.message || 'Failed to access audio device.');
      }
      return null;
    }
  }, [captureSource, micGain, startVolumeMeter]);

  // Main recognition lifecycle
  useEffect(() => {
    if (!isEnabled) {
      isManuallyStopped.current = true;
      setIsListening(false);
      setInterimText('');
      setAccumulatedText('');
      stopVolumeMeter();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
        recognitionRef.current = null;
      }
      if (audioStream) {
        audioStream.getTracks().forEach((t) => t.stop());
        setAudioStream(null);
      }
      return;
    }

    isManuallyStopped.current = false;
    let isCancelled = false;

    const startEngine = async () => {
      setEngineError(null);

      // Acquire audio stream first for permission & visualizer
      const stream = await acquireMediaStream();
      if (!stream || isCancelled) return;

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechRecognitionSupported(false);
        setEngineError('Web Speech API is not supported in this browser. You can type questions manually or test with sample questions.');
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 3;
        recognition.lang = language || 'en-IN';
        recognitionRef.current = recognition;

        recognition.onstart = () => {
          if (!isCancelled) {
            setIsListening(true);
            setEngineError(null);
          }
        };

        recognition.onresult = (event) => {
          let currentInterim = '';
          let currentFinal = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const item = event.results[i];
            // Pick highest confidence or primary transcript
            const transcript = item[0]?.transcript || '';
            if (item.isFinal) {
              currentFinal += transcript + ' ';
            } else {
              currentInterim += transcript;
            }
          }

          if (currentInterim) {
            const cleanedInterim = cleanAndEnhanceTranscript(currentInterim);
            setInterimText(cleanedInterim);
          }

          if (currentFinal.trim()) {
            const cleanFinal = cleanAndEnhanceTranscript(currentFinal.trim());
            const newAccumulated = (fullTranscriptAccumulator.current + ' ' + cleanFinal).trim();
            fullTranscriptAccumulator.current = newAccumulated;
            setAccumulatedText(newAccumulated);
            setInterimText('');

            setRecentTranscripts((prev) => [
              ...prev.slice(-9),
              {
                id: Date.now(),
                text: cleanFinal,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              },
            ]);

            onSpeechTranscribed?.(cleanFinal, fullTranscriptAccumulator.current);

            // Handle silence / question detection for live mode
            if (mode === 'live') {
              if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

              const accumulated = fullTranscriptAccumulator.current;
              const isQ = isProbableQuestion(accumulated) || cleanFinal.endsWith('?');

              silenceTimerRef.current = setTimeout(() => {
                const textToEvaluate = fullTranscriptAccumulator.current.trim();
                if (textToEvaluate && (isQ || textToEvaluate.split(/\s+/).length >= 4)) {
                  onQuestionDetected?.(textToEvaluate);
                  fullTranscriptAccumulator.current = '';
                  setAccumulatedText('');
                }
              }, isQ ? Math.min(silenceDelay, 1400) : silenceDelay);
            }
          }
        };

        recognition.onerror = (event) => {
          console.warn('[useSpeechEngine] Speech recognition event error:', event.error);
          if (event.error === 'no-speech') {
            // Harmless timeout when user pauses speaking - do not alert
            return;
          }
          if (event.error === 'not-allowed') {
            setPermissionStatus('denied');
            setEngineError('Microphone permission blocked. Please click the camera/mic icon in the browser address bar to allow.');
          } else if (event.error === 'network') {
            setEngineError('Speech recognition network glitch. Auto-reconnecting...');
          } else if (event.error !== 'aborted') {
            setEngineError(`Speech recognition: ${event.error}`);
          }
        };

        recognition.onend = () => {
          if (!isManuallyStopped.current && isEnabled) {
            // Restart smoothly
            try {
              recognition.start();
            } catch {
              // Ignore if already started
            }
          } else {
            setIsListening(false);
          }
        };

        recognition.start();
      } catch (err) {
        console.error('[useSpeechEngine] Failed to start recognition:', err);
        setEngineError('Could not start speech recognition: ' + (err.message || 'Unknown error'));
      }
    };

    startEngine();

    return () => {
      isCancelled = true;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
        recognitionRef.current = null;
      }
      stopVolumeMeter();
    };
  }, [
    isEnabled,
    captureSource,
    language,
    silenceDelay,
    mode,
    acquireMediaStream,
    stopVolumeMeter,
    onQuestionDetected,
    onSpeechTranscribed,
  ]);

  const clearTranscriptBuffer = useCallback(() => {
    fullTranscriptAccumulator.current = '';
    setAccumulatedText('');
    setInterimText('');
  }, []);

  const triggerManualEvaluation = useCallback((customText) => {
    const target = customText || fullTranscriptAccumulator.current || interimText;
    if (target && target.trim()) {
      onQuestionDetected?.(target.trim());
      fullTranscriptAccumulator.current = '';
      setAccumulatedText('');
      setInterimText('');
    }
  }, [interimText, onQuestionDetected]);

  return {
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
    requestPermission: acquireMediaStream,
  };
}
