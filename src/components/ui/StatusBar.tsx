import React, { useState, useRef } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useToolStore } from '../../store/useToolStore';
import { UnitSelector } from './UnitSelector';
import { useSettingsStore } from '../../store/useSettingsStore';

interface StatusBarProps {
  mouseX?: number;
  mouseY?: number;
}

const COMMANDS: Record<string, string> = {
  'l': 'line', 'line': 'line',
  'r': 'rectangle', 'rec': 'rectangle', 'rect': 'rectangle',
  'c': 'circle', 'circle': 'circle',
  'e': 'ellipse', 'ellipse': 'ellipse',
  't': 'text', 'text': 'text',
  'v': 'select', 'select': 'select',
  'm': 'move', 'move': 'move',
  'h': 'pan', 'pan': 'pan',
  'p': 'polyline', 'polyline': 'polyline',
  'd': 'dimension', 'dim': 'dimension',
};

export const StatusBar: React.FC<StatusBarProps> = ({ mouseX = 0, mouseY = 0 }) => {
  const { zoom, snapToGrid, showGrid, layers, selectedShapeIds, toggleGrid, toggleSnap } = useCanvasStore();
  const { activeTool, setActiveTool } = useToolStore();
  const { formatDistance, unit } = useSettingsStore();

  const [command, setCommand] = useState('');
  const [lastLog, setLastLog] = useState('Welcome to CAD AI — Type a command or select a tool');
  const inputRef = useRef<HTMLInputElement>(null);

  const totalShapes = layers.flatMap((l: any) => l.shapes).length;

  const executeCommand = (cmd: string) => {
    const lower = cmd.trim().toLowerCase();
    if (!lower) return;
    if (COMMANDS[lower]) {
      setActiveTool(COMMANDS[lower] as any);
      setLastLog(`Tool: ${COMMANDS[lower].toUpperCase()}`);
    } else if (lower === 'grid') {
      toggleGrid();
      setLastLog('Grid toggled');
    } else if (lower === 'snap') {
      toggleSnap();
      setLastLog('Snap toggled');
    } else {
      setLastLog(`Unknown: "${cmd}" — Try L, R, C, E, P, T, D, M, H`);
    }
    setCommand('');
  };

  return (
    <footer role="contentinfo" className="flex flex-col shrink-0 border-t border-panel-border">

      {/* Command bar */}
      <div
        className="flex items-center gap-2 px-3 h-7 bg-[#18181b] border-t border-panel-border cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <span className="text-xs text-zinc-400 font-mono shrink-0">Command:</span>
        <span className="text-xs text-zinc-400 font-mono shrink-0 truncate max-w-xs">{lastLog}</span>
        <span className="text-zinc-500 font-mono">|</span>
        <input
          ref={inputRef}
          value={command}
          aria-label="CAD command input"
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              executeCommand(command);
            }
            if (e.key === 'Escape') {
              setCommand('');
              setActiveTool('select');
              setLastLog('ESC — Select tool');
            }
          }}
          placeholder="Type a command (L, R, C, E, P, D, T, M, H, GRID, SNAP...)"
          className="flex-1 bg-transparent text-xs text-slate-200 outline-none placeholder-zinc-500 font-mono"
        />
        <span className="text-xs text-zinc-400 font-mono capitalize shrink-0">[{activeTool}]</span>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 h-5 bg-[#141416] text-xs text-zinc-400 select-none">

        {/* Left */}
        <div className="flex items-center gap-4">
          <span>Shapes: <span className="text-slate-200 font-medium">{totalShapes}</span></span>
          {selectedShapeIds.length > 0 && (
            <span className="text-zinc-200 font-medium">{selectedShapeIds.length} selected</span>
          )}
          <span>Layers: <span className="text-slate-200 font-medium">{layers.length}</span></span>
        </div>

        {/* Center — coordinates with unit */}
        <div className="font-mono flex items-center gap-3">
          <span>
            X: <span className="text-slate-200">{formatDistance(mouseX)}</span>
          </span>
          <span>
            Y: <span className="text-slate-200">{formatDistance(mouseY)}</span>
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleGrid}
            aria-label="Toggle grid visibility"
            className={`hover:text-white transition-colors cursor-pointer ${showGrid ? 'text-accent-green font-semibold' : 'text-zinc-500'}`}
          >
            GRID
          </button>
          <button
            onClick={toggleSnap}
            aria-label="Toggle snap to grid"
            className={`hover:text-white transition-colors cursor-pointer ${snapToGrid ? 'text-accent-green font-semibold' : 'text-zinc-500'}`}
          >
            SNAP
          </button>

          {/* Unit selector */}
          <UnitSelector />

          <span className="text-zinc-500">MODEL</span>
          <span className="text-slate-200 font-mono">{Math.round(zoom * 100)}%</span>
        </div>
      </div>
    </footer>
  );
};