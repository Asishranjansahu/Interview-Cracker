/**
 * StreamingSTT — routes system audio (from getDisplayMedia) to a Deepgram
 * WebSocket for real-time transcription. Falls back to Web Speech API
 * for mic-only mode.
 *
 * Deepgram docs: https://developers.deepgram.com/reference/streaming-stt
 */

const ENV_DEEPGRAM_API_KEY = import.meta.env?.VITE_DEEPGRAM_API_KEY || "";

export class StreamingSTT {
  constructor({ deepgramApiKey, onTranscript, onInterim, onError }) {
    this.deepgramApiKey = deepgramApiKey || ENV_DEEPGRAM_API_KEY;
    this.onTranscript = onTranscript; // final(text) callback
    this.onInterim = onInterim;       // interim(text) callback
    this.onError = onError;           // error(err) callback

    this.ws = null;
    this.audioContext = null;
    this.source = null;
    this.processor = null;
    this.stream = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Start capturing system audio and streaming to Deepgram.
   * @param {MediaStream} stream - from getDisplayMedia
   */
  async start(stream) {
    this.stream = stream;

    if (!this.deepgramApiKey) {
      throw new Error(
        "Deepgram API key required. Enter it in the setup screen or set VITE_DEEPGRAM_API_KEY in your .env file."
      );
    }

    this._connectWebSocket();
    this._connectAudioPipeline(stream);
  }

  _connectWebSocket() {
    const params = new URLSearchParams({
      model: "nova-2",
      language: "en",
      smart_format: "true",
      interim_results: "true",
      utterance_end_ms: "1500",
      vad_events: "true",
    });

    params.set("token", this.deepgramApiKey);

    this.ws = new WebSocket(
      `wss://api.deepgram.com/v1/listen?${params.toString()}`
    );

    this.ws.onopen = () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      console.log("[StreamingSTT] Connected to Deepgram");
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "Results") {
        const transcript = data.channel.alternatives[0]?.transcript;
        if (!transcript) return;

        if (data.is_final) {
          this.onTranscript(transcript);
        } else {
          this.onInterim(transcript);
        }
      }

      if (data.type === "UtteranceEnd") {
        console.log("[StreamingSTT] Utterance end detected");
      }
    };

    this.ws.onerror = (event) => {
      console.error("[StreamingSTT] WebSocket error:", event);
      this.onError?.(event);
    };

    this.ws.onclose = (event) => {
      this.connected = false;
      console.log("[StreamingSTT] WebSocket closed:", event.code, event.reason);

      if (
        event.code !== 1000 &&
        this.reconnectAttempts < this.maxReconnectAttempts
      ) {
        this.reconnectAttempts++;
        const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 10000);
        console.log(`[StreamingSTT] Reconnecting in ${delay}ms...`);
        setTimeout(() => this._connectWebSocket(), delay);
      }
    };
  }

  _connectAudioPipeline(stream) {
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    this.source = this.audioContext.createMediaStreamSource(stream);

    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);

    this.processor.onaudioprocess = (e) => {
      if (!this.connected || this.ws.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);

      // Convert Float32 → Int16 (linear16) for Deepgram
      const buffer = new ArrayBuffer(inputData.length * 2);
      const view = new DataView(buffer);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      }

      this.ws.send(buffer);
    };
  }

  stop() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.ws) {
      this.ws.close(1000, "User stopped");
      this.ws = null;
    }

    this.connected = false;
  }

  getStatus() {
    return {
      connected: this.connected,
      wsReadyState: this.ws?.readyState,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}
