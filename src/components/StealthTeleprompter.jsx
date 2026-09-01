import React, { useState } from 'react';
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
  Code2,
  FileText,
  Zap,
  Layers,
  X,
} from 'lucide-react';

export function StealthTeleprompter({
  isOpen,
  onClose,
  onOpen,
  cue,
  currentQuestion,
  micEnabled,
  onToggleMic,
  interimText,
  onSpeakAnswer,
  isSpeaking,
  onStopSpeech,
  company,
}) {
  const [activeTab, setActiveTab] = useState('flash'); // 'flash' | 'star' | 'code' | 'script'
  const [opacity, setOpacity] = useState(95);
  const [fontSize, setFontSize] = useState('medium');
  const [position, setPosition] = useState('top-center');
  const [isCopied, setIsCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

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
        type="button"
        onClick={() => onOpen?.()}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-emerald-500/30 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-emerald-400 shadow-xl backdrop-blur-md hover:bg-slate-800 hover:border-emerald-400/50 transition duration-150 group"
        title="Open Stealth Teleprompter HUD (Shift+P)"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 group-hover:scale-125 transition" />
        <Zap className="h-3.5 w-3.5" />
        <span>Stealth HUD</span>
        <span className="text-[10px] text-slate-500 font-mono">Shift+P</span>
      </button>
    );
  }

  const fontClass =
    fontSize === 'small' ? 'text-xs leading-normal' : fontSize === 'large' ? 'text-base leading-relaxed' : 'text-sm leading-relaxed';

  const positionClasses = {
    'top-center': 'top-4 left-1/2 -translate-x-1/2 w-[92vw] max-w-xl',
    'top-right': 'top-4 right-4 w-[90vw] max-w-lg',
    'compact': 'top-4 left-1/2 -translate-x-1/2 w-[85vw] max-w-md',
  };

  return (
    <div
      id="stealth-teleprompter-hud"
      style={{
        backgroundColor: `rgba(15, 23, 42, ${opacity / 100})`,
      }}
      className={`fixed z-50 rounded-xl border border-slate-700/60 shadow-2xl backdrop-blur-xl transition-all duration-150 overflow-hidden ${
        positionClasses[position] || positionClasses['top-center']
      }`}
    >
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-3.5 py-2 bg-slate-900/60 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>HUD Live</span>
          </div>

          <button
            type="button"
            onClick={onToggleMic}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition ${
              micEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {micEnabled ? <Mic className="h-3 w-3 text-emerald-400" /> : <MicOff className="h-3 w-3" />}
            <span>{micEnabled ? 'Listening' : 'Mic Off'}</span>
          </button>
        </div>

        {/* HUD Controls */}
        <div className="flex items-center gap-1 text-slate-400">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            title="Display Settings"
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <Sliders className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand' : 'Collapse'}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 transition"
          >
            {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Close Teleprompter"
            className="p-1 rounded hover:bg-slate-800 hover:text-rose-400 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Settings Row */}
      {showSettings && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2 border-b border-slate-800 bg-slate-950/80 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Opacity:</span>
            <input
              type="range"
              min="40"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-16 accent-emerald-400 cursor-pointer h-1 bg-slate-700 rounded"
            />
            <span className="text-[10px] font-mono text-emerald-400">{opacity}%</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400 mr-1">Font:</span>
            {['small', 'medium', 'large'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFontSize(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
                  fontSize === s ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {s[0]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400 mr-1">Dock:</span>
            {[
              { id: 'top-center', label: 'Center' },
              { id: 'top-right', label: 'Right' },
              { id: 'compact', label: 'Mini' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPosition(p.id)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  position === p.id ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Question Display */}
      <div className="px-3.5 py-2 border-b border-slate-800 bg-slate-900/30">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
              Q
            </span>
            <p className="text-xs font-medium text-slate-200 truncate">
              {currentQuestion || interimText || 'Listening for questions...'}
            </p>
          </div>

          {cue && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) onStopSpeech?.();
                  else onSpeakAnswer?.(cue.full_answer || cue.headline_answer);
                }}
                className={`p-1 rounded text-xs transition ${
                  isSpeaking ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title={isSpeaking ? 'Stop Audio' : 'Listen with TTS'}
              >
                {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    activeTab === 'code'
                      ? cue.codeSnippet || cue.full_answer
                      : activeTab === 'script'
                      ? cue.full_answer
                      : `${cue.headline_answer}\n\n` + (cue.bullets || []).map((b) => `• ${b}`).join('\n')
                  )
                }
                className="p-1 rounded text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                title="Copy"
              >
                {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          )}
        </div>

        {interimText && (
          <p className="mt-1 text-[11px] text-emerald-400/80 italic truncate">
            Transcribing: {interimText}
          </p>
        )}
      </div>

      {/* Main Content Area */}
      {!isMinimized && (
        <div className="p-3">
          {/* Tab navigation */}
          <div className="flex items-center gap-1 border-b border-slate-800 pb-2 mb-2">
            {[
              { id: 'flash', label: 'Headline', icon: Zap },
              { id: 'star', label: 'STAR Points', icon: Layers },
              { id: 'code', label: 'Code', icon: Code2 },
              { id: 'script', label: 'Script', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Headline Response */}
          {activeTab === 'flash' && (
            <div className={`space-y-2 ${fontClass}`}>
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-0.5">
                  5-Second Answer:
                </span>
                <p className="font-semibold text-slate-100">
                  {cue?.headline_answer || 'Start with a high-level summary, explain architectural reasoning, and mention real-world results.'}
                </p>
              </div>

              {cue?.bullets && cue.bullets.length > 0 && (
                <ul className="space-y-1 pl-1 text-xs text-slate-300">
                  {cue.bullets.slice(0, 3).map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Tab 2: STAR Points */}
          {activeTab === 'star' && (
            <div className={`space-y-1.5 text-xs text-slate-200 max-h-52 overflow-y-auto ${fontClass}`}>
              {cue?.bullets?.map((bullet, idx) => (
                <div key={idx} className="rounded bg-slate-900/60 p-2 flex items-start gap-2 border border-slate-800/80">
                  <span className="shrink-0 font-mono text-[10px] font-bold text-emerald-400 px-1 rounded bg-emerald-500/10">
                    {idx + 1}
                  </span>
                  <p className="text-slate-200 leading-snug">{bullet}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Code */}
          {activeTab === 'code' && (
            <div className="space-y-1.5">
              {cue?.complexity && (
                <div className="text-[11px] font-mono text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {cue.complexity}
                </div>
              )}
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 max-h-48 overflow-y-auto">
                <pre className="font-mono text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap">
                  {cue?.codeSnippet || '// No code snippet for this conceptual question.'}
                </pre>
              </div>
            </div>
          )}

          {/* Tab 4: Full Script */}
          {activeTab === 'script' && (
            <div className="max-h-48 overflow-y-auto">
              <div className={`rounded-lg bg-slate-950 p-2.5 text-slate-200 border border-slate-800 ${fontClass}`}>
                <p className="leading-relaxed whitespace-pre-line text-xs">
                  {cue?.full_answer ||
                    `In my background at ${company || 'previous roles'}, I have designed and delivered scalable services with clean modular architecture and automated testing.`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
