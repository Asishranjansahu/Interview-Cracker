/**
 * GreenroomPipeline — the full loop:
 *   audio in → question detected → prompt filled → structured JSON out → rendered
 */

import { QuestionCapture } from "./QuestionCapture.js";
import { StreamingSTT } from "./StreamingSTT.js";
import { buildSystemPrompt, buildFallbackSuggestion } from "./promptBuilder.js";

const ENV_ANTHROPIC_API_KEY = import.meta.env?.VITE_ANTHROPIC_API_KEY || "";
const ENV_DEEPGRAM_API_KEY = import.meta.env?.VITE_DEEPGRAM_API_KEY || "";

export class GreenroomPipeline {
  constructor({ profile, anthropicApiKey, deepgramApiKey, onSuggestion, onStatusChange, onError }) {
    this.profile = profile;
    this.anthropicApiKey = anthropicApiKey || ENV_ANTHROPIC_API_KEY;
    this.deepgramApiKey = deepgramApiKey || ENV_DEEPGRAM_API_KEY;
    this.onSuggestion = onSuggestion;
    this.onStatusChange = onStatusChange;
    this.onError = onError;

    this.capture = null;
    this.streamingSTT = null;
    this.mode = null; // "mic" | "system-audio"
    this.history = [];
    this.pendingRequest = null;
  }

  /**
   * Start in mic-only mode (default, simpler).
   * Uses Web Speech API directly — no Deepgram needed.
   */
  async startMicMode() {
    this.mode = "mic";

    this.capture = new QuestionCapture({
      silenceMs: 1500,
      minWords: 4,
      onQuestionReady: (question) => this._onQuestionDetected(question),
    });

    this.capture.start();
    this.onStatusChange?.({ mode: "mic", state: "LISTENING" });
  }

  /**
   * Start in system-audio mode (captures interviewer only).
   * Requires Deepgram API key and getDisplayMedia permission.
   */
  async startSystemAudioMode() {
    this.mode = "system-audio";

    // Request tab/screen share with audio
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      throw new Error(
        'No audio track. Make sure you checked "Share audio" when sharing the tab.'
      );
    }

    // Stop video tracks — we only need audio
    stream.getVideoTracks().forEach((track) => track.stop());

    // Buffer for accumulating transcripts before question detection
    let transcriptBuffer = "";
    let lastTranscriptTime = 0;

    this.streamingSTT = new StreamingSTT({
      deepgramApiKey: this.deepgramApiKey,
      onTranscript: (text) => {
        transcriptBuffer += text + " ";
        lastTranscriptTime = Date.now();

        // Check for question after silence
        this._checkForQuestion(transcriptBuffer);
        transcriptBuffer = "";
      },
      onInterim: (text) => {
        // Optionally show live interim text in UI
        this.onStatusChange?.({ interimText: text });
      },
      onError: (err) => {
        this.onError?.(err);
      },
    });

    await this.streamingSTT.start(stream);
    this.onStatusChange?.({ mode: "system-audio", state: "LISTENING" });
  }

  _checkForQuestion(text) {
    const words = text.trim().split(/\s+/);
    if (words.length < 4) return;

    const strongIndicators = /\?(?:\s|$)/;
    const mediumIndicators =
      /\b(who|what|when|where|why|how|tell me about|walk me through|describe|explain|can you|could you|would you|give me|talk about)\b/i;

    if (strongIndicators.test(text) || mediumIndicators.test(text)) {
      this._onQuestionDetected(text.trim());
    }
  }

  async _onQuestionDetected(question) {
    this.onStatusChange?.({ state: "SUGGESTING", question });

    try {
      const suggestion = await this._getSuggestion(question);

      this.history.push({
        timestamp: Date.now(),
        question,
        suggestion,
      });

      this.onSuggestion?.(suggestion);

      // Resume listening after showing suggestion
      if (this.mode === "mic") {
        this.capture?.resume();
      }
    } catch (err) {
      console.warn("[GreenroomPipeline] Suggestion failed, using local fallback:", err);
      const fallbackSuggestion = buildFallbackSuggestion(this.profile, question);
      this.history.push({
        timestamp: Date.now(),
        question,
        suggestion: fallbackSuggestion,
      });
      this.onSuggestion?.(fallbackSuggestion);

      if (this.mode === "mic") {
        this.capture?.resume();
      }
    }
  }

  async _getSuggestion(question) {
    if (!this.anthropicApiKey) {
      return buildFallbackSuggestion(this.profile, question);
    }

    try {
      const systemPrompt = buildSystemPrompt(
      {
        ...this.profile,
        mode: "live",
        question_type: this.profile.question_type || this.profile.interview_type || "general",
      },
      question,
      "live"
    );

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: `Interviewer just asked: "${question}"`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.warn("[GreenroomPipeline] Anthropic error, using fallback:", response.status, errorBody);
        return buildFallbackSuggestion(this.profile, question);
      }

      const data = await response.json();
      const text = data.content.find((b) => b.type === "text")?.text ?? "{}";
      const cleaned = text.replace(/```json|```/g, "").trim();

      try {
        const parsed = JSON.parse(cleaned);
        if (!parsed || typeof parsed !== "object") {
          return buildFallbackSuggestion(this.profile, question);
        }
        return {
          bullets: Array.isArray(parsed.bullets) && parsed.bullets.length ? parsed.bullets : buildFallbackSuggestion(this.profile, question).bullets,
          full_answer: parsed.full_answer || buildFallbackSuggestion(this.profile, question).full_answer,
          note: parsed.note || "",
        };
      } catch (e) {
        console.warn("[GreenroomPipeline] JSON parse failed, using fallback:", e);
        return buildFallbackSuggestion(this.profile, question);
      }
    } catch (err) {
      console.warn("[GreenroomPipeline] Request failed, using fallback:", err);
      return buildFallbackSuggestion(this.profile, question);
    }
  }

  /**
   * Manual capture — candidate presses button to force-send.
   */
  forceCapture() {
    if (this.mode === "mic") {
      return this.capture?.forceCapture();
    }
  }

  stop() {
    this.capture?.stop();
    this.streamingSTT?.stop();
    this.onStatusChange?.({ state: "STOPPED" });
  }

  /**
   * Get post-interview summary.
   */
  getHistory() {
    return this.history;
  }
}
