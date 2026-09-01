export class SystemAudioCapture {
  constructor({ apiKey, onTranscript, onError }) {
    this.apiKey = apiKey;
    this.onTranscript = onTranscript;
    this.onError = onError;
    this.stream = null;
    this.active = false;
  }

  async start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error('System audio capture requires browser tab sharing support.');
    }

    this.stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    const audioTracks = this.stream.getAudioTracks();
    if (!audioTracks.length) {
      throw new Error('No audio track detected. Please share tab audio.');
    }

    this.stream.getVideoTracks().forEach((track) => track.stop());
    this.active = true;
    this.onTranscript('System audio capture started.');
  }

  stop() {
    this.active = false;
    this.stream?.getTracks().forEach((track) => track.stop());
  }
}
