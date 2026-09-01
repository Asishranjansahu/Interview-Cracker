import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Minimize2,
  Maximize2,
  Sliders,
  Sparkles,
  Code2,
  FileText,
  Zap,
  Layers,
  X,
  Move,
  Eye,
  EyeOff,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';

export function StealthTeleprompter({
  isOpen,
  onClose,
  onOpen,
  cue,
  currentQuestion,
  micEnabled,
  onToggleMic,
  isListening,
  interimText,
  onSpeakAnswer,
  isSpeaking,
  onStopSpeech,
  onRegenerate,
  company,
  role,
}) {
  const [activeTab, setActiveTab] = useState('flash'); // 'flash' | 'star' | 'code' | 'script'
  const [opacity, setOpacity] = useState(92); // 40 to 100
  const [fontSize, setFontSize] = useState('medium'); // 'small' | 'medium' | 'large'
  const [position, setPosition] = useState('top-center'); // 'top-center' | 'top-right' | 'compact'
  const [isCopied, setIsCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Copy helper
  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) {
    return (
      <button
        id="reopen-stealth-hud-btn"
        onClick={() => onOpen?.()}
        className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 rounded-full border border-emerald-400/50 bg-slate-950/90 px-4 py-2.5 text-xs font-bold text-emerald-300 shadow-2xl shadow-emerald-500/20 backdrop-blur-md hover:bg-emerald-950 hover:border-emerald-300 transition animate-bounce"
        title="Open Parakeet Stealth Teleprompter HUD (Shift+P)"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
        <Zap className="h-4 w-4 text-emerald-400" />
        <span>Open Parakeet HUD</span>
      </button>
    );
  }

  const fontClass =
    fontSize === 'small' ? 'text-xs leading-relaxed' : fontSize === 'large' ? 'text-base leading-relaxed' : 'text-sm leading-relaxed';

  const positionClasses = {
    'top-center': 'top-4 left-1/2 -translate-x-1/2 w-[94vw] max-w-2xl',
    'top-right': 'top-4 right-4 w-[90vw] max-w-xl',
    'compact': 'top-4 left-1/2 -translate-x-1/2 w-[85vw] max-w-md',
  };

  return (
    <div
      id="stealth-teleprompter-hud"
      style={{
        backgroundColor: `rgba(10, 15, 29, ${opacity / 100})`,
        backdropFilter: 'blur(20px)',
      }}
      className={`fixed z-[9999] rounded-2xl border-2 border-emerald-400/60 shadow-2xl shadow-black transition-all duration-200 overflow-hidden ${
        positionClasses[position] || positionClasses['top-center']
      }`}
    >
      {/* Top Drag & Control Bar */}
      <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-2 bg-white/5 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold tracking-wider text-emerald-300 uppercase">
              Parakeet Stealth HUD
            </span>
          </div>

          <button
            onClick={onToggleMic}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition ${
              micEnabled
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
            }`}
          >
            {micEnabled ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
            {micEnabled ? 'Listening' : 'Mic Muted'}
          </button>
        </div>

        {/* HUD Window Controls */}
        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Teleprompter Display Settings"
            className="p-1 rounded hover:bg-white/10 hover:text-slate-200 transition"
          >
            <Sliders className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand HUD' : 'Collapse to Mini'}
            className="p-1 rounded hover:bg-white/10 hover:text-slate-200 transition"
          >
            {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={onClose}
            title="Close Teleprompter"
            className="p-1 rounded hover:bg-rose-500/20 hover:text-rose-300 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Settings Bar Overlay */}
      {showSettings && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-b border-white/10 bg-slate-900/90 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Opacity:</span>
            <input
              type="range"
              min="35"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-20 accent-emerald-400 cursor-pointer"
            />
            <span className="text-[10px] font-mono text-emerald-400">{opacity}%</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Font:</span>
            {['small', 'medium', 'large'].map((s) => (
              <button
                key={s}
                onClick={() => setFontSize(s)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                  fontSize === s ? 'bg-emerald-500 text-slate-950' : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Dock:</span>
            {[
              { id: 'top-center', label: 'Camera' },
              { id: 'top-right', label: 'Right' },
              { id: 'compact', label: 'Mini' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPosition(p.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  position === p.id ? 'bg-emerald-500 text-slate-950' : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Question Ticker */}
      <div className="px-4 py-2 border-b border-white/5 bg-slate-950/40">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <span className="mt-0.5 shrink-0 px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-bold text-emerald-300 uppercase">
              Q
            </span>
            <p className="text-xs font-semibold text-white truncate">
              {currentQuestion || interimText || 'Listening for interviewer question...'}
            </p>
          </div>

          {cue && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => {
                  if (isSpeaking) onStopSpeech?.();
                  else onSpeakAnswer?.(cue.full_answer || cue.headline_answer);
                }}
                className={`p-1 rounded text-xs transition ${
                  isSpeaking ? 'bg-emerald-500 text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
                title={isSpeaking ? 'Stop Audio' : 'Listen via Earpiece TTS'}
              >
                {isSpeaking ? <VolumeX className="h-3.5 w-3.5 animate-pulse" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>

              <button
                onClick={() =>
                  handleCopy(
                    activeTab === 'code'
                      ? cue.codeSnippet || cue.full_answer
                      : activeTab === 'script'
                      ? cue.full_answer
                      : `${cue.headline_answer}\n\nKey Points:\n` + (cue.bullets || []).map((b) => `• ${b}`).join('\n')
                  )
                }
                className="p-1 rounded text-xs bg-white/5 text-slate-300 hover:bg-white/10 transition"
                title="Copy Answer"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}
        </div>

        {interimText && (
          <p className="mt-1 text-[11px] text-amber-300/80 italic truncate animate-pulse">
            Transcribing: {interimText}
          </p>
        )}
      </div>

      {/* Main HUD Answer Content (Collapsed when isMinimized) */}
      {!isMinimized && (
        <div className="p-3.5">
          {/* Quick Tab Switcher */}
          <div className="flex items-center gap-1.5 border-b border-white/10 pb-2 mb-2.5">
            {[
              { id: 'flash', label: '⚡ Flash Cue', icon: Zap },
              { id: 'star', label: '🎯 STAR Points', icon: Layers },
              { id: 'code', label: '💻 Code / Solution', icon: Code2 },
              { id: 'script', label: '📜 Teleprompter Script', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Flash Cue */}
          {activeTab === 'flash' && (
            <div className={`space-y-2 text-slate-100 ${fontClass}`}>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-2.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-0.5">
                  10-Second Eye-Contact Headline:
                </span>
                <p className="font-semibold text-white">
                  {cue?.headline_answer || 'Speak clearly, structure with STAR, mention relevant projects.'}
                </p>
              </div>

              {cue?.bullets && cue.bullets.length > 0 && (
                <ul className="space-y-1.5 pl-1">
                  {cue.bullets.slice(0, 3).map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-200">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              {cue?.tradeoff && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-xs text-amber-200">
                  <span className="font-bold">Tradeoff to mention:</span> {cue.tradeoff}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: STAR Breakdown */}
          {activeTab === 'star' && (
            <div className={`space-y-2 text-slate-200 ${fontClass}`}>
              {cue?.bullets?.map((bullet, idx) => (
                <div key={idx} className="rounded-lg border border-white/5 bg-white/5 p-2 flex items-start gap-2.5">
                  <span className="shrink-0 font-mono text-[11px] font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10">
                    0{idx + 1}
                  </span>
                  <p className="text-slate-100 leading-snug">{bullet}</p>
                </div>
              ))}
              {cue?.tradeoff && (
                <p className="text-xs text-amber-300 italic pt-1 border-t border-white/5">
                  💡 Architectural Trade-off: {cue.tradeoff}
                </p>
              )}
            </div>
          )}

          {/* Tab 3: Code & DSA Solution */}
          {activeTab === 'code' && (
            <div className="space-y-2">
              {cue?.complexity && (
                <div className="flex items-center justify-between text-xs font-mono text-emerald-300 px-2 py-1 rounded bg-emerald-950/40 border border-emerald-500/20">
                  <span>{cue.complexity}</span>
                  <span className="text-[10px] text-slate-400">Optimal Runtime</span>
                </div>
              )}

              <div className="relative rounded-xl border border-white/10 bg-slate-950 p-3 max-h-56 overflow-y-auto">
                <pre className="font-mono text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap">
                  {cue?.codeSnippet ||
                    `// Solution for ${currentQuestion || 'Technical problem'}\npublic class Solution {\n    public void execute() {\n        // Optimized O(N) logic\n    }\n}`}
                </pre>
              </div>
            </div>
          )}

          {/* Tab 4: Teleprompter Spoken Script */}
          {activeTab === 'script' && (
            <div className="max-h-56 overflow-y-auto pr-1">
              <div className={`rounded-xl border border-white/10 bg-slate-950/60 p-3 text-slate-100 ${fontClass}`}>
                <p className="leading-relaxed whitespace-pre-line">
                  {cue?.full_answer ||
                    `In my work at ${company || 'previous projects'}, I approached this systematically: first validating requirements, structuring clean modular services, and verifying with automated tests.`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
