import React, { useState, useEffect } from 'react';
import { X, Search, Keyboard } from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'Tools' | 'Edit' | 'View' | 'File' | 'Alignment';
}

const SHORTCUTS: ShortcutItem[] = [
  // Tools
  { keys: ['V'], description: 'Select tool', category: 'Tools' },
  { keys: ['M'], description: 'Move tool', category: 'Tools' },
  { keys: ['H'], description: 'Pan tool (Hand)', category: 'Tools' },
  { keys: ['L'], description: 'Line tool', category: 'Tools' },
  { keys: ['R'], description: 'Rectangle tool', category: 'Tools' },
  { keys: ['C'], description: 'Circle tool', category: 'Tools' },
  { keys: ['E'], description: 'Ellipse tool', category: 'Tools' },
  { keys: ['P'], description: 'Polyline tool (Enter to finish)', category: 'Tools' },
  { keys: ['T'], description: 'Text tool', category: 'Tools' },
  { keys: ['D'], description: 'Dimension tool', category: 'Tools' },
  { keys: ['A'], description: '3-point Arc tool', category: 'Tools' },
  { keys: ['X'], description: 'Eraser tool (click any shape to erase)', category: 'Tools' },

  // Edit
  { keys: ['Ctrl', 'Z'], description: 'Undo last action', category: 'Edit' },
  { keys: ['Ctrl', 'Y'], description: 'Redo last undone action', category: 'Edit' },
  { keys: ['Ctrl', 'C'], description: 'Copy selected shapes', category: 'Edit' },
  { keys: ['Ctrl', 'V'], description: 'Paste copied shapes', category: 'Edit' },
  { keys: ['Ctrl', 'D'], description: 'Duplicate selected shapes', category: 'Edit' },
  { keys: ['Del'], description: 'Delete selected shapes', category: 'Edit' },
  { keys: ['Ctrl', 'A'], description: 'Select all shapes on canvas', category: 'Edit' },
  { keys: ['Shift', 'Click'], description: 'Multi-select multiple shapes', category: 'Edit' },
  { keys: ['Ctrl', 'G'], description: 'Group selected shapes', category: 'Edit' },
  { keys: ['Ctrl', 'Shift', 'G'], description: 'Ungroup selected shapes', category: 'Edit' },
  { keys: ['Ctrl', 'Shift', 'L'], description: 'Lock or unlock selected shapes', category: 'Edit' },
  { keys: ['Ctrl', '→'], description: 'Rotate selection 90° Clockwise', category: 'Edit' },
  { keys: ['Ctrl', '←'], description: 'Rotate selection 90° Counter-Clockwise', category: 'Edit' },
  { keys: ['Esc'], description: 'Clear selection or cancel active tool', category: 'Edit' },

  // View
  { keys: ['F'], description: 'Zoom to fit all shapes on canvas', category: 'View' },
  { keys: ['Shift', 'F'], description: 'Zoom to fit selected shapes only', category: 'View' },
  { keys: ['+'], description: 'Zoom in', category: 'View' },
  { keys: ['-'], description: 'Zoom out', category: 'View' },
  { keys: ['0'], description: 'Reset zoom to 100% (1:1)', category: 'View' },
  { keys: ['G'], description: 'Toggle grid visibility', category: 'View' },
  { keys: ['S'], description: 'Toggle snap to grid and geometry', category: 'View' },
  { keys: ['Wheel'], description: 'Zoom in / out at cursor', category: 'View' },
  { keys: ['Mid Drag'], description: 'Pan canvas with mouse wheel', category: 'View' },

  // File
  { keys: ['Ctrl', 'S'], description: 'Open Save & Export modal', category: 'File' },
  { keys: ['Ctrl', 'O'], description: 'Open existing .cadai project', category: 'File' },

  // Alignment
  { keys: ['Ribbon'], description: 'Align Left / Center H / Right', category: 'Alignment' },
  { keys: ['Ribbon'], description: 'Align Top / Center V / Bottom', category: 'Alignment' },
  { keys: ['Ribbon'], description: 'Distribute Horizontal / Vertical', category: 'Alignment' },
  { keys: ['Ribbon'], description: 'Mirror Horizontal / Vertical', category: 'Alignment' },
];

const CATEGORIES = ['All', 'Tools', 'Edit', 'View', 'File', 'Alignment'] as const;

export const KeyboardShortcutsModal: React.FC = () => {
  const show = useCanvasStore((s) => s.showShortcutsModal);
  const setShow = useCanvasStore((s) => s.setShowShortcutsModal);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

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

  const filtered = SHORTCUTS.filter((s) => {
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;
    const matchesText =
      s.description.toLowerCase().includes(query) ||
      s.keys.some((k) => k.toLowerCase().includes(query)) ||
      s.category.toLowerCase().includes(query);
    return matchesCategory && matchesText;
  });

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none"
      onClick={() => setShow(false)}
    >
      <div
        className="bg-panel-bg border border-panel-border rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-panel-border bg-[#18181b]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center border border-panel-border">
              <Keyboard size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Keyboard Shortcuts</h2>
              <p className="text-[11px] text-slate-400">Master CAD AI with quick keyboard commands</p>
            </div>
          </div>
          <button
            onClick={() => setShow(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-panel-hover transition-colors"
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filters and search */}
        <div className="p-4 border-b border-panel-border space-y-3 bg-panel-bg">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search shortcuts by name or key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18181b] border border-panel-border rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-zinc-500 transition-colors"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-md transition-colors text-xs font-medium cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-zinc-700 text-white shadow-sm'
                    : 'bg-[#27272a] text-slate-400 hover:text-white hover:bg-panel-hover'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Shortcuts table */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-panel-border/50">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No shortcuts found matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="pb-2 font-medium">Action</th>
                  <th className="pb-2 font-medium text-center w-24">Category</th>
                  <th className="pb-2 font-medium text-right w-40">Shortcut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-border/40">
                {filtered.map((item, idx) => (
                  <tr key={idx} className="hover:bg-panel-hover/50 transition-colors">
                    <td className="py-2.5 text-xs text-slate-200 font-medium">{item.description}</td>
                    <td className="py-2.5 text-center">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-panel-border/40 text-slate-400">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.keys.map((k, kIdx) => (
                          <React.Fragment key={kIdx}>
                            <kbd className="px-2 py-0.5 min-w-[22px] text-center text-[11px] font-mono font-semibold bg-[#27272a] border border-panel-border rounded text-zinc-200 shadow-sm">
                              {k}
                            </kbd>
                            {kIdx < item.keys.length - 1 && (
                              <span className="text-slate-500 text-xs">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-panel-border bg-[#18181b] flex items-center justify-between text-xs text-slate-400">
          <span>Press <kbd className="px-1.5 py-0.5 text-[10px] bg-[#27272a] border border-panel-border rounded text-slate-300">Esc</kbd> or click outside to dismiss</span>
          <span className="text-accent-green text-[11px] font-medium">{filtered.length} shortcuts</span>
        </div>
      </div>
    </div>
  );
};
