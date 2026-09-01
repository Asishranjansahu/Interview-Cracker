import { SetupPanel } from './ui/SetupPanel.js';
import { CueCard } from './ui/CueCard.js';
import { HistoryPanel } from './ui/HistoryPanel.js';
import { PracticeFeedback } from './ui/PracticeFeedback.js';
import { QuestionCapture } from './capture/QuestionCapture.js';
import { SystemAudioCapture } from './capture/SystemAudioCapture.js';
import { generateSuggestion } from './api/greenroomClient.js';
import { createProfile } from './state/profileStore.js';

const statusPill = document.getElementById('statusPill');
const modeBadge = document.getElementById('modeBadge');
const setupPanel = new SetupPanel({ onStart: handleStart });
const cueCard = new CueCard();
const practiceFeedback = new PracticeFeedback();
const historyPanel = new HistoryPanel();

let activeMode = 'live';
let currentProfile = createProfile();
let capture = null;
let transcriptHistory = [];

function setStatus(label, tone = 'neutral') {
  statusPill.textContent = label;
  const map = {
    neutral: 'rgba(139, 92, 246, 0.12)',
    good: 'rgba(52, 211, 153, 0.12)',
    warn: 'rgba(251, 191, 36, 0.12)',
    bad: 'rgba(251, 113, 133, 0.12)',
  };
  statusPill.style.background = map[tone] || map.neutral;
}

function toggleSession(show) {
  document.getElementById('setupPanel').style.display = show ? 'none' : 'block';
  document.getElementById('sessionPanel').style.display = show ? 'block' : 'none';
}

function updateQuestionCount() {
  document.getElementById('questionCount').textContent = String(transcriptHistory.length);
}

async function handleStart(mode) {
  const values = setupPanel.getValues();
  currentProfile = createProfile({ ...values, mode });
  activeMode = mode;

  document.getElementById('modeLabel').textContent = mode === 'practice' ? 'Practice' : 'Mic';
  modeBadge.textContent = mode === 'practice' ? 'Practice' : 'Live';
  document.getElementById('roleLabel').textContent = currentProfile.role || 'N/A';

  toggleSession(true);
  setStatus(mode === 'practice' ? 'Practice' : 'Listening', 'good');

  if (mode === 'live') {
    startLiveCapture();
  } else {
    startPracticeMode();
  }
}

function startPracticeMode() {
  const question = 'Tell me about a time you influenced a cross-functional team.';
  document.getElementById('currentQuestion').textContent = question;
  cueCard.renderLoading(question);

  const profile = createProfile({ ...currentProfile, candidate_answer: 'We had a product issue and I worked with design and engineering to align on a plan and improve retention.' });

  generateSuggestion(profile, question, 'practice').then((result) => {
    if (result && result.score) {
      practiceFeedback.render(result);
    } else {
      cueCard.renderSuggestion(result);
    }
    transcriptHistory.push({ question, suggestion: result });
    updateQuestionCount();
    historyPanel.add({ question, suggestion: result });
  });
}

function startLiveCapture() {
  try {
    capture = new QuestionCapture({
      onQuestionReady: async (question) => {
        document.getElementById('currentQuestion').textContent = question;
        cueCard.renderLoading(question);
        setStatus('Drafting', 'warn');

        const result = await generateSuggestion(currentProfile, question, 'live');
        transcriptHistory.push({ question, suggestion: result });
        updateQuestionCount();
        historyPanel.add({ question, suggestion: result });

        if (result && result.score) {
          practiceFeedback.render(result);
        } else {
          cueCard.renderSuggestion(result);
        }

        setStatus('Listening', 'good');
        capture.resume();
      },
    });
    capture.start();
    setStatus('Listening', 'good');
  } catch (error) {
    console.warn('Mic mode unavailable:', error);
    setStatus('Fallback', 'warn');
    const question = 'Describe a time you handled ambiguity.';
    document.getElementById('currentQuestion').textContent = question;
    generateSuggestion(currentProfile, question, 'live').then((result) => {
      cueCard.renderSuggestion(result);
    });
  }
}

function stopSession() {
  capture?.stop();
  toggleSession(false);
  setStatus('Ready', 'neutral');
  document.getElementById('currentQuestion').textContent = 'Listening for the interviewer’s next question…';
  document.getElementById('questionCount').textContent = '0';
  transcriptHistory = [];
  historyPanel.entries = [];
  historyPanel.render();
}

document.getElementById('stopBtn').addEventListener('click', stopSession);
document.getElementById('captureBtn').addEventListener('click', () => capture?.forceCapture());
setStatus('Ready', 'neutral');
layout();

function layout() {
  historyPanel.render();
  cueCard.renderSuggestion({
    bullets: ['Open the setup panel to begin.', 'Pick live or practice mode.', 'Use the generated answer as a cue.'],
    full_answer: 'Once a question is detected, the cue card will render a shortlist and a spoken-form answer tailored to your profile.',
  });
}
