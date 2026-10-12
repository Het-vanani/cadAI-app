import React, { useState } from 'react';
import {
  MousePointer2, Move, ZoomIn, Minus,
  Square, Circle, PenTool, Type, Slash,
  Ruler, Check, X, Eraser
} from 'lucide-react';
import { useToolStore } from '../../store/useToolStore';
import { useSettingsStore, UNITS, UnitType } from '../../store/useSettingsStore';

const SCALES = [
  { label: '1:1',    value: 1 },
  { label: '1:10',   value: 10 },
  { label: '1:20',   value: 20 },
  { label: '1:50',   value: 50 },
  { label: '1:100',  value: 100 },
  { label: '1:200',  value: 200 },
  { label: '1:500',  value: 500 },
  { label: '1:1000', value: 1000 },
];

const UNIT_GROUPS = [
  { label: 'Metric',   units: ['mm', 'cm', 'm', 'km'] as UnitType[] },
  { label: 'Imperial', units: ['in', 'ft', 'yd'] as UnitType[] },
];

// Arc icon — drawn as SVG since lucide doesn't have one
const ArcIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M2 13 Q2 2 13 2" />
    <circle cx="2" cy="13" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="13" cy="2" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

const tools = [
  { type: 'select',    icon: <MousePointer2 size={15} />, label: 'Select',    shortcut: 'V' },
  { type: 'move',      icon: <Move size={15} />,          label: 'Move',      shortcut: 'M' },
  { type: 'eraser',    icon: <Eraser size={15} />,        label: 'Eraser',    shortcut: 'X' },
  { type: 'pan',       icon: <ZoomIn size={15} />,        label: 'Pan',       shortcut: 'H' },
  { type: 'line',      icon: <Minus size={15} />,         label: 'Line',      shortcut: 'L' },
  { type: 'rectangle', icon: <Square size={15} />,        label: 'Rect',      shortcut: 'R' },
  { type: 'circle',    icon: <Circle size={15} />,        label: 'Circle',    shortcut: 'C' },
  { type: 'ellipse',   icon: <PenTool size={15} />,       label: 'Ellipse',   shortcut: 'E' },
  { type: 'arc',       icon: <ArcIcon />,                 label: 'Arc',       shortcut: 'A' },
  { type: 'polyline',  icon: <Slash size={15} />,         label: 'Polyline',  shortcut: 'P' },
  { type: 'text',      icon: <Type size={15} />,          label: 'Text',      shortcut: 'T' },
];

export const LeftToolbar: React.FC = () => {
  const { activeTool, setActiveTool } = useToolStore();
  const { unit, scale, setUnit, setScale, formatDistance } = useSettingsStore();
  const [showDimPanel, setShowDimPanel] = useState(false);

  const handleDimClick = () => setShowDimPanel(true);

  const handleStartDimension = () => {
    setActiveTool('dimension' as any);
    setShowDimPanel(false);
  };

  return (
    <>
      <nav aria-label="Drawing Tools" className="flex flex-col items-center gap-0.5 px-1 py-2 w-10 bg-[#141416] border-r border-panel-border shrink-0 relative z-30">

        {/* Regular tools */}
        {tools.map((tool) => (
          <React.Fragment key={tool.type}>
            {/* Divider after navigation/manipulation tools */}
            {tool.type === 'line' && <div className="w-6 h-px bg-panel-border my-1" />}
            <button
              onClick={() => {
                setActiveTool(tool.type as any);
                setShowDimPanel(false);
              }}
              title={`${tool.label} [${tool.shortcut}]`}
              aria-label={`${tool.label} tool, shortcut ${tool.shortcut}`}
              className={`w-8 h-8 flex items-center justify-center rounded transition-all cursor-pointer
                ${activeTool === tool.type
                  ? 'bg-zinc-700 text-white shadow-sm ring-1 ring-zinc-500'
                  : 'text-slate-400 hover:text-white hover:bg-panel-hover'
                }`}
            >
              <span aria-hidden="true">{tool.icon}</span>
            </button>
          </React.Fragment>
        ))}

        {/* Divider before dimension */}
        <div className="w-6 h-px bg-panel-border my-1" />

        {/* Dimension / Ruler button */}
        <button
          onClick={handleDimClick}
          title="Dimension Tool [D] — Click to set units"
          aria-label="Dimension Tool, shortcut D — Click to set units"
          className={`w-8 h-8 flex items-center justify-center rounded transition-all cursor-pointer relative
            ${activeTool === 'dimension'
              ? 'bg-zinc-700 text-white shadow-sm ring-1 ring-zinc-500'
              : showDimPanel
              ? 'bg-panel-hover text-zinc-200 border border-zinc-500/50'
              : 'text-slate-400 hover:text-white hover:bg-panel-hover'
            }`}
        >
          <Ruler size={15} aria-hidden="true" />
          <span className="absolute -bottom-0.5 -right-0.5 text-[6px] font-bold text-accent-green bg-[#18181b] px-0.5 rounded leading-none" aria-hidden="true">
            {UNITS[unit].shortLabel}
          </span>
        </button>
      </nav>

      {/* Dimension settings panel */}
      {showDimPanel && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setShowDimPanel(false)} />
          <div
            className="fixed left-10 z-30 bg-panel-bg border border-panel-border rounded-r-xl shadow-2xl w-72 overflow-hidden"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
          >
            <div className="flex items-center justify-between px-3 py-2.5 bg-[#141416] border-b border-panel-border">
              <div className="flex items-center gap-2">
                <Ruler size={13} className="text-zinc-300" />
                <div>
                  <p className="text-xs font-bold text-white">Dimension Settings</p>
                  <p className="text-[9px] text-slate-500">Select unit before drawing</p>
                </div>
              </div>
              <button onClick={() => setShowDimPanel(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={13} />
              </button>
            </div>

            <div className="p-3 space-y-4">
              {/* Unit selection */}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Measurement Unit
                </p>
                {UNIT_GROUPS.map((group) => (
                  <div key={group.label} className="mb-2">
                    <p className="text-[9px] text-slate-600 mb-1 uppercase tracking-wider">{group.label}</p>
                    <div className="grid grid-cols-4 gap-1">
                      {group.units.map((u) => (
                        <button
                          key={u}
                          onClick={() => setUnit(u)}
                          className={`relative py-1.5 rounded text-[11px] font-mono font-bold transition-all border
                            ${unit === u
                              ? 'bg-accent-blue text-white border-accent-blue'
                              : 'bg-panel-hover text-slate-400 border-panel-border hover:text-white'
                            }`}
                        >
                          {unit === u && <Check size={7} className="absolute top-0.5 right-0.5 text-white" />}
                          <div>{UNITS[u].shortLabel}</div>
                          <div className="text-[7px] opacity-60 font-normal">{UNITS[u].label.split('s')[0]}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Scale selection */}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Drawing Scale
                </p>
                <div className="grid grid-cols-4 gap-1">
                  {SCALES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setScale(s.value)}
                      className={`relative py-1.5 rounded text-[10px] font-mono font-bold transition-all border
                        ${scale === s.value
                          ? 'bg-zinc-700 text-white border-zinc-500 shadow-sm'
                          : 'bg-panel-hover text-slate-400 border-panel-border hover:text-white'
                        }`}
                    >
                      {scale === s.value && <Check size={7} className="absolute top-0.5 right-0.5 text-white" />}
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live preview */}
              <div className="bg-[#18181b] rounded-lg p-2.5 border border-panel-border">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1.5">Live preview</p>
                <div className="space-y-1">
                  {[50, 100, 500, 1000].map((px) => (
                    <div key={px} className="flex justify-between text-[10px] font-mono">
                      <span className="text-slate-600">{px}px =</span>
                      <span className="text-accent-green font-bold">{formatDistance(px)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Start button */}
              <button
                onClick={handleStartDimension}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white text-sm font-bold transition-all shadow-sm cursor-pointer"
              >
                <Ruler size={14} />
                Start Drawing Dimensions
              </button>

              <p className="text-center text-[10px] text-slate-600">
                Unit: <span className="text-slate-400">{UNITS[unit].label}</span>
                {' · '}Scale: <span className="text-slate-400">1:{scale}</span>
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
};