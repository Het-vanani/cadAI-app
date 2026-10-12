import React, { useState } from 'react';
    
import {
  Eye, EyeOff, Lock, Unlock, Plus,
  Trash2, Layers
} from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';

export const LayersPanel: React.FC = () => {
  const {
    layers, activeLayerId,
    addLayer, setActiveLayer,
    toggleLayerVisibility,
  } = useCanvasStore();

  // Track which layer name is being edited
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const commitRename = (id: string) => {
    if (editingName.trim()) {
      useCanvasStore.setState((state) => ({
        layers: state.layers.map((l) =>
          l.id === id ? { ...l, name: editingName.trim() } : l
        ),
      }));
    }
    setEditingId(null);
  };

  const toggleLock = (id: string) => {
    useCanvasStore.setState((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, isLocked: !l.isLocked } : l
      ),
    }));
  };

  const deleteLayer = (id: string) => {
    // Must always keep at least 1 layer
    if (layers.length <= 1) return;
    useCanvasStore.setState((state) => {
      const remaining = state.layers.filter((l) => l.id !== id);
      return {
        layers: remaining,
        // If we deleted the active layer, switch to first remaining
        activeLayerId: state.activeLayerId === id
          ? remaining[0].id
          : state.activeLayerId,
      };
    });
  };

  const changeLayerColor = (id: string, color: string) => {
    useCanvasStore.setState((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, color } : l
      ),
    }));
  };

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-panel-border">
        <div className="flex items-center gap-2">
          <Layers size={13} className="text-slate-500" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Layers
          </span>
        </div>
        <button
          onClick={addLayer}
          title="Add new layer"
          aria-label="Add new layer"
          className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-panel-hover transition-colors cursor-pointer"
        >
          <Plus size={13} aria-hidden="true" />
        </button>
      </div>

      {/* Layer list — newest on top */}
      <div className="flex-1 overflow-y-auto">
        {[...layers].reverse().map((layer) => {
          const isActive = layer.id === activeLayerId;
          const shapeCount = layer.shapes.length;

          return (
            <div
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`group flex items-center gap-2 px-2 py-2 cursor-pointer border-b border-panel-border/50 transition-colors
                ${isActive
                  ? 'bg-zinc-800/60 border-l-2 border-l-zinc-400'
                  : 'hover:bg-panel-hover border-l-2 border-l-transparent'
                }`}
            >
              {/* Layer color dot */}
              <input
                type="color"
                value={layer.color}
                onChange={(e) => changeLayerColor(layer.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                title="Layer color"
                aria-label={`Color for layer ${layer.name}`}
                className="w-3 h-3 rounded-full cursor-pointer border-0 bg-transparent p-0 shrink-0"
                style={{ accentColor: layer.color }}
              />

              {/* Layer name — double click to rename */}
              <div className="flex-1 min-w-0">
                {editingId === layer.id ? (
                  <input
                    autoFocus
                    value={editingName}
                    aria-label={`Edit name for layer ${layer.name}`}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => commitRename(layer.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename(layer.id);
                      if (e.key === 'Escape') setEditingId(null);
                      e.stopPropagation();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-[#18181b] border border-zinc-500 rounded px-1 text-xs text-white outline-none"
                  />
                ) : (
                  <div
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startRename(layer.id, layer.name);
                    }}
                    className="flex items-center gap-1"
                  >
                    <span className={`text-xs truncate ${isActive ? 'text-white font-medium' : 'text-slate-300'}`}>
                      {layer.name}
                    </span>
                    {shapeCount > 0 && (
                      <span className="text-[10px] text-zinc-400 shrink-0">
                        ({shapeCount})
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons — show on hover */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">

                {/* Visibility toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
                  title={layer.isVisible ? 'Hide layer' : 'Show layer'}
                  aria-label={layer.isVisible ? `Hide layer ${layer.name}` : `Show layer ${layer.name}`}
                  className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-panel-border transition-colors cursor-pointer"
                >
                  {layer.isVisible
                    ? <Eye size={11} aria-hidden="true" />
                    : <EyeOff size={11} className="text-zinc-500" aria-hidden="true" />
                  }
                </button>

                {/* Lock toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLock(layer.id); }}
                  title={layer.isLocked ? 'Unlock layer' : 'Lock layer'}
                  aria-label={layer.isLocked ? `Unlock layer ${layer.name}` : `Lock layer ${layer.name}`}
                  className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-panel-border transition-colors cursor-pointer"
                >
                  {layer.isLocked
                    ? <Lock size={11} className="text-amber-500" aria-hidden="true" />
                    : <Unlock size={11} aria-hidden="true" />
                  }
                </button>

                {/* Delete layer */}
                {layers.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                    title="Delete layer"
                    aria-label={`Delete layer ${layer.name}`}
                    className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-red-400 hover:bg-panel-border transition-colors cursor-pointer"
                  >
                    <Trash2 size={11} aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Locked indicator */}
              {layer.isLocked && (
                <Lock size={10} className="text-amber-500 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-panel-border">
        <p className="text-[10px] text-slate-700">
          Double-click name to rename
        </p>
      </div>
    </div>
  );
};