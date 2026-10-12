import React, { useState } from 'react';
import { Settings, Check, X } from 'lucide-react';
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

export const UnitSelector: React.FC = () => {
  const { unit, scale, setUnit, setScale, formatDistance } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Change units and drawing scale"
        aria-label={`Current unit is ${UNITS[unit].label}, scale 1:${scale}. Click to change.`}
        className="flex items-center gap-1 px-2 h-5 rounded text-[10px]
          bg-zinc-800 hover:bg-zinc-700 border border-zinc-600/50
          transition-colors text-zinc-300 hover:text-white font-mono shadow-sm cursor-pointer"
      >
        <Settings size={9} aria-hidden="true" />
        <span className="font-bold">{UNITS[unit].shortLabel}</span>
        <span className="opacity-60">1:{scale}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-label="Units and scale settings">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsOpen(false)} />
          <div className="relative bg-panel-bg border border-panel-border rounded-xl shadow-2xl w-96 z-10 overflow-hidden">

            <div className="flex items-center justify-between px-4 py-3 bg-[#141416] border-b border-panel-border">
              <div className="flex items-center gap-2">
                <Settings size={14} className="text-zinc-300" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-white">Units & Scale</p>
                  <p className="text-[10px] text-zinc-400">Civil engineering measurements</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} aria-label="Close units dialog" className="text-slate-400 hover:text-white cursor-pointer">
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {UNIT_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">{group.label}</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {group.units.map((u) => (
                      <button
                        key={u}
                        onClick={() => setUnit(u)}
                        className={`relative py-2 rounded-lg text-xs font-mono font-bold transition-all border
                          ${unit === u
                            ? 'bg-zinc-700 text-white border-zinc-500 shadow-sm'
                            : 'bg-panel-hover text-slate-400 border-panel-border hover:text-white'
                          }`}
                      >
                        {unit === u && <Check size={8} className="absolute top-1 right-1" />}
                        <div>{UNITS[u].shortLabel}</div>
                        <div className="text-[8px] opacity-60 font-normal">{UNITS[u].label.split(' ')[0]}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Drawing Scale</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {SCALES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setScale(s.value)}
                      className={`relative py-2 rounded-lg text-[11px] font-mono font-bold transition-all border
                        ${scale === s.value
                          ? 'bg-zinc-700 text-white border-zinc-500 shadow-sm'
                          : 'bg-panel-hover text-slate-400 border-panel-border hover:text-white'
                        }`}
                    >
                      {scale === s.value && <Check size={8} className="absolute top-1 right-1" />}
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#18181b] rounded-lg p-3 border border-panel-border">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Live preview</p>
                <div className="space-y-1">
                  {[50, 100, 500, 1000].map((px) => (
                    <div key={px} className="flex justify-between text-xs font-mono">
                      <span className="text-slate-600">{px} pixels =</span>
                      <span className="text-accent-green font-bold">{formatDistance(px)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white text-sm font-bold transition-all shadow-sm cursor-pointer"
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};