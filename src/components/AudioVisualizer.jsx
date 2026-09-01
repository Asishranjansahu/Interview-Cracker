import React, { useEffect, useRef } from 'react';

export function AudioVisualizer({ audioStream, isActive, volume = 0 }) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    if (!audioStream || !isActive) {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch {
          // ignore
        }
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(audioStream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const canvasCtx = canvas.getContext('2d');

      const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);
        if (!canvasRef.current) return;

        analyser.getByteFrequencyData(dataArray);

        const width = canvas.width;
        const height = canvas.height;

        canvasCtx.clearRect(0, 0, width, height);

        const barCount = 18;
        const barWidth = (width / barCount) - 3;
        let x = 0;

        for (let i = 0; i < barCount; i++) {
          const dataIndex = Math.floor((i / barCount) * (bufferLength / 2));
          const val = dataArray[dataIndex] || 0;
          const percent = val / 255;
          const barHeight = Math.max(4, percent * height * 0.95);

          // Dynamic gradient based on amplitude
          const gradient = canvasCtx.createLinearGradient(0, height, 0, height - barHeight);
          if (percent > 0.4) {
            gradient.addColorStop(0, '#10b981'); // Emerald 500
            gradient.addColorStop(1, '#34d399'); // Emerald 400
          } else {
            gradient.addColorStop(0, '#047857'); // Emerald 700
            gradient.addColorStop(1, '#10b981'); // Emerald 500
          }

          canvasCtx.fillStyle = gradient;
          canvasCtx.beginPath();
          canvasCtx.roundRect(x, height - barHeight, barWidth, barHeight, [2, 2, 0, 0]);
          canvasCtx.fill();

          x += barWidth + 3;
        }
      };

      draw();
    } catch (err) {
      console.warn('[AudioVisualizer] Web Audio API init failed:', err);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, [audioStream, isActive]);

  if (!isActive) {
    return (
      <div className="flex h-10 items-center justify-center rounded-xl bg-slate-900/60 px-3 text-xs text-slate-400">
        <span>Microphone inactive</span>
      </div>
    );
  }

  return (
    <div className="flex h-10 items-center gap-3 rounded-xl border border-emerald-500/20 bg-slate-950/80 px-3 py-1.5 shadow-inner">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Live Voice</span>
      </div>
      <canvas
        ref={canvasRef}
        width={140}
        height={28}
        className="h-7 w-[140px]"
      />
      <div className="ml-auto text-[11px] font-mono text-emerald-400/90">
        {Math.round(volume)}%
      </div>
    </div>
  );
}
