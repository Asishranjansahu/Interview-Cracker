/**
 * Greenroom — Live interview co-pilot
 *
 * Usage:
 *   import { Greenroom } from "./index.js";
 *   const greenroom = new Greenroom(profile);
 *   await greenroom.start(); // mic mode (default)
 *   // or: await greenroom.start("system-audio"); // Deepgram mode
 */

import { GreenroomPipeline } from "./greenroomPipeline.js";
import { SuggestionCard } from "./ui/SuggestionCard.js";

export class Greenroom {
  constructor(profile, callbacks = {}) {
    this.profile = profile;
    this.card = new SuggestionCard("greenroom-root");
    this.pipeline = null;
    this.onSuggestion = callbacks.onSuggestion || (() => {});
    this.onStatusChange = callbacks.onStatusChange || (() => {});
    this.onError = callbacks.onError || (() => {});
  }

  async start(mode = "mic") {
    this.card.showWelcome();

    this.pipeline = new GreenroomPipeline({
      profile: this.profile,
      anthropicApiKey: this.profile.anthropicApiKey || "",
      deepgramApiKey: this.profile.deepgramApiKey || "",
      onSuggestion: (suggestion) => {
        this.card.showSuggestion(suggestion);
        this.onSuggestion(suggestion);
      },
      onStatusChange: (status) => {
        if (status.state === "SUGGESTING" && status.question) {
          this.card.showLoading(status.question);
        }
        this.onStatusChange(status);
      },
      onError: (err) => {
        console.warn("[Greenroom] Warning:", err);
        this.card.showStatus(
          "Answer unavailable — using local interview guidance.",
          "info"
        );
        this.onError(err);
      },
    });

    if (mode === "system-audio") {
      await this.pipeline.startSystemAudioMode();
    } else {
      await this.pipeline.startMicMode();
    }
  }

  stop() {
    this.pipeline?.stop();
  }

  forceCapture() {
    return this.pipeline?.forceCapture();
  }

  getHistory() {
    return this.pipeline?.getHistory() || [];
  }
}

// Re-export components for advanced usage
export { QuestionCapture } from "./QuestionCapture.js";
export { StreamingSTT } from "./StreamingSTT.js";
export { GreenroomPipeline } from "./greenroomPipeline.js";
export { SuggestionCard } from "./ui/SuggestionCard.js";
export { buildSystemPrompt } from "./promptBuilder.js";
