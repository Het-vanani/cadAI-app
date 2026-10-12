import React, { useState, useRef } from 'react';
import { Sparkles, Send, Loader2, X } from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useToolStore } from '../../store/useToolStore';

const EXAMPLES = [
  'Draw a 200x100 rectangle',
  'Draw a circle with radius 50',
  'Draw a 10x8 room with a door and 2 windows',
  'Draw a triangle',
  'Draw 3 parallel horizontal lines',
  'Draw a floor plan with 2 rooms',
];

const parseAIShapes = (json: any[], activeLayerId: string, strokeColor: string, strokeWidth: number) => {
  const generateId = () => `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return json.map((item: any) => {
    const base = {
      id: generateId(),
      layerId: activeLayerId,
      stroke: item.stroke || strokeColor,
      strokeWidth: item.strokeWidth || strokeWidth,
      fill: item.fill || 'transparent',
      opacity: 1,
      rotation: 0,
      isSelected: false,
      isLocked: false,
      isVisible: true,
      label: item.label || '',
    };

    switch (item.type) {
      case 'rectangle':
        return {
          ...base, type: 'rectangle',
          x: item.x ?? 100, y: item.y ?? 100,
          width: item.width ?? 100, height: item.height ?? 80,
          points: [], radius: 0,
        };
      case 'circle':
        return {
          ...base, type: 'circle',
          x: (item.cx ?? 200) - (item.radius ?? 50),
          y: (item.cy ?? 200) - (item.radius ?? 50),
          width: (item.radius ?? 50) * 2,
          height: (item.radius ?? 50) * 2,
          radius: item.radius ?? 50,
          points: [],
        };
      case 'line':
        return {
          ...base, type: 'line',
          points: [
            { x: item.x1 ?? 100, y: item.y1 ?? 100 },
            { x: item.x2 ?? 200, y: item.y2 ?? 100 },
          ],
          x: item.x1 ?? 100, y: item.y1 ?? 100,
          width: Math.abs((item.x2 ?? 200) - (item.x1 ?? 100)),
          height: Math.abs((item.y2 ?? 100) - (item.y1 ?? 100)),
          radius: 0,
        };
      case 'ellipse':
        return {
          ...base, type: 'ellipse',
          x: (item.cx ?? 200) - (item.rx ?? 60),
          y: (item.cy ?? 200) - (item.ry ?? 40),
          width: (item.rx ?? 60) * 2,
          height: (item.ry ?? 40) * 2,
          radius: 0, points: [],
        };
      default:
        return null;
    }
  }).filter(Boolean);
};

// ── Demo shapes based on what user typed ──
const getDemoShapes = (text: string) => {
  const t = text.toLowerCase();

  if (t.includes('room') || t.includes('floor plan')) {
    return [
      { type: 'rectangle', x: 200, y: 150, width: 300, height: 200 },
      { type: 'line', x1: 200, y1: 310, x2: 240, y2: 310 },
      { type: 'rectangle', x: 260, y: 155, width: 40, height: 8 },
      { type: 'rectangle', x: 380, y: 155, width: 40, height: 8 },
    ];
  }
  if (t.includes('circle')) {
    const r = parseInt(t.match(/\d+/)?.[0] ?? '60');
    return [{ type: 'circle', cx: 400, cy: 300, radius: r }];
  }
  if (t.includes('triangle')) {
    return [
      { type: 'line', x1: 400, y1: 180, x2: 300, y2: 360 },
      { type: 'line', x1: 300, y1: 360, x2: 500, y2: 360 },
      { type: 'line', x1: 500, y1: 360, x2: 400, y2: 180 },
    ];
  }
  if (t.includes('parallel') || t.includes('lines')) {
    return [
      { type: 'line', x1: 200, y1: 240, x2: 600, y2: 240 },
      { type: 'line', x1: 200, y1: 300, x2: 600, y2: 300 },
      { type: 'line', x1: 200, y1: 360, x2: 600, y2: 360 },
    ];
  }
  if (t.includes('ellipse')) {
    return [{ type: 'ellipse', cx: 400, cy: 300, rx: 150, ry: 80 }];
  }

  // Default — rectangle with parsed dimensions
  const nums = t.match(/\d+/g)?.map(Number) ?? [];
  const w = nums[0] ?? 200;
  const h = nums[1] ?? 150;
  return [{ type: 'rectangle', x: 400 - w / 2, y: 300 - h / 2, width: w, height: h }];
};

export const AIPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { addShape, activeLayerId } = useCanvasStore();
  const { strokeColor, strokeWidth } = useToolStore();

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError('');
    setLastResult('');

    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

      // DEMO MODE — active if no API key is set or using placeholder
      const DEMO_MODE = !apiKey || !apiKey.trim() || apiKey.includes('your_anthropic');

      if (DEMO_MODE) {
        // Simulate a small delay so it feels real
        await new Promise((r) => setTimeout(r, 800));
        const demoShapes = getDemoShapes(prompt);
        const cadShapes = parseAIShapes(demoShapes, activeLayerId, strokeColor, strokeWidth);
        cadShapes.forEach((shape: any) => addShape(shape));
        setLastResult(`✓ Demo: Added ${cadShapes.length} shape${cadShapes.length !== 1 ? 's' : ''} to canvas`);
        setPrompt('');
        setIsLoading(false);
        return;
      }
      // ── END DEMO MODE ──

      const systemPrompt = `You are a CAD drawing assistant. Convert the user's description into canvas shapes.
Respond with ONLY a valid JSON array. No explanation, no markdown, no backticks.
Canvas is 800x600. Center drawings around x:400, y:300.
Scale: 1 meter = 20 pixels.

Shape formats:
- Rectangle: {"type":"rectangle","x":100,"y":100,"width":200,"height":150}
- Circle: {"type":"circle","cx":300,"cy":300,"radius":80}
- Line: {"type":"line","x1":100,"y1":100,"x2":300,"y2":100}
- Ellipse: {"type":"ellipse","cx":300,"cy":300,"rx":100,"ry":60}

Example for "Draw a 200x100 rectangle":
[{"type":"rectangle","x":300,"y":250,"width":200,"height":100}]`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errBody?.error?.message ?? response.statusText}`);
      }

      const data = await response.json();
      const text = data.content?.[0]?.text ?? '';
      const clean = text.replace(/```json|```/g, '').trim();

      let shapes;
      try {
        shapes = JSON.parse(clean);
      } catch {
        throw new Error(`AI returned invalid JSON: ${clean.slice(0, 100)}`);
      }

      if (!Array.isArray(shapes)) throw new Error(`Expected array, got: ${typeof shapes}`);

      const cadShapes = parseAIShapes(shapes, activeLayerId, strokeColor, strokeWidth);
      cadShapes.forEach((shape: any) => addShape(shape));
      setLastResult(`✓ Added ${cadShapes.length} shape${cadShapes.length !== 1 ? 's' : ''} to canvas`);
      setPrompt('');

    } catch (err: any) {
      setError(`❌ ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-14 right-4 z-40 w-80">

      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }}
          aria-label="Open AI Draw assistant"
          className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 border border-zinc-500/50 transition-all rounded-full shadow-lg text-white text-sm font-medium ml-auto cursor-pointer"
        >
          <Sparkles size={15} aria-hidden="true" />
          AI Draw
        </button>
      )}

      {isOpen && (
        <div className="bg-panel-bg border border-panel-border rounded-xl shadow-2xl overflow-hidden" role="dialog" aria-label="AI Draw assistant">

          <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/80 border-b border-panel-border">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-zinc-300" aria-hidden="true" />
              <span className="text-sm font-semibold text-white">AI Draw</span>
              <span className="text-[10px] text-amber-400 bg-amber-950/40 px-1.5 rounded">DEMO</span>
            </div>
            <button onClick={() => setIsOpen(false)} aria-label="Close AI Draw panel" className="text-slate-400 hover:text-white transition-colors cursor-pointer">
              <X size={14} aria-hidden="true" />
            </button>
          </div>

          <div className="p-3 space-y-3">
            <textarea
              ref={inputRef}
              value={prompt}
              aria-label="AI Draw prompt description"
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder="Describe what to draw...&#10;e.g. Draw a 10x8 room with a door"
              rows={3}
              className="w-full bg-[#18181b] border border-panel-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-zinc-500 transition-colors resize-none placeholder-zinc-500"
            />

            <button
              onClick={handleGenerate}
              aria-label="Generate shapes with AI"
              disabled={isLoading || !prompt.trim()}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all
                ${isLoading || !prompt.trim()
                  ? 'bg-panel-hover text-slate-400 cursor-not-allowed'
                  : 'bg-zinc-700 hover:bg-zinc-600 text-white shadow-sm cursor-pointer'
                }`}
            >
              {isLoading
                ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Generating...</>
                : <><Send size={14} aria-hidden="true" /> Generate</>
              }
            </button>

            {lastResult && (
              <div className="text-xs text-accent-green bg-green-950/30 rounded px-2 py-1.5">{lastResult}</div>
            )}
            {error && (
              <div className="text-xs text-red-400 bg-red-950/30 rounded px-2 py-1.5">{error}</div>
            )}

            <div>
              <p className="text-xs text-slate-600 mb-1.5 uppercase tracking-wider">Examples</p>
              <div className="space-y-1">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => { setPrompt(ex); inputRef.current?.focus(); }}
                    className="w-full text-left text-xs text-slate-500 hover:text-slate-300 hover:bg-panel-hover px-2 py-1 rounded transition-colors truncate"
                  >
                    → {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};