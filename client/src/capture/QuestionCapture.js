import { looksLikeQuestion, getSilenceDelay } from './questionHeuristics.js';

export class QuestionCapture {
  constructor({ onQuestionReady, silenceMs = getSilenceDelay(), minWords = 4 }) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error('Speech recognition is not supported in this browser.');
    }

    this.onQuestionReady = onQuestionReady;
    this.silenceMs = silenceMs;
    this.minWords = minWords;
    this.buffer = '';
    this.consumed = 0;
    this.state = 'IDLE';
    this.silenceTimer = null;

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.onresult = (event) => this.handleResult(event);
    this.recognition.onend = () => {
      if (this.state !== 'STOPPED') {
        try { this.recognition.start(); } catch (_) {}
      }
    };
  }

  start() {
    this.state = 'LISTENING';
    this.buffer = '';
    this.consumed = 0;
    this.recognition.start();
  }

  stop() {
    this.state = 'STOPPED';
    clearTimeout(this.silenceTimer);
    this.recognition.stop();
  }

  resume() {
    this.state = 'LISTENING';
  }

  handleResult(event) {
    let finalChunk = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalChunk += event.results[i][0].transcript + ' ';
      }
    }

    if (finalChunk.trim()) {
      this.buffer += finalChunk;
      this.resetSilenceTimer();
    }
  }

  resetSilenceTimer() {
    clearTimeout(this.silenceTimer);
    this.silenceTimer = setTimeout(() => this.onSilence(), this.silenceMs);
  }

  onSilence() {
    if (this.state !== 'LISTENING') return;
    const nextText = this.buffer.slice(this.consumed).trim();
    if (!nextText) return;

    if (looksLikeQuestion(nextText, this.minWords)) {
      this.consumed = this.buffer.length;
      this.state = 'SUGGESTING';
      this.onQuestionReady(nextText);
    }
  }

  forceCapture() {
    const nextText = this.buffer.slice(this.consumed).trim();
    if (!nextText) return null;
    this.consumed = this.buffer.length;
    this.state = 'SUGGESTING';
    this.onQuestionReady(nextText);
    return nextText;
  }
}
