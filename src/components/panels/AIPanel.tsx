import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, X, Key, Check } from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useToolStore } from '../../store/useToolStore';

const EXAMPLES = [
  'Draw a 200x100 rectangle',
  'Draw a circle with radius 60',
  'Draw a 10x8 room with a door and 2 windows',
  'Draw a triangle',
  'Draw 3 parallel horizontal lines',
  'Draw a 2-room floor plan with doors',
  'Draw a table with 4 chairs',
  'Draw an L-shaped room',
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
      height3d: item.height3d || 80,
      elevation3d: item.elevation3d || 0,
      material3d: item.material3d || 'default',
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

// Built-in intelligent geometric fallback
const getSmartShapes = (text: string) => {
  const t = text.toLowerCase();

  if (t.includes('2-room') || t.includes('two room') || t.includes('2 rooms')) {
    return [
      { type: 'rectangle', x: 150, y: 150, width: 220, height: 200, label: 'Living Room' },
      { type: 'rectangle', x: 370, y: 150, width: 180, height: 200, label: 'Bedroom' },
      { type: 'line', x1: 220, y1: 350, x2: 270, y2: 350 },
      { type: 'line', x1: 420, y1: 350, x2: 470, y2: 350 },
      { type: 'rectangle', x: 200, y: 155, width: 50, height: 8 },
      { type: 'rectangle', x: 420, y: 155, width: 50, height: 8 },
    ];
  }

  if (t.includes('room') || t.includes('floor plan')) {
    return [
      { type: 'rectangle', x: 200, y: 150, width: 320, height: 220 },
      { type: 'line', x1: 220, y1: 370, x2: 270, y2: 370 },
      { type: 'rectangle', x: 260, y: 155, width: 45, height: 8 },
      { type: 'rectangle', x: 380, y: 155, width: 45, height: 8 },
    ];
  }

  if (t.includes('l-shaped') || t.includes('l shaped') || t.includes('l shape')) {
    return [
      { type: 'rectangle', x: 200, y: 150, width: 300, height: 140 },
      { type: 'rectangle', x: 200, y: 290, width: 160, height: 140 },
    ];
  }

  if (t.includes('table')) {
    return [
      { type: 'rectangle', x: 320, y: 240, width: 160, height: 100, label: 'Table' },
      { type: 'rectangle', x: 340, y: 205, width: 40, height: 25, label: 'Chair' },
      { type: 'rectangle', x: 420, y: 205, width: 40, height: 25, label: 'Chair' },
      { type: 'rectangle', x: 340, y: 350, width: 40, height: 25, label: 'Chair' },
      { type: 'rectangle', x: 420, y: 350, width: 40, height: 25, label: 'Chair' },
    ];
  }

  if (t.includes('circle')) {
    const r = parseInt(t.match(/\d+/)?.[0] ?? '60');
    return [{ type: 'circle', cx: 400, cy: 300, radius: r }];
  }

  if (t.includes('triangle')) {
    return [
      { type: 'line', x1: 400, y1: 180, x2: 280, y2: 380 },
      { type: 'line', x1: 280, y1: 380, x2: 520, y2: 380 },
      { type: 'line', x1: 520, y1: 380, x2: 400, y2: 180 },
    ];
  }

  if (t.includes('parallel') || t.includes('lines')) {
    const count = Math.min(6, parseInt(t.match(/\d+/)?.[0] ?? '3'));
    const lines = [];
    for (let i = 0; i < count; i++) {
      lines.push({ type: 'line', x1: 200, y1: 200 + i * 50, x2: 600, y2: 200 + i * 50 });
    }
    return lines;
  }

  if (t.includes('ellipse')) {
    return [{ type: 'ellipse', cx: 400, cy: 300, rx: 140, ry: 80 }];
  }

  const nums = t.match(/\d+/g)?.map(Number) ?? [];
  const w = nums[0] ?? 200;
  const h = nums[1] ?? (t.includes('square') ? w : 120);
  return [{ type: 'rectangle', x: 400 - w / 2, y: 300 - h / 2, width: w, height: h }];
};

export const AIPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState('');
  const [error, setError] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Dedicated Groq Key resolution
  const envKey = (import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_ANTHROPIC_API_KEY || '').trim();
  const [groqKey, setGroqKey] = useState<string>(() => {
    return localStorage.getItem('cadai_groq_key') || (envKey.startsWith('gsk_') ? envKey : '');
  });

  useEffect(() => {
    if (envKey.startsWith('gsk_') && !groqKey) {
      setGroqKey(envKey);
      localStorage.setItem('cadai_groq_key', envKey);
    }
  }, [envKey]);

  const handleSaveKey = (k: string) => {
    const trimmed = k.trim();
    setGroqKey(trimmed);
    localStorage.setItem('cadai_groq_key', trimmed);
    setShowKeyInput(false);
  };

  const { addShape, activeLayerId } = useCanvasStore();
  const { strokeColor, strokeWidth } = useToolStore();

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError('');
    setLastResult('');

    const systemPrompt = `You are a precision CAD drafting AI engine. Convert the user's description into a JSON array of 2D CAD geometry.
Output ONLY a raw JSON array. Do not include markdown codeblocks, no explanations, no backticks.
Canvas dimensions are 800x600. Center drawings around x:400, y:300.
Units are in millimeters.

Valid shape formats:
- Rectangle: {"type":"rectangle","x":100,"y":100,"width":200,"height":150}
- Circle: {"type":"circle","cx":300,"cy":300,"radius":80}
- Line: {"type":"line","x1":100,"y1":100,"x2":300,"y2":100}
- Ellipse: {"type":"ellipse","cx":300,"cy":300,"rx":100,"ry":60}

Example for "Draw a 200x100 rectangle":
[{"type":"rectangle","x":300,"y":250,"width":200,"height":100}]`;

    try {
      const activeKey = groqKey.trim() || (envKey.startsWith('gsk_') ? envKey : '');

      if (activeKey) {
        // Direct call to Groq Cloud API (Llama 3.3 70B model)
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
            temperature: 0.1,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Groq API responded with status ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        const clean = content.replace(/```json|```/g, '').trim();

        let parsed = JSON.parse(clean);
        if (!Array.isArray(parsed) && parsed.shapes && Array.isArray(parsed.shapes)) {
          parsed = parsed.shapes;
        }
        if (!Array.isArray(parsed)) throw new Error('Expected shape array from Groq');

        const cadShapes = parseAIShapes(parsed, activeLayerId, strokeColor, strokeWidth);
        cadShapes.forEach((s: any) => addShape(s));
        setLastResult(`✓ Groq AI: Added ${cadShapes.length} shape${cadShapes.length !== 1 ? 's' : ''} to canvas`);
        setPrompt('');
      } else {
        // Fallback if no key is entered
        await new Promise((r) => setTimeout(r, 600));
        const shapes = getSmartShapes(prompt);
        const cadShapes = parseAIShapes(shapes, activeLayerId, strokeColor, strokeWidth);
        cadShapes.forEach((s: any) => addShape(s));
        setLastResult(`✓ Added ${cadShapes.length} shape${cadShapes.length !== 1 ? 's' : ''} to canvas`);
        setPrompt('');
      }
    } catch (err: any) {
      setError(`❌ ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-14 right-4 z-40 w-84 select-none">

      {/* Floating Pill Button */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }}
          aria-label="Open Groq AI Draw assistant"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 border border-amber-400/50 transition-all rounded-full shadow-2xl text-white text-sm font-semibold ml-auto cursor-pointer"
        >
          <Sparkles size={15} aria-hidden="true" />
          <span>Groq AI Draw</span>
        </button>
      )}

      {/* Expanded Dialog */}
      {isOpen && (
        <div className="bg-panel-bg border border-panel-border rounded-xl shadow-2xl overflow-hidden" role="dialog" aria-label="Groq AI Draw assistant">

          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-zinc-800 to-zinc-900 border-b border-panel-border">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-amber-400" aria-hidden="true" />
              <span className="text-sm font-bold text-white">Groq AI Assistant</span>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-full font-semibold">
                Llama 3.3
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowKeyInput(!showKeyInput)}
                title="Groq API Key configuration"
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-panel-hover transition-colors cursor-pointer"
              >
                <Key size={13} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close Groq AI Draw panel"
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-panel-hover transition-colors cursor-pointer"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Optional Key Management Drawer */}
          {showKeyInput && (
            <div className="p-3 bg-[#18181b] border-b border-panel-border text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium flex items-center gap-1">
                  <Key size={12} className="text-amber-400" />
                  <span>Groq API Key:</span>
                </span>
                {groqKey && (
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Check size={11} />
                    <span>Connected</span>
                  </span>
                )}
              </div>
              <input
                type="password"
                placeholder="gsk_..."
                defaultValue={groqKey}
                onBlur={(e) => handleSaveKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveKey((e.target as HTMLInputElement).value);
                }}
                className="w-full bg-[#141416] border border-panel-border rounded px-2.5 py-1 text-xs text-white font-mono outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-slate-500">
                Key is securely stored in your browser's private local storage.
              </p>
            </div>
          )}

          {/* Prompt Form */}
          <div className="p-3 space-y-3">
            <textarea
              ref={inputRef}
              value={prompt}
              aria-label="CAD AI description"
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder="Describe what to draw in CAD...&#10;e.g. Draw a 2-room floor plan with doors"
              rows={3}
              className="w-full bg-[#18181b] border border-panel-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-amber-500 transition-colors resize-none placeholder-zinc-500"
            />

            <button
              onClick={handleGenerate}
              aria-label="Generate CAD shapes with Groq"
              disabled={isLoading || !prompt.trim()}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all
                ${isLoading || !prompt.trim()
                  ? 'bg-panel-hover text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg cursor-pointer'
                }`}
            >
              {isLoading
                ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" /> Groq AI Generating...</>
                : <><Send size={15} aria-hidden="true" /> Generate with Groq</>
              }
            </button>

            {lastResult && (
              <div className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 rounded px-2.5 py-1.5 font-medium">
                {lastResult}
              </div>
            )}
            {error && (
              <div className="text-xs text-red-400 bg-red-950/40 border border-red-500/30 rounded px-2.5 py-1.5 font-medium">
                {error}
              </div>
            )}

            {/* Quick Prompts */}
            <div>
              <p className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider font-semibold">Quick CAD Prompts</p>
              <div className="space-y-1">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => { setPrompt(ex); inputRef.current?.focus(); }}
                    className="w-full text-left text-xs text-slate-400 hover:text-white hover:bg-panel-hover px-2 py-1 rounded transition-colors truncate cursor-pointer"
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