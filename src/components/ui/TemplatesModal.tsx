import React, { useState, useEffect } from 'react';
import { X, LayoutTemplate, ArrowRight, Box, Sparkles, Check } from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { STARTER_TEMPLATES, TemplateItem } from '../../data/templates';

export const TemplatesModal: React.FC = () => {
  const show = useCanvasStore((s) => s.showTemplatesModal);
  const setShow = useCanvasStore((s) => s.setShowTemplatesModal);
  const loadProject = useCanvasStore((s) => s.loadProject);
  const zoomToFit = useCanvasStore((s) => s.zoomToFit);
  const setShow3DModal = useCanvasStore((s) => s.setShow3DModal);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loadedId, setLoadedId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && show) {
        setShow(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, setShow]);

  if (!show) return null;

  const handleLoad = (template: TemplateItem, open3DImmediately = false) => {
    const project = template.getProject();
    loadProject(project);
    setLoadedId(template.id);

    setTimeout(() => {
      zoomToFit(false);
      setShow(false);
      setLoadedId(null);
      if (open3DImmediately) {
        setShow3DModal(true);
      }
    }, 250);
  };

  const categories = ['All', 'Residential', 'Commercial', 'Architecture'] as const;

  const filtered = STARTER_TEMPLATES.filter(
    (t) => selectedCategory === 'All' || t.category === selectedCategory
  );

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none"
      onClick={() => setShow(false)}
    >
      <div
        className="bg-panel-bg border border-panel-border rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-panel-border bg-[#18181b] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 text-zinc-200 border border-panel-border flex items-center justify-center shadow-inner">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Starter Floor Plans & 3D Templates
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                  Ready to Extrude
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pick a template to explore realistic 3D materials (Glass, Wood, Concrete, Metal) and multi-level heights.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShow(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-panel-hover transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-panel-border/60 bg-[#141416]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-zinc-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-panel-hover'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5 overflow-y-auto">
          {filtered.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-[#1c1c20] border border-panel-border/80 hover:border-zinc-500 rounded-xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-black/40 group"
            >
              <div>
                {/* Header Icon + Category */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{tpl.icon}</span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-panel-hover text-slate-300 border border-panel-border">
                    {tpl.category}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-sm font-bold text-white group-hover:text-zinc-200 transition-colors mb-2">
                  {tpl.name}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {tpl.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-[#18181b] border border-panel-border/50 text-center mb-4">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Rooms</span>
                    <span className="text-xs font-mono font-bold text-slate-200">{tpl.stats.rooms}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Floor Area</span>
                    <span className="text-xs font-mono font-bold text-zinc-300">{tpl.stats.area}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Elements</span>
                    <span className="text-xs font-mono font-bold text-slate-200">{tpl.stats.elements}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-panel-border/60">
                <button
                  onClick={() => handleLoad(tpl, true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                  title="Load template and launch straight into 3D view"
                >
                  <Box size={14} />
                  <span>Load & Launch 3D →</span>
                </button>

                <button
                  onClick={() => handleLoad(tpl, false)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-panel-border text-xs font-medium transition-all cursor-pointer shadow-sm"
                >
                  {loadedId === tpl.id ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span className="text-emerald-400">Loaded!</span>
                    </>
                  ) : (
                    <>
                      <span>Open in 2D Draft</span>
                      <ArrowRight size={12} />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
