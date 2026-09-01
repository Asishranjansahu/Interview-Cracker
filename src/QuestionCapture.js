/**
 * QuestionCapture — buffers speech-to-text and detects when the interviewer
 * has finished asking a question (silence threshold + heuristic check).
 */
export class QuestionCapture {
  constructor({ onQuestionReady, silenceMs = 1500, minWords = 4 }) {
    this.onQuestionReady = onQuestionReady;
    this.silenceMs = silenceMs;
    this.minWords = minWords;

    this.buffer = "";
    this.consumedUpTo = 0;
    this.silenceTimer = null;
    this.state = "IDLE"; // IDLE | LISTENING | SUGGESTING | STOPPED

    this._validateBrowserSupport();
    this._initRecognition();
  }

  _validateBrowserSupport() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error("Speech recognition not supported in this browser.");
    }
    this.SpeechRecognition = SpeechRecognition;
  }

  _initRecognition() {
    this.recognition = new this.SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";

    this.recognition.onresult = (event) => this._handleResult(event);
    this.recognition.onend = () => {
      if (this.state !== "STOPPED") {
        try {
          this.recognition.start();
        } catch (e) {
          // Already started — ignore
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.error("[QuestionCapture] Recognition error:", event.error);
      // Auto-recover from transient errors
      if (
        event.error === "network" &&
        this.state !== "STOPPED"
      ) {
        setTimeout(() => this.recognition.start(), 1000);
      }
    };
  }

  start() {
    this.state = "LISTENING";
    this.buffer = "";
    this.consumedUpTo = 0;
    this.recognition.start();
  }

  stop() {
    this.state = "STOPPED";
    this.recognition.stop();
    clearTimeout(this.silenceTimer);
  }

  resume() {
    this.state = "LISTENING";
  }

  _handleResult(event) {
    let finalChunk = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalChunk += event.results[i][0].transcript + " ";
      }
    }

    if (finalChunk.trim()) {
      this.buffer += finalChunk;
      this._resetSilenceTimer();
    }
  }

  _resetSilenceTimer() {
    clearTimeout(this.silenceTimer);
    this.silenceTimer = setTimeout(() => this._onSilence(), this.silenceMs);
  }

  _onSilence() {
    if (this.state !== "LISTENING") return;

    const unconsumed = this.buffer.slice(this.consumedUpTo).trim();
    if (!unconsumed) return;

    if (this._looksLikeQuestion(unconsumed)) {
      this.consumedUpTo = this.buffer.length;
      this.state = "SUGGESTING";
      this.onQuestionReady(unconsumed);
    }
  }

  _looksLikeQuestion(text) {
    const words = text.trim().split(/\s+/);
    if (words.length < this.minWords) return false;

    // Question indicators — ordered by strength
    const strongIndicators = /\?(?:\s|$)/;
    const mediumIndicators =
      /\b(who|what|when|where|why|how|tell me about|walk me through|describe|explain|can you|could you|would you|give me|talk about|what's your|how do you|have you ever|what would you)\b/i;

    // Strong: ends with question mark → almost certainly a question
    if (strongIndicators.test(text)) return true;

    // Medium: starts with or contains question phrasing
    if (mediumIndicators.test(text)) return true;

    // Weak: ends with a trailing conjunction (interviewer mid-thought)
    // e.g., "Tell me about a time when..." — not a full question yet
    const trailingConjunction = /\b(and|but|or|so|then|that|which|who|where|when)\s*$/i;
    if (trailingConjunction.test(text)) return false;

    return false;
  }

  // Manual override — candidate forces a send regardless of heuristics
  forceCapture() {
    const unconsumed = this.buffer.slice(this.consumedUpTo).trim();
    if (!unconsumed) return null;

    this.consumedUpTo = this.buffer.length;
    this.state = "SUGGESTING";
    this.onQuestionReady(unconsumed);
    return unconsumed;
  }

  // Get current buffer for debugging
  getBuffer() {
    return this.buffer;
  }
}
