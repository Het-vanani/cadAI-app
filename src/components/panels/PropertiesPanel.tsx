import React, { useState } from 'react';
import { Box, Trash2 } from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useToolStore } from '../../store/useToolStore';
import { LayersPanel } from './LayersPanel';

type Tab = 'properties' | 'layers';

export const PropertiesPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('properties');
  const { selectedShapeIds, layers, updateShape, deleteShape } = useCanvasStore();
  const {
    strokeColor, fillColor, strokeWidth, opacity,
    setStrokeColor, setFillColor, setStrokeWidth, setOpacity,
  } = useToolStore();

  const allShapes = layers.flatMap((l) => l.shapes);
  const selectedShape = allShapes.find((s) => selectedShapeIds.includes(s.id));
  const isClosedShape = selectedShape && ['rectangle', 'circle', 'ellipse'].includes(selectedShape.type);
  const currentShapeFill = selectedShape?.fill ?? 'transparent';
  const isNoFill = currentShapeFill === 'transparent';

  return (
    <aside aria-label="Properties and Layers Panel" className="w-56 bg-panel-bg border-l border-panel-border flex flex-col shrink-0 select-none">

      {/* Tab switcher */}
      <div className="flex border-b border-panel-border shrink-0" role="tablist">
        {(['properties', 'layers'] as Tab[]).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            aria-label={`${tab} tab`}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors cursor-pointer
              ${activeTab === tab
                ? 'text-white border-b-2 border-zinc-400 bg-[#18181b]'
                : 'text-zinc-400 hover:text-slate-200'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Properties tab ── */}
        {activeTab === 'properties' && (
          <>
            {selectedShape ? (
              <div className="p-3 space-y-4">

                {/* Shape type */}
                <div>
                  <p className="text-xs text-zinc-400 mb-1">Type</p>
                  <p className="text-xs text-slate-200 capitalize font-medium">
                    {selectedShape.type}
                  </p>
                </div>

                {/* Position */}
                <div>
                  <p className="text-xs text-zinc-400 mb-2 font-medium">Position</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-400">X (mm)</span>
                      <input
                        type="number"
                        aria-label="Shape position X"
                        value={Math.round(selectedShape.x ?? 0)}
                        onChange={(e) => updateShape(selectedShape.id, { x: Number(e.target.value) })}
                        className="w-full bg-[#18181b] border border-panel-border rounded px-2 py-1 text-xs text-slate-200 font-mono focus:border-zinc-400 outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400">Y (mm)</span>
                      <input
                        type="number"
                        aria-label="Shape position Y"
                        value={Math.round(selectedShape.y ?? 0)}
                        onChange={(e) => updateShape(selectedShape.id, { y: Number(e.target.value) })}
                        className="w-full bg-[#18181b] border border-panel-border rounded px-2 py-1 text-xs text-slate-200 font-mono focus:border-zinc-400 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Size: Width & Length */}
                {selectedShape.type !== 'line' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-zinc-400 font-medium">Dimensions</p>
                      {selectedShape.width && selectedShape.height && (
                        <span className="text-[9px] font-mono text-zinc-400">
                          {Math.round(selectedShape.width)} × {Math.round(selectedShape.height)} mm
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <span className="text-[10px] text-zinc-400">Width (W)</span>
                        <input
                          type="number"
                          min="5"
                          max="3000"
                          aria-label="Shape width"
                          value={Math.round(selectedShape.width ?? 0)}
                          onChange={(e) => updateShape(selectedShape.id, { width: Math.max(5, Number(e.target.value)) })}
                          className="w-full bg-[#18181b] border border-panel-border rounded px-2 py-1 text-xs text-slate-200 font-mono focus:border-zinc-400 outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400">Length / Height (L)</span>
                        <input
                          type="number"
                          min="5"
                          max="3000"
                          aria-label="Shape length"
                          value={Math.round(selectedShape.height ?? 0)}
                          onChange={(e) => updateShape(selectedShape.id, { height: Math.max(5, Number(e.target.value)) })}
                          className="w-full bg-[#18181b] border border-panel-border rounded px-2 py-1 text-xs text-slate-200 font-mono focus:border-zinc-400 outline-none"
                        />
                      </div>
                    </div>

                    {/* Circle Radius/Diameter quick control */}
                    {selectedShape.type === 'circle' && (
                      <div className="grid grid-cols-2 gap-2 mt-1.5 pt-1.5 border-t border-panel-border/40">
                        <div>
                          <span className="text-[10px] text-zinc-400">Radius (R)</span>
                          <input
                            type="number"
                            min="2"
                            aria-label="Circle radius"
                            value={Math.round(selectedShape.radius ?? ((selectedShape.width ?? 20) / 2))}
                            onChange={(e) => {
                              const r = Math.max(2, Number(e.target.value));
                              updateShape(selectedShape.id, { radius: r, width: r * 2, height: r * 2 });
                            }}
                            className="w-full bg-[#18181b] border border-panel-border rounded px-2 py-1 text-xs text-slate-200 font-mono focus:border-zinc-400 outline-none"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400">Diameter (⌀)</span>
                          <input
                            type="number"
                            min="4"
                            aria-label="Circle diameter"
                            value={Math.round((selectedShape.radius ?? ((selectedShape.width ?? 20) / 2)) * 2)}
                            onChange={(e) => {
                              const d = Math.max(4, Number(e.target.value));
                              updateShape(selectedShape.id, { radius: d / 2, width: d, height: d });
                            }}
                            className="w-full bg-[#18181b] border border-panel-border rounded px-2 py-1 text-xs text-slate-200 font-mono focus:border-zinc-400 outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Stroke color */}
                <div>
                  <p className="text-xs text-zinc-400 mb-2">Stroke</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      aria-label="Shape stroke color"
                      value={selectedShape.stroke || strokeColor}
                      onChange={(e) => {
                        setStrokeColor(e.target.value);
                        updateShape(selectedShape.id, { stroke: e.target.value });
                      }}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border border-panel-border"
                    />
                    <span className="text-xs text-slate-300 font-mono">{selectedShape.stroke || strokeColor}</span>
                  </div>
                </div>

                {/* Fill color for closed shapes */}
                {isClosedShape && (
                  <div>
                    <p className="text-xs text-zinc-400 mb-2">Fill</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        aria-label="Shape fill color"
                        value={isNoFill ? '#e4e4e7' : currentShapeFill}
                        disabled={isNoFill}
                        onChange={(e) => {
                          setFillColor(e.target.value);
                          updateShape(selectedShape.id, { fill: e.target.value });
                        }}
                        className={`w-8 h-8 rounded cursor-pointer bg-transparent border border-panel-border ${
                          isNoFill ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                      />
                      <span className="text-xs text-slate-300 font-mono">{isNoFill ? 'Transparent' : currentShapeFill}</span>
                    </div>

                    <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        aria-label="No fill transparent"
                        checked={isNoFill}
                        onChange={(e) => {
                          const noFill = e.target.checked;
                          const newFill = noFill ? 'transparent' : (fillColor === 'transparent' ? '#e4e4e7' : fillColor);
                          updateShape(selectedShape.id, { fill: newFill });
                        }}
                        className="rounded bg-[#18181b] border-panel-border text-zinc-400 focus:ring-0"
                      />
                      <span className="text-[11px] text-slate-300">No fill (transparent)</span>
                    </label>
                  </div>
                )}

                {/* Stroke width */}
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-xs text-zinc-400">Stroke width</p>
                    <p className="text-xs text-slate-300">{selectedShape.strokeWidth ?? strokeWidth}px</p>
                  </div>
                  <input
                    type="range" min="0.5" max="20" step="0.5"
                    aria-label="Stroke width slider"
                    value={selectedShape.strokeWidth ?? strokeWidth}
                    onChange={(e) => {
                      const sw = Number(e.target.value);
                      setStrokeWidth(sw);
                      updateShape(selectedShape.id, { strokeWidth: sw });
                    }}
                    className="w-full accent-zinc-400"
                  />
                </div>

                {/* Opacity */}
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-xs text-zinc-400">Opacity</p>
                    <p className="text-xs text-slate-300">{Math.round((selectedShape.opacity ?? opacity) * 100)}%</p>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.05"
                    aria-label="Opacity slider"
                    value={selectedShape.opacity ?? opacity}
                    onChange={(e) => {
                      const op = Number(e.target.value);
                      setOpacity(op);
                      updateShape(selectedShape.id, { opacity: op });
                    }}
                    className="w-full accent-zinc-400"
                  />
                </div>

                {/* 3D Extrusion & Height */}
                <div className="border-t border-panel-border/60 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Box size={13} className="text-zinc-300" />
                      <p className="text-xs font-semibold text-slate-200">3D Extrusion</p>
                    </div>
                    <button
                      onClick={() => useCanvasStore.getState().setShow3DModal(true)}
                      className="text-[10px] text-zinc-300 hover:text-white hover:underline cursor-pointer"
                      title="Open 3D Model Viewer"
                      aria-label="Open 3D Model Viewer"
                    >
                      3D View →
                    </button>
                  </div>

                  {/* 3D Height (Z) */}
                  <div className="mb-2.5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] text-slate-400">Height (Z)</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          aria-label="3D extrusion height"
                          value={selectedShape.height3d ?? 80}
                          onChange={(e) => updateShape(selectedShape.id, { height3d: Math.max(1, Number(e.target.value)) })}
                          className="w-14 bg-[#18181b] border border-panel-border rounded px-1.5 py-0.5 text-xs text-slate-200 font-mono text-right"
                        />
                        <span className="text-[10px] text-slate-400">mm</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="300"
                      step="5"
                      aria-label="3D extrusion height slider"
                      value={selectedShape.height3d ?? 80}
                      onChange={(e) => updateShape(selectedShape.id, { height3d: Number(e.target.value) })}
                      className="w-full accent-zinc-400"
                    />
                  </div>

                  {/* 3D Elevation / Base Z */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] text-slate-400">Elevation (Base Z)</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          aria-label="3D elevation base Z"
                          value={selectedShape.elevation3d ?? 0}
                          onChange={(e) => updateShape(selectedShape.id, { elevation3d: Math.max(0, Number(e.target.value)) })}
                          className="w-14 bg-[#18181b] border border-panel-border rounded px-1.5 py-0.5 text-xs text-slate-200 font-mono text-right"
                        />
                        <span className="text-[10px] text-slate-400">mm</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      step="5"
                      aria-label="3D elevation base Z slider"
                      value={selectedShape.elevation3d ?? 0}
                      onChange={(e) => updateShape(selectedShape.id, { elevation3d: Number(e.target.value) })}
                      className="w-full accent-zinc-400"
                    />
                  </div>

                  {/* 3D Material Finish */}
                  <div className="mt-3">
                    <span className="text-[11px] text-slate-400 block mb-1.5">3D Material Finish</span>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'concrete', label: 'Concrete', icon: '🧱' },
                        { id: 'glass',    label: 'Glass',    icon: '🪟' },
                        { id: 'wood',     label: 'Wood',     icon: '🪵' },
                        { id: 'metal',    label: 'Metal',    icon: '⚙️' },
                        { id: 'brick',    label: 'Brick',    icon: '🔴' },
                        { id: 'default',  label: 'CAD Gray', icon: '◻️' },
                      ].map((m) => {
                        const active = (selectedShape.material3d || 'default') === m.id;
                        return (
                          <button
                            key={m.id}
                            aria-label={`Apply ${m.label} 3D material`}
                            onClick={() => updateShape(selectedShape.id, { material3d: m.id as any })}
                            className={`flex items-center gap-1 px-1.5 py-1 rounded text-[9px] font-medium transition-all cursor-pointer border ${
                              active
                                ? 'border-zinc-400 bg-zinc-700 text-white font-semibold shadow-sm'
                                : 'border-panel-border/70 bg-[#27272a] text-slate-400 hover:text-white'
                            }`}
                          >
                            <span aria-hidden="true">{m.icon}</span>
                            <span className="truncate">{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Erase / Delete Shape button */}
                <div className="border-t border-panel-border/60 pt-3">
                  <button
                    onClick={() => deleteShape(selectedShape.id)}
                    aria-label="Erase or delete selected shape"
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50 rounded-lg text-xs font-medium transition-all cursor-pointer shadow-sm"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                    <span>Erase / Delete Shape</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 p-4 text-center mt-8">
                <div className="w-10 h-10 rounded-full bg-panel-hover flex items-center justify-center mb-3">
                  <span className="text-zinc-400 text-lg">✦</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Select a shape to edit its properties
                </p>
              </div>
            )}

            {/* Default drawing style */}
            <div className="border-t border-panel-border p-3 space-y-3 mt-2">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Default style
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Default stroke color"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border border-panel-border"
                />
                <span className="text-xs text-zinc-400">Stroke color</span>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-zinc-400">Width</span>
                  <span className="text-xs text-slate-300">{strokeWidth}px</span>
                </div>
                <input
                  type="range" min="0.5" max="20" step="0.5"
                  aria-label="Default stroke width slider"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="w-full accent-zinc-400"
                />
              </div>
              {/* Font size — only show when text tool is active */}
              {useToolStore.getState().activeTool === 'text' && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-zinc-400">Font size</span>
                    <span className="text-xs text-slate-300">{useToolStore.getState().fontSize}px</span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {[10, 12, 14, 16, 18, 24, 32, 48].map((s) => (
                      <button
                        key={s}
                        aria-label={`Font size ${s}px`}
                        onClick={() => useToolStore.getState().setFontSize(s)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer
            ${useToolStore.getState().fontSize === s
                            ? 'bg-zinc-600 text-white'
                            : 'bg-panel-hover text-slate-400 hover:text-white'
                          }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Layers tab ── */}
        {activeTab === 'layers' && <LayersPanel />}
      </div>
    </aside>
  );
};