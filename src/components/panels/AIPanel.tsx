import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, X, Settings2, Key, Check, HelpCircle } from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useToolStore } from '../../store/useToolStore';

const EXAMPLES = [
  'Draw a 200x100 rectangle',
  'Draw a circle with radius 60',
  'Draw a 10x8 room with a door and 2 windows',
  'Draw a triangle',
  'Draw 3 parallel horizontal lines',
  'Draw a 2-room floor plan',
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

// ── Smart Free Offline Geometric Parser ──
const getSmartOfflineShapes = (text: string) => {
  const t = text.toLowerCase();

  // Floor plan / Multi-room
  if (t.includes('2-room') || t.includes('two room') || t.includes('2 rooms')) {
    return [
      { type: 'rectangle', x: 150, y: 150, width: 220, height: 200, label: 'Living Room' },
      { type: 'rectangle', x: 370, y: 150, width: 180, height: 200, label: 'Bedroom' },
      { type: 'line', x1: 220, y1: 350, x2: 270, y2: 350 }, // Door 1
      { type: 'line', x1: 420, y1: 350, x2: 470, y2: 350 }, // Door 2
      { type: 'rectangle', x: 200, y: 155, width: 50, height: 8 }, // Window
      { type: 'rectangle', x: 420, y: 155, width: 50, height: 8 }, // Window
    ];
  }

  // Single room with door and window
  if (t.includes('room') || t.includes('floor plan')) {
    return [
      { type: 'rectangle', x: 200, y: 150, width: 320, height: 220 },
      { type: 'line', x1: 220, y1: 370, x2: 270, y2: 370 }, // Door
      { type: 'rectangle', x: 260, y: 155, width: 45, height: 8 }, // Window 1
      { type: 'rectangle', x: 380, y: 155, width: 45, height: 8 }, // Window 2
    ];
  }

  // L-shaped room
  if (t.includes('l-shaped') || t.includes('l shaped') || t.includes('l shape')) {
    return [
      { type: 'rectangle', x: 200, y: 150, width: 300, height: 140 },
      { type: 'rectangle', x: 200, y: 290, width: 160, height: 140 },
    ];
  }

  // Table with chairs
  if (t.includes('table')) {
    return [
      { type: 'rectangle', x: 320, y: 240, width: 160, height: 100, label: 'Table' },
      { type: 'rectangle', x: 340, y: 205, width: 40, height: 25, label: 'Chair' },
      { type: 'rectangle', x: 420, y: 205, width: 40, height: 25, label: 'Chair' },
      { type: 'rectangle', x: 340, y: 350, width: 40, height: 25, label: 'Chair' },
      { type: 'rectangle', x: 420, y: 350, width: 40, height: 25, label: 'Chair' },
    ];
  }

  // Circle
  if (t.includes('circle')) {
    const r = parseInt(t.match(/\d+/)?.[0] ?? '60');
    return [{ type: 'circle', cx: 400, cy: 300, radius: r }];
  }

  // Triangle
  if (t.includes('triangle')) {
    return [
      { type: 'line', x1: 400, y1: 180, x2: 280, y2: 380 },
      { type: 'line', x1: 280, y1: 380, x2: 520, y2: 380 },
      { type: 'line', x1: 520, y1: 380, x2: 400, y2: 180 },
    ];
  }

  // Parallel lines
  if (t.includes('parallel') || t.includes('lines')) {
    const count = Math.min(6, parseInt(t.match(/\d+/)?.[0] ?? '3'));
    const lines = [];
    for (let i = 0; i < count; i++) {
      lines.push({ type: 'line', x1: 200, y1: 200 + i * 50, x2: 600, y2: 200 + i * 50 });
    }
    return lines;
  }

  // Ellipse
  if (t.includes('ellipse')) {
    return [{ type: 'ellipse', cx: 400, cy: 300, rx: 140, ry: 80 }];
  }

  // Rectangle / Square with parsed numbers (e.g. 200x100 or 150 by 80)
  const nums = t.match(/\d+/g)?.map(Number) ?? [];
  const w = nums[0] ?? 200;
  const h = nums[1] ?? (t.includes('square') ? w : 120);
  return [{ type: 'rectangle', x: 400 - w / 2, y: 300 - h / 2, width: w, height: h }];
};

export const AIPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Read all potential sources from Vite env
  const envGroq = (import.meta.env.VITE_GROQ_API_KEY || '').trim();
  const envGemini = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  const envAnthropic = (import.meta.env.VITE_ANTHROPIC_API_KEY || '').trim();

  // Smart detect: if user entered a gsk_ key under Anthropic or Groq, route to Groq
  const initialGroq = localStorage.getItem('cadai_groq_key') ||
    (envGroq.startsWith('gsk_') ? envGroq : (envAnthropic.startsWith('gsk_') ? envAnthropic : envGroq));
  const initialGemini = localStorage.getItem('cadai_gemini_key') ||
    (envGemini.startsWith('AIzaSy') ? envGemini : (envAnthropic.startsWith('AIzaSy') ? envAnthropic : envGemini));
  const initialAnthropic = localStorage.getItem('cadai_anthropic_key') ||
    (envAnthropic.startsWith('sk-ant') ? envAnthropic : '');

  const [geminiKey, setGeminiKey] = useState<string>(initialGemini);
  const [groqKey, setGroqKey] = useState<string>(initialGroq);
  const [anthropicKey, setAnthropicKey] = useState<string>(initialAnthropic);
  const [activeProvider, setActiveProvider] = useState<'offline' | 'gemini' | 'groq' | 'anthropic'>('offline');

  // Auto-detect best available provider on mount and whenever keys change
  useEffect(() => {
    const gKey = groqKey.trim();
    const gemKey = geminiKey.trim();
    const antKey = anthropicKey.trim();

    if (gKey && (gKey.startsWith('gsk_') || !gKey.includes('your_'))) {
      setActiveProvider('groq');
    } else if (gemKey && (gemKey.startsWith('AIzaSy') || !gemKey.includes('your_'))) {
      setActiveProvider('gemini');
    } else if (antKey && (antKey.startsWith('sk-ant') || !antKey.includes('your_'))) {
      setActiveProvider('anthropic');
    } else {
      setActiveProvider('offline');
    }
  }, [geminiKey, groqKey, anthropicKey]);

  const saveKeys = (g: string, gr: string, a: string) => {
    setGeminiKey(g);
    localStorage.setItem('cadai_gemini_key', g);
    setGroqKey(gr);
    localStorage.setItem('cadai_groq_key', gr);
    setAnthropicKey(a);
    localStorage.setItem('cadai_anthropic_key', a);
  };

  const { addShape, activeLayerId } = useCanvasStore();
  const { strokeColor, strokeWidth } = useToolStore();

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError('');
    setLastResult('');

    const systemPrompt = `You are a precision CAD drawing engine. Convert the user's description into a JSON array of 2D CAD geometry.
Output ONLY a valid raw JSON array. No explanations, no markdown codeblocks.
Canvas dimensions are 800x600. Center drawings around x:400, y:300.
Units are in millimeters.

Valid shape types:
- Rectangle: {"type":"rectangle","x":100,"y":100,"width":200,"height":150}
- Circle: {"type":"circle","cx":300,"cy":300,"radius":80}
- Line: {"type":"line","x1":100,"y1":100,"x2":300,"y2":100}
- Ellipse: {"type":"ellipse","cx":300,"cy":300,"rx":100,"ry":60}

Example:
[{"type":"rectangle","x":300,"y":250,"width":200,"height":100}]`;

    try {
      let rawJson = '';

      // ── 1. GOOGLE GEMINI (100% FREE from aistudio.google.com) ──
      if (activeProvider === 'gemini' && geminiKey.trim()) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey.trim()}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `${systemPrompt}\n\nDraw this request: ${prompt}` }]
            }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(`Gemini API error: ${errData?.error?.message || res.statusText}`);
        }
        const data = await res.json();
        rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }

      // ── 2. GROQ (100% FREE from console.groq.com) ──
      else if (activeProvider === 'groq' && groqKey.trim()) {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey.trim()}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" }
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(`Groq API error: ${errData?.error?.message || res.statusText}`);
        }
        const data = await res.json();
        rawJson = data.choices?.[0]?.message?.content || '';
      }

      // ── 3. ANTHROPIC CLAUDE ──
      else if (activeProvider === 'anthropic' && anthropicKey.trim()) {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey.trim(),
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

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(`Anthropic error: ${errData?.error?.message || res.statusText}`);
        }
        const data = await res.json();
        rawJson = data.content?.[0]?.text || '';
      }

      // ── 4. SMART FREE OFFLINE PARSER (Zero API Key Required) ──
      else {
        await new Promise((r) => setTimeout(r, 600));
        const shapes = getSmartOfflineShapes(prompt);
        const cadShapes = parseAIShapes(shapes, activeLayerId, strokeColor, strokeWidth);
        cadShapes.forEach((s: any) => addShape(s));
        setLastResult(`✓ Offline Engine: Created ${cadShapes.length} shape${cadShapes.length !== 1 ? 's' : ''}`);
        setPrompt('');
        setIsLoading(false);
        return;
      }

      // Parse JSON from API response
      const clean = rawJson.replace(/```json|```/g, '').trim();
      let parsed = JSON.parse(clean);
      if (!Array.isArray(parsed) && parsed.shapes && Array.isArray(parsed.shapes)) {
        parsed = parsed.shapes;
      }
      if (!Array.isArray(parsed)) throw new Error('Expected array of shapes from AI');

      const cadShapes = parseAIShapes(parsed, activeLayerId, strokeColor, strokeWidth);
      cadShapes.forEach((s: any) => addShape(s));
      setLastResult(`✓ ${activeProvider.toUpperCase()}: Generated ${cadShapes.length} shape${cadShapes.length !== 1 ? 's' : ''}`);
      setPrompt('');

    } catch (err: any) {
      setError(`❌ ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-14 right-4 z-40 w-84 select-none">

      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }}
          aria-label="Open AI Draw assistant"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 border border-zinc-500/50 transition-all rounded-full shadow-xl text-white text-sm font-medium ml-auto cursor-pointer"
        >
          <Sparkles size={15} className="text-amber-400" aria-hidden="true" />
          <span>AI Draw</span>
          <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
            {activeProvider}
          </span>
        </button>
      )}

      {isOpen && (
        <div className="bg-panel-bg border border-panel-border rounded-xl shadow-2xl overflow-hidden" role="dialog" aria-label="AI Draw assistant">

          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/90 border-b border-panel-border">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400" aria-hidden="true" />
              <span className="text-sm font-semibold text-white">AI Draw Assistant</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase">
                {activeProvider}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowConfig(!showConfig)}
                title="AI Provider Settings (Free Google Gemini / Groq / Offline)"
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-panel-hover transition-colors cursor-pointer"
              >
                <Settings2 size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close AI Draw panel"
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-panel-hover transition-colors cursor-pointer"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Settings Drawer (Free Gemini / Groq / Offline switch) */}
          {showConfig && (
            <div className="p-3 bg-[#18181b] border-b border-panel-border text-xs space-y-2.5 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Key size={12} className="text-zinc-400" />
                  <span>Choose AI Engine:</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">100% Free Available</span>
              </div>

              {/* Provider Selection */}
              <div className="grid grid-cols-4 gap-1">
                {(['offline', 'gemini', 'groq', 'anthropic'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setActiveProvider(p)}
                    className={`py-1 px-1 rounded text-[10px] font-medium uppercase transition-all border cursor-pointer ${
                      activeProvider === p
                        ? 'bg-zinc-700 text-white border-zinc-500 shadow-sm'
                        : 'bg-[#27272a] text-slate-400 border-panel-border hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Free Gemini Key Input */}
              {activeProvider === 'gemini' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-300">Google Gemini API Key:</span>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[9px] text-blue-400 hover:underline"
                    >
                      Get Free Key (No Credit Card) →
                    </a>
                  </div>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={geminiKey}
                    onChange={(e) => saveKeys(e.target.value, groqKey, anthropicKey)}
                    className="w-full bg-[#141416] border border-panel-border rounded px-2 py-1 text-xs text-white font-mono outline-none focus:border-zinc-500"
                  />
                </div>
              )}

              {/* Free Groq Key Input */}
              {activeProvider === 'groq' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-300">Groq API Key (Llama 3):</span>
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[9px] text-blue-400 hover:underline"
                    >
                      Get Free Key →
                    </a>
                  </div>
                  <input
                    type="password"
                    placeholder="gsk_..."
                    value={groqKey}
                    onChange={(e) => saveKeys(geminiKey, e.target.value, anthropicKey)}
                    className="w-full bg-[#141416] border border-panel-border rounded px-2 py-1 text-xs text-white font-mono outline-none focus:border-zinc-500"
                  />
                </div>
              )}

              {/* Offline Mode Hint */}
              {activeProvider === 'offline' && (
                <p className="text-[10px] text-slate-400 leading-relaxed bg-[#202024] p-2 rounded border border-panel-border/60">
                  ⚡ <strong>Built-in Offline Engine:</strong> Works completely offline with zero API keys and $0 cost. Supports rooms, floor plans, circles, rectangles, triangles, tables, and parallel lines.
                </p>
              )}
            </div>
          )}

          {/* Prompt Form */}
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
              placeholder="Describe what to draw...&#10;e.g. Draw a 2-room floor plan with doors"
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
                    className="w-full text-left text-xs text-slate-500 hover:text-slate-300 hover:bg-panel-hover px-2 py-1 rounded transition-colors truncate cursor-pointer"
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