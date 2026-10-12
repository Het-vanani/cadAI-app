import React, { useState, useEffect } from 'react';
import { TopMenuBar } from '../components/toolbar/TopMenuBar';
import { LeftToolbar } from '../components/toolbar/LeftToolbar';
import { PropertiesPanel } from '../components/panels/PropertiesPanel';
import { StatusBar } from '../components/ui/StatusBar';
import { Canvas } from '../components/canvas/Canvas';
import { AIPanel } from '../components/panels/AIPanel';
import { useKeyboard } from '../hooks/useKeyboard';
import { useCanvasStore } from '../store/useCanvasStore';

export const EditorPage: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [restored, setRestored] = useState(false);
  const restoreAutosave = useCanvasStore((s) => s.restoreAutosave);

  useKeyboard();

  useEffect(() => {
    const didRestore = restoreAutosave();
    if (didRestore) setRestored(true);
  }, []);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-canvas-bg">
      <TopMenuBar />

      {restored && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-800/80 border-b border-zinc-600/50 text-xs text-zinc-300 shrink-0">
          <span>✓ Last session restored automatically</span>
          <button onClick={() => setRestored(false)} aria-label="Dismiss notification" className="hover:text-white ml-4 cursor-pointer">✕</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <LeftToolbar />
        <main role="main" aria-label="2D CAD Drafting Canvas" className="flex-1 relative overflow-hidden">
          <Canvas onMouseMove={(x, y) => setMousePos({ x, y })} />

          {/* AI panel floats over canvas */}
          <AIPanel />
        </main>
        <PropertiesPanel />
      </div>

      <StatusBar mouseX={mousePos.x} mouseY={mousePos.y} />
    </div>
  );
};