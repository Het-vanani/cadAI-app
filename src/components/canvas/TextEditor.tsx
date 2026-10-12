import React, { useEffect, useRef, useState } from 'react';
import { useToolStore } from '../../store/useToolStore';

interface TextEditorProps {
  x: number; // absolute screen X (where user clicked)
  y: number; // absolute screen Y (where user clicked)
  onConfirm: (text: string) => void;
  onCancel: () => void;
  color: string;
}

const FONT_SIZES = [10, 12, 14, 16, 18, 24, 32, 48, 64, 96];

export const TextEditor: React.FC<TextEditorProps> = ({
  x, y, onConfirm, onCancel, color
}) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { fontSize, setFontSize } = useToolStore();

  // Clamp so panel never goes off screen
  const panelW = 340;
  const panelH = 110;
  const safeX = Math.min(x, window.innerWidth - panelW - 8);
  const safeY = Math.max(y - panelH - 8, 8); // always above click point

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      if (value.trim()) onConfirm(value.trim());
      else onCancel();
    }
    if (e.key === 'Escape') onCancel();
  };

  return (
    <>
      {/* ── Click anchor indicator — tiny dot at exact click point ── */}
      <div
        className="fixed z-50 pointer-events-none"
        style={{
          left: x - 3,
          top: y - 3,
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />

      {/* ── Connector line from panel to click point ── */}
      <svg
        className="fixed z-40 pointer-events-none"
        style={{ left: 0, top: 0, width: '100vw', height: '100vh' }}
      >
        <line
          x1={safeX + panelW / 2}
          y1={safeY + panelH}
          x2={x}
          y2={y}
          stroke={color}
          strokeWidth={1}
          strokeDasharray="4 3"
          opacity={0.4}
        />
      </svg>

      {/* ── Main floating panel ── */}
      <div
        className="fixed z-50 bg-panel-bg border border-panel-border rounded-xl shadow-2xl overflow-hidden"
        style={{
          left: safeX,
          top: safeY,
          width: panelW,
        }}
      >
        {/* Font size row */}
        <div className="flex items-center gap-1 px-2 py-1.5 bg-[#18181b] border-b border-panel-border">
          <span className="text-[10px] text-slate-500 shrink-0 mr-1">Size:</span>
          <div className="flex gap-0.5 flex-wrap">
            {FONT_SIZES.map((s) => (
              <button
                key={s}
                onMouseDown={(e) => { e.preventDefault(); setFontSize(s); }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors
                  ${fontSize === s
                    ? 'bg-zinc-700 text-white ring-1 ring-zinc-500'
                    : 'text-slate-500 hover:text-white hover:bg-panel-hover'
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Text input — looks like text directly on canvas */}
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{ backgroundColor: 'rgba(24, 24, 27, 0.95)' }}
        >
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              // Small delay so size buttons can be clicked without triggering blur
              setTimeout(() => {
                if (value.trim()) onConfirm(value.trim());
                else onCancel();
              }, 150);
            }}
            placeholder="Type text here..."
            className="flex-1 bg-transparent outline-none font-sans"
            style={{
              borderBottom: `2px solid ${color}`,
              color: color,
              caretColor: color,
              fontSize: `${Math.min(Math.max(fontSize, 12), 28)}px`,
              paddingBottom: 2,
            }}
          />
        </div>

        {/* Hint bar */}
        <div className="flex items-center justify-between px-3 py-1 border-t border-panel-border">
          <span className="text-[10px] text-slate-600">
            Placing at X:{Math.round(x)} Y:{Math.round(y)}
          </span>
          <span className="text-[10px] text-slate-600">
            <kbd className="bg-panel-border px-1 rounded text-slate-400">Enter</kbd> place ·
            <kbd className="bg-panel-border px-1 rounded text-slate-400 ml-1">Esc</kbd> cancel
          </span>
        </div>
      </div>
    </>
  );
};