import React, { useState, useEffect } from 'react';
import {
  Save, FolderOpen, Download, Undo2, Redo2,
  Grid3x3, Magnet, Minus, Square, Circle,
  MousePointer2, Move, Type, ZoomIn, ZoomOut,
  Copy, FlipHorizontal, RotateCw, RotateCcw,
  Eye, Trash2, PenTool, Slash, Lock, Unlock,
  Pencil, HelpCircle, Maximize2, Focus,
  Box, Layers, Plus, FileCode, Image, Sparkles
} from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useToolStore } from '../../store/useToolStore';
import { exportAsSVG, exportAsPNG, exportAsDXF } from '../../utils/exportUtils';
import { loadProjectFromFile, saveProjectToFile } from '../../utils/saveUtils';

// Lazy-load heavy modals so Three.js and large dialog trees are not evaluated on initial load
const ExportModal = React.lazy(() => import('../ui/ExportModal').then(m => ({ default: m.ExportModal })));
const KeyboardShortcutsModal = React.lazy(() => import('../ui/KeyboardShortcutsModal').then(m => ({ default: m.KeyboardShortcutsModal })));
const ThreeDViewerModal = React.lazy(() => import('../ui/ThreeDViewerModal').then(m => ({ default: m.ThreeDViewerModal })));
const TemplatesModal = React.lazy(() => import('../ui/TemplatesModal').then(m => ({ default: m.TemplatesModal })));

const RibbonBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
  ariaLabel?: string;
}> = ({ icon, label, active, onClick, title, disabled, ariaLabel }) => (
  <button
    onClick={onClick}
    title={title}
    aria-label={ariaLabel || title || label}
    disabled={disabled}
    className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded
      min-w-[44px] h-14 text-center transition-all cursor-pointer
      ${active ? 'bg-zinc-700 text-white shadow-sm ring-1 ring-zinc-500' : 'text-slate-400 hover:text-white hover:bg-panel-hover'}
      ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
  >
    <span className="text-base" aria-hidden="true">{icon}</span>
    <span className="text-[9px] leading-tight whitespace-nowrap">{label}</span>
  </button>
);

const RibbonDivider = () => (
  <div className="flex items-center self-stretch px-1">
    <div className="w-px h-10 bg-panel-border" />
  </div>
);

const RibbonGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col items-center">
    <div className="flex items-end gap-0.5 px-1">{children}</div>
    <span className="text-[9px] text-slate-600 mt-0.5 tracking-wider uppercase">{label}</span>
  </div>
);

// ── Custom inline icons — guaranteed to render with no import risk ──
const MirrorVIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M8 1v14M3 4l-2 4 2 4M13 4l2 4-2 4"/>
    <line x1="1" y1="8" x2="5" y2="8"/>
    <line x1="11" y1="8" x2="15" y2="8"/>
  </svg>
);

const AlignLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="2" y1="1" x2="2" y2="15"/>
    <rect x="4" y="3" width="9" height="3" fill="currentColor" stroke="none"/>
    <rect x="4" y="10" width="6" height="3" fill="currentColor" stroke="none"/>
  </svg>
);
const AlignRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="14" y1="1" x2="14" y2="15"/>
    <rect x="3" y="3" width="9" height="3" fill="currentColor" stroke="none"/>
    <rect x="6" y="10" width="6" height="3" fill="currentColor" stroke="none"/>
  </svg>
);
const AlignCenterHIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="8" y1="1" x2="8" y2="15"/>
    <rect x="3" y="3" width="10" height="3" fill="currentColor" stroke="none"/>
    <rect x="5" y="10" width="6" height="3" fill="currentColor" stroke="none"/>
  </svg>
);
const AlignTopIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="1" y1="2" x2="15" y2="2"/>
    <rect x="3" y="4" width="3" height="9" fill="currentColor" stroke="none"/>
    <rect x="10" y="4" width="3" height="6" fill="currentColor" stroke="none"/>
  </svg>
);
const AlignBottomIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="1" y1="14" x2="15" y2="14"/>
    <rect x="3" y="3" width="3" height="9" fill="currentColor" stroke="none"/>
    <rect x="10" y="6" width="3" height="6" fill="currentColor" stroke="none"/>
  </svg>
);
const AlignCenterVIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="1" y1="8" x2="15" y2="8"/>
    <rect x="3" y="3" width="3" height="10" fill="currentColor" stroke="none"/>
    <rect x="10" y="5" width="3" height="6" fill="currentColor" stroke="none"/>
  </svg>
);
const DistributeHIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <rect x="1" y="4" width="2" height="8" fill="currentColor" stroke="none"/>
    <rect x="7" y="4" width="2" height="8" fill="currentColor" stroke="none"/>
    <rect x="13" y="4" width="2" height="8" fill="currentColor" stroke="none"/>
    <line x1="3" y1="8" x2="6.5" y2="8" strokeDasharray="1.5,1.5"/>
    <line x1="9.5" y1="8" x2="13" y2="8" strokeDasharray="1.5,1.5"/>
  </svg>
);
const DistributeVIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <rect x="4" y="1" width="8" height="2" fill="currentColor" stroke="none"/>
    <rect x="4" y="7" width="8" height="2" fill="currentColor" stroke="none"/>
    <rect x="4" y="13" width="8" height="2" fill="currentColor" stroke="none"/>
    <line x1="8" y1="3" x2="8" y2="6.5" strokeDasharray="1.5,1.5"/>
    <line x1="8" y1="9.5" x2="8" y2="13" strokeDasharray="1.5,1.5"/>
  </svg>
);
const GroupIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
    <rect x="1" y="1" width="14" height="14" rx="2" strokeDasharray="2,2"/>
    <rect x="3" y="3" width="5" height="5" fill="currentColor" stroke="none" opacity="0.8"/>
    <rect x="9" y="9" width="4" height="4" fill="currentColor" stroke="none" opacity="0.8"/>
  </svg>
);
const UngroupIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
    <rect x="1" y="2" width="6" height="6" strokeDasharray="2,2"/>
    <rect x="9" y="9" width="6" height="6" strokeDasharray="2,2"/>
    <rect x="2.5" y="3.5" width="3" height="3" fill="currentColor" stroke="none" opacity="0.8"/>
    <rect x="10.5" y="10.5" width="3" height="3" fill="currentColor" stroke="none" opacity="0.8"/>
  </svg>
);

const tabs = ['Home', 'Draw', 'Modify', 'Align', 'View', 'Layers', 'Output'];

export const TopMenuBar: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Home');
  const [showExportModal, setShowExportModal] = useState(false);

  const showGrid    = useCanvasStore((s) => s.showGrid);
  const snapToGrid  = useCanvasStore((s) => s.snapToGrid);
  const zoom        = useCanvasStore((s) => s.zoom);
  const panX        = useCanvasStore((s) => s.panX);
  const panY        = useCanvasStore((s) => s.panY);
  const gridSize    = useCanvasStore((s) => s.gridSize);
  const toggleGrid  = useCanvasStore((s) => s.toggleGrid);
  const toggleSnap  = useCanvasStore((s) => s.toggleSnap);
  const setZoom     = useCanvasStore((s) => s.setZoom);
  const zoomToFit   = useCanvasStore((s) => s.zoomToFit);
  const undo        = useCanvasStore((s) => s.undo);
  const redo        = useCanvasStore((s) => s.redo);
  const loadProject = useCanvasStore((s) => s.loadProject);
  const history     = useCanvasStore((s) => s.history ?? []);
  const future      = useCanvasStore((s) => s.future ?? []);
  const selectedShapeIds = useCanvasStore((s) => s.selectedShapeIds ?? []);
  const layers      = useCanvasStore((s) => s.layers);
  const activeLayerId = useCanvasStore((s) => s.activeLayerId);
  const setActiveLayer = useCanvasStore((s) => s.setActiveLayer);
  const addLayer    = useCanvasStore((s) => s.addLayer);
  const toggleLayerVisibility = useCanvasStore((s) => s.toggleLayerVisibility);
  const toggleLayerLock = useCanvasStore((s) => s.toggleLayerLock);
  const projectName = useCanvasStore((s) => s.projectName);
  const setProjectName = useCanvasStore((s) => s.setProjectName);
  const saveStatus  = useCanvasStore((s) => s.saveStatus);
  const setShowShortcutsModal = useCanvasStore((s) => s.setShowShortcutsModal);
  const setShow3DModal = useCanvasStore((s) => s.setShow3DModal);
  const setShowTemplatesModal = useCanvasStore((s) => s.setShowTemplatesModal);
  const showShortcutsModal = useCanvasStore((s) => s.showShortcutsModal);
  const show3DModal = useCanvasStore((s) => s.show3DModal);
  const showTemplatesModal = useCanvasStore((s) => s.showTemplatesModal);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(projectName);

  useEffect(() => {
    setTempName(projectName);
  }, [projectName]);

  const handleSaveName = () => {
    const trimmed = tempName.trim();
    if (trimmed) {
      setProjectName(trimmed);
    } else {
      setTempName(projectName);
    }
    setIsEditingName(false);
  };

  const { activeTool, setActiveTool } = useToolStore();

  const hasSelection = selectedShapeIds.length > 0;
  const canAlign = selectedShapeIds.length >= 2;
  const canDistribute = selectedShapeIds.length >= 3;
  const canGroup = selectedShapeIds.length >= 2;

  const allShapes = layers.flatMap((l: any) => l.shapes);
  const selectedShapesData = allShapes.filter((s: any) => selectedShapeIds.includes(s.id));
  const anyLocked = selectedShapesData.some((s: any) => s.isLocked);
  const anyGrouped = selectedShapesData.some((s: any) => s.groupId);

  const handleOpenProject = () => {
    loadProjectFromFile(
      (project) => loadProject(project),
      (err) => alert(`Error: ${err}`)
    );
  };

  const rotateCW  = () => (useCanvasStore.getState() as any).rotateSelectedShapes(90);
  const rotateCCW = () => (useCanvasStore.getState() as any).rotateSelectedShapes(-90);
  const mirrorH   = () => (useCanvasStore.getState() as any).mirrorSelectedShapes('h');
  const mirrorV   = () => (useCanvasStore.getState() as any).mirrorSelectedShapes('v');
  const copyShapes    = () => (useCanvasStore.getState() as any).copyShapes();
  const deleteShapes  = () => (useCanvasStore.getState() as any).deleteSelectedShapes();

  const alignLeft    = () => (useCanvasStore.getState() as any).alignSelectedShapes('left');
  const alignRight   = () => (useCanvasStore.getState() as any).alignSelectedShapes('right');
  const alignCenterH = () => (useCanvasStore.getState() as any).alignSelectedShapes('centerH');
  const alignTop     = () => (useCanvasStore.getState() as any).alignSelectedShapes('top');
  const alignBottom  = () => (useCanvasStore.getState() as any).alignSelectedShapes('bottom');
  const alignCenterV = () => (useCanvasStore.getState() as any).alignSelectedShapes('centerV');
  const distributeH  = () => (useCanvasStore.getState() as any).distributeSelectedShapes('h');
  const distributeV  = () => (useCanvasStore.getState() as any).distributeSelectedShapes('v');
  const groupShapes   = () => (useCanvasStore.getState() as any).groupSelectedShapes();
  const ungroupShapes = () => (useCanvasStore.getState() as any).ungroupSelectedShapes();
  const toggleLock     = () => (useCanvasStore.getState() as any).toggleLockSelectedShapes();

  return (
    <header className="flex flex-col shrink-0 bg-panel-bg border-b border-panel-border select-none" role="banner">

      {/* Row 1: Title bar */}
      <div className="flex items-center justify-between px-3 h-8 bg-[#141416] border-b border-panel-border">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-zinc-700 border border-zinc-600 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-sm" aria-hidden="true">C</div>
          <h1 className="text-xs font-bold text-white tracking-wide m-0 inline">CAD AI</h1>
          <div className="w-px h-3 bg-panel-border mx-1" />
          <button title="Save (Ctrl+S)" aria-label="Save project" onClick={() => setShowExportModal(true)} className="text-slate-400 hover:text-white p-1 rounded hover:bg-panel-hover transition-colors cursor-pointer"><Save size={12} /></button>
          <button title="Open project" aria-label="Open project" onClick={handleOpenProject} className="text-slate-400 hover:text-white p-1 rounded hover:bg-panel-hover transition-colors cursor-pointer"><FolderOpen size={12} /></button>
          <button title="Undo (Ctrl+Z)" aria-label="Undo last action" onClick={undo} disabled={history.length === 0} className={`text-slate-400 hover:text-white p-1 rounded hover:bg-panel-hover transition-colors ${history.length === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}><Undo2 size={12} /></button>
          <button title="Redo (Ctrl+Y)" aria-label="Redo action" onClick={redo} disabled={future.length === 0} className={`text-slate-400 hover:text-white p-1 rounded hover:bg-panel-hover transition-colors ${future.length === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}><Redo2 size={12} /></button>
        </div>

        {/* Center: Editable Project Name + Autosave Indicator */}
        <div className="flex items-center gap-3">
          {isEditingName ? (
            <input
              type="text"
              value={tempName}
              aria-label="Project name"
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') {
                  setTempName(projectName);
                  setIsEditingName(false);
                }
              }}
              autoFocus
              className="bg-[#18181b] border border-zinc-500 rounded px-2 py-0.5 text-xs text-white font-medium outline-none shadow-inner w-44"
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="group flex items-center gap-1.5 text-xs text-slate-300 hover:text-white font-medium px-2 py-0.5 rounded hover:bg-panel-hover transition-colors cursor-pointer"
              title="Click to rename project"
              aria-label={`Rename project: current name is ${projectName}`}
            >
              <span>{projectName}</span>
              <span className="text-slate-500 font-normal">— CAD AI 2025</span>
              <Pencil size={11} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
            </button>
          )}

          {/* Autosave indicator */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] select-none bg-[#141416] border border-panel-border/60">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                saveStatus === 'saving'
                  ? 'bg-amber-400 animate-pulse'
                  : saveStatus === 'saved'
                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                  : 'bg-slate-500 opacity-50'
              }`}
            />
            <span className="text-[10px] text-slate-400 font-mono">
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Auto-save'}
            </span>
          </div>
        </div>

        {/* Right: Zoom controls, 3D View, and help */}
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom(zoom - 0.1)} title="Zoom out (-)" aria-label="Zoom out" className="text-slate-400 hover:text-white px-1.5 h-5 rounded text-xs hover:bg-panel-hover cursor-pointer">−</button>
          <span className="text-xs text-slate-300 w-12 text-center font-mono">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(zoom + 0.1)} title="Zoom in (+)" aria-label="Zoom in" className="text-slate-400 hover:text-white px-1.5 h-5 rounded text-xs hover:bg-panel-hover cursor-pointer">+</button>
          <button onClick={() => setZoom(1)} title="Reset zoom (0)" aria-label="Reset zoom to 1:1" className="text-slate-400 hover:text-white px-2 h-5 rounded text-xs hover:bg-panel-hover ml-1 cursor-pointer">1:1</button>
          <button onClick={() => zoomToFit(false)} title="Zoom to fit (F)" aria-label="Zoom to fit canvas" className="text-slate-400 hover:text-white px-2 h-5 rounded text-xs hover:bg-panel-hover cursor-pointer">Fit</button>

          {/* Templates button */}
          <button
            onClick={() => setShowTemplatesModal(true)}
            title="Starter Architectural Templates & Floor Plans"
            aria-label="Starter Architectural Templates and Floor Plans"
            className="flex items-center gap-1.5 px-2.5 h-6 rounded text-xs bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white transition-all font-semibold cursor-pointer border border-emerald-500/40 shadow-sm"
          >
            <Sparkles size={12} />
            <span>Templates</span>
          </button>

          <div className="w-px h-3 bg-panel-border mx-1" />

          {/* 3D View button — prominent, glowing */}
          <button
            onClick={() => setShow3DModal(true)}
            title="Convert 2D drawing to 3D Extrusion model"
            aria-label="Open 3D Extrusion Architectural Studio"
            className="flex items-center gap-1.5 px-3 h-6 rounded text-xs font-semibold cursor-pointer transition-all duration-200
              bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500
              text-white border border-cyan-500/60 shadow-[0_0_8px_rgba(6,182,212,0.45)]
              hover:shadow-[0_0_14px_rgba(6,182,212,0.7)] active:scale-95"
          >
            <Box size={13} />
            <span>3D View</span>
          </button>

          <div className="w-px h-3 bg-panel-border mx-1" />

          <button
            onClick={() => setShowShortcutsModal(true)}
            title="Keyboard shortcuts (?)"
            aria-label="View keyboard shortcuts"
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-panel-hover transition-colors cursor-pointer"
          >
            <HelpCircle size={14} />
          </button>
        </div>
      </div>

      {/* Row 2: Ribbon tabs */}
      <div className="flex items-end px-2 gap-0.5 bg-[#141416] border-b border-panel-border">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-xs font-medium rounded-t transition-colors -mb-px
              ${activeTab === tab
                ? 'bg-panel-bg text-white border border-b-panel-bg border-panel-border'
                : 'text-slate-500 hover:text-slate-300 hover:bg-panel-hover'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Row 3: Ribbon panels */}
      <div className="flex items-center gap-1 px-2 py-1 h-[72px] overflow-x-auto">

        {activeTab === 'Home' && (
          <>
            <RibbonGroup label="select">
              <RibbonBtn icon={<MousePointer2 size={16} />} label="Select" active={activeTool === 'select'} onClick={() => setActiveTool('select')} title="Select (V)" />
              <RibbonBtn icon={<Move size={16} />} label="Move" active={activeTool === 'move'} onClick={() => setActiveTool('move')} title="Move (M)" />
              <RibbonBtn icon={<ZoomIn size={16} />} label="Pan" active={activeTool === 'pan'} onClick={() => setActiveTool('pan')} title="Pan (H)" />
            </RibbonGroup>
            <RibbonDivider />
            <RibbonGroup label="draw">
              <RibbonBtn icon={<Minus size={16} />} label="Line" active={activeTool === 'line'} onClick={() => setActiveTool('line')} title="Line (L)" />
              <RibbonBtn icon={<Square size={16} />} label="Rect" active={activeTool === 'rectangle'} onClick={() => setActiveTool('rectangle')} title="Rectangle (R)" />
              <RibbonBtn icon={<Circle size={16} />} label="Circle" active={activeTool === 'circle'} onClick={() => setActiveTool('circle')} title="Circle (C)" />
              <RibbonBtn icon={<PenTool size={16} />} label="Ellipse" active={activeTool === 'ellipse'} onClick={() => setActiveTool('ellipse')} title="Ellipse (E)" />
              <RibbonBtn icon={<Slash size={16} />} label="Polyline" active={activeTool === 'polyline'} onClick={() => setActiveTool('polyline')} title="Polyline (P)" />
              <RibbonBtn icon={<Type size={16} />} label="Text" active={activeTool === 'text'} onClick={() => setActiveTool('text')} title="Text (T)" />
            </RibbonGroup>
            <RibbonDivider />
            <RibbonGroup label="modify">
              <RibbonBtn icon={<Copy size={16} />} label="Copy" title={hasSelection ? 'Copy (Ctrl+C)' : 'Select a shape first'} disabled={!hasSelection} onClick={copyShapes} />
              <RibbonBtn icon={<RotateCw size={16} />} label="Rot ↻" title="Rotate CW" disabled={!hasSelection} onClick={rotateCW} />
              <RibbonBtn icon={<RotateCcw size={16} />} label="Rot ↺" title="Rotate CCW" disabled={!hasSelection} onClick={rotateCCW} />
              <RibbonBtn icon={<FlipHorizontal size={16} />} label="Mir H" title="Mirror horizontal" disabled={!hasSelection} onClick={mirrorH} />
              <RibbonBtn icon={<MirrorVIcon />} label="Mir V" title="Mirror vertical" disabled={!hasSelection} onClick={mirrorV} />
              <RibbonBtn icon={<Trash2 size={16} />} label="Delete" title="Delete (Del)" disabled={!hasSelection} onClick={deleteShapes} />
            </RibbonGroup>
            <RibbonDivider />
            <RibbonGroup label="view">
              <RibbonBtn icon={<Grid3x3 size={16} />} label="Grid" active={showGrid} onClick={toggleGrid} title="Grid (G)" />
              <RibbonBtn icon={<Magnet size={16} />} label="Snap" active={snapToGrid} onClick={toggleSnap} title="Snap (S)" />
              <RibbonBtn icon={<Eye size={16} />} label="Layers" title="Layers" />
              <RibbonBtn icon={<Download size={16} />} label="Export" onClick={() => setShowExportModal(true)} title="Export / Save" />
            </RibbonGroup>
          </>
        )}

        {activeTab === 'Draw' && (
          <>
            <RibbonGroup label="lines">
              <RibbonBtn icon={<Minus size={16} />} label="Line" active={activeTool === 'line'} onClick={() => setActiveTool('line')} />
              <RibbonBtn icon={<Slash size={16} />} label="Polyline" active={activeTool === 'polyline'} onClick={() => setActiveTool('polyline')} />
            </RibbonGroup>
            <RibbonDivider />
            <RibbonGroup label="shapes">
              <RibbonBtn icon={<Square size={16} />} label="Rect" active={activeTool === 'rectangle'} onClick={() => setActiveTool('rectangle')} />
              <RibbonBtn icon={<Circle size={16} />} label="Circle" active={activeTool === 'circle'} onClick={() => setActiveTool('circle')} />
              <RibbonBtn icon={<PenTool size={16} />} label="Ellipse" active={activeTool === 'ellipse'} onClick={() => setActiveTool('ellipse')} />
            </RibbonGroup>
            <RibbonDivider />
            <RibbonGroup label="annotation">
              <RibbonBtn icon={<Type size={16} />} label="Text" active={activeTool === 'text'} onClick={() => setActiveTool('text')} />
            </RibbonGroup>
          </>
        )}

        {activeTab === 'Modify' && (
          <>
            <RibbonGroup label="transform">
              <RibbonBtn icon={<RotateCw size={16} />} label="Rot ↻" disabled={!hasSelection} onClick={rotateCW} />
              <RibbonBtn icon={<RotateCcw size={16} />} label="Rot ↺" disabled={!hasSelection} onClick={rotateCCW} />
              <RibbonBtn icon={<FlipHorizontal size={16} />} label="Mir H" disabled={!hasSelection} onClick={mirrorH} />
              <RibbonBtn icon={<MirrorVIcon />} label="Mir V" disabled={!hasSelection} onClick={mirrorV} />
            </RibbonGroup>
            <RibbonDivider />
            <RibbonGroup label="clipboard">
              <RibbonBtn icon={<Copy size={16} />} label="Copy" disabled={!hasSelection} onClick={copyShapes} />
              <RibbonBtn icon={<Trash2 size={16} />} label="Delete" disabled={!hasSelection} onClick={deleteShapes} />
            </RibbonGroup>
          </>
        )}

        {activeTab === 'Align' && (
          <>
            <RibbonGroup label="align">
              <RibbonBtn icon={<AlignLeftIcon />} label="Left" disabled={!canAlign} onClick={alignLeft} title={canAlign ? 'Align left edges' : 'Select 2+ shapes'} />
              <RibbonBtn icon={<AlignCenterHIcon />} label="Cntr H" disabled={!canAlign} onClick={alignCenterH} title="Align horizontal centers" />
              <RibbonBtn icon={<AlignRightIcon />} label="Right" disabled={!canAlign} onClick={alignRight} title="Align right edges" />
              <RibbonBtn icon={<AlignTopIcon />} label="Top" disabled={!canAlign} onClick={alignTop} title="Align top edges" />
              <RibbonBtn icon={<AlignCenterVIcon />} label="Cntr V" disabled={!canAlign} onClick={alignCenterV} title="Align vertical centers" />
              <RibbonBtn icon={<AlignBottomIcon />} label="Bottom" disabled={!canAlign} onClick={alignBottom} title="Align bottom edges" />
            </RibbonGroup>
            <RibbonDivider />
            <RibbonGroup label="distribute">
              <RibbonBtn icon={<DistributeHIcon />} label="Dist H" disabled={!canDistribute} onClick={distributeH} title={canDistribute ? 'Distribute evenly (horizontal)' : 'Select 3+ shapes'} />
              <RibbonBtn icon={<DistributeVIcon />} label="Dist V" disabled={!canDistribute} onClick={distributeV} title={canDistribute ? 'Distribute evenly (vertical)' : 'Select 3+ shapes'} />
            </RibbonGroup>
            <RibbonDivider />
            <RibbonGroup label="grouping">
              <RibbonBtn icon={<GroupIcon />} label="Group" disabled={!canGroup} onClick={groupShapes} title={canGroup ? 'Group selected (Ctrl+G)' : 'Select 2+ shapes'} />
              <RibbonBtn icon={<UngroupIcon />} label="Ungroup" disabled={!anyGrouped} onClick={ungroupShapes} title="Ungroup (Ctrl+Shift+G)" />
              <RibbonBtn
                icon={anyLocked ? <Unlock size={16} /> : <Lock size={16} />}
                label={anyLocked ? 'Unlock' : 'Lock'}
                disabled={!hasSelection}
                onClick={toggleLock}
                title={hasSelection ? 'Toggle lock (Ctrl+Shift+L)' : 'Select a shape first'}
              />
            </RibbonGroup>

            {anyLocked && (
              <div className="ml-3 text-[10px] text-amber-400 self-center">
                🔒 {selectedShapesData.filter((s: any) => s.isLocked).length} shape(s) locked
              </div>
            )}
          </>
        )}

        {activeTab === 'View' && (
          <>
            <RibbonGroup label="display">
              <RibbonBtn icon={<Grid3x3 size={16} />} label="Grid" active={showGrid} onClick={toggleGrid} title="Toggle grid (G)" />
              <RibbonBtn icon={<Magnet size={16} />} label="Snap" active={snapToGrid} onClick={toggleSnap} title="Toggle snap (S)" />
            </RibbonGroup>
            <RibbonDivider />
            <RibbonGroup label="navigate">
              <RibbonBtn icon={<ZoomIn size={16} />} label="In" onClick={() => setZoom(zoom + 0.2)} title="Zoom in (+)" />
              <RibbonBtn icon={<ZoomOut size={16} />} label="Out" onClick={() => setZoom(zoom - 0.2)} title="Zoom out (-)" />
              <RibbonBtn icon={<RotateCcw size={16} />} label="1:1" onClick={() => setZoom(1)} title="Reset zoom (0)" />
              <RibbonBtn icon={<Maximize2 size={16} />} label="Fit All" onClick={() => zoomToFit(false)} title="Zoom to fit all shapes (F)" />
              <RibbonBtn icon={<Focus size={16} />} label="Fit Sel" disabled={!hasSelection} onClick={() => zoomToFit(true)} title="Zoom to selection (Shift+F)" />
            </RibbonGroup>
            <RibbonDivider />
            <RibbonGroup label="3d model">
              <RibbonBtn icon={<Box size={16} />} label="3D View" onClick={() => setShow3DModal(true)} title="View 2D drawing in 3D" />
            </RibbonGroup>
            <RibbonDivider />
            <RibbonGroup label="help">
              <RibbonBtn icon={<HelpCircle size={16} />} label="Shortcuts" onClick={() => setShowShortcutsModal(true)} title="Keyboard shortcuts (?)" />
            </RibbonGroup>
          </>
        )}

        {activeTab === 'Layers' && (
          <>
            <RibbonGroup label="create">
              <RibbonBtn icon={<Plus size={16} />} label="New Layer" onClick={addLayer} title="Add new CAD layer" />
            </RibbonGroup>
            <RibbonDivider />
            <RibbonGroup label="active layer">
              <RibbonBtn
                icon={<Eye size={16} />}
                label="Toggle Vis"
                onClick={() => toggleLayerVisibility(activeLayerId)}
                title="Show/hide active layer"
              />
              <RibbonBtn
                icon={<Lock size={16} />}
                label="Toggle Lock"
                onClick={() => toggleLayerLock(activeLayerId)}
                title="Lock/unlock active layer"
              />
            </RibbonGroup>
            <RibbonDivider />
            <RibbonGroup label="all layers">
              <div className="flex items-center gap-1.5 px-2 py-1 max-w-md overflow-x-auto h-12">
                {layers.map((layer: any) => {
                  const isActive = layer.id === activeLayerId;
                  return (
                    <button
                      key={layer.id}
                      onClick={() => setActiveLayer(layer.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer border shrink-0 ${
                        isActive
                          ? 'bg-zinc-700 border-zinc-500 text-white font-medium shadow-sm'
                          : 'bg-[#18181b] border-panel-border text-slate-400 hover:text-white hover:bg-panel-hover'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: layer.color || '#e4e4e7' }} />
                      <span className="truncate max-w-[80px]">{layer.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({layer.shapes.length})</span>
                      {!layer.isVisible && <span className="text-[9px] text-amber-400">hidden</span>}
                      {layer.isLocked && <span className="text-[9px] text-amber-400">🔒</span>}
                    </button>
                  );
                })}
              </div>
            </RibbonGroup>
          </>
        )}

        {activeTab === 'Output' && (
          <>
            <RibbonGroup label="project file">
              <RibbonBtn
                icon={<Save size={16} />}
                label="Save .cadai"
                onClick={() => saveProjectToFile({ layers, selectedShapeIds: [], activeLayerId, zoom, panX, panY, gridSize, snapToGrid, showGrid }, projectName)}
                title="Save CAD AI project file"
              />
              <RibbonBtn
                icon={<FolderOpen size={16} />}
                label="Open .cadai"
                onClick={handleOpenProject}
                title="Open CAD AI project file"
              />
            </RibbonGroup>
            <RibbonDivider />
            <RibbonGroup label="2d export">
              <RibbonBtn
                icon={<FileCode size={16} />}
                label="DXF (CAD)"
                onClick={() => exportAsDXF(layers, projectName)}
                title="Export AutoCAD DXF (AC1015/R2000)"
              />
              <RibbonBtn
                icon={<Download size={16} />}
                label="SVG Vector"
                onClick={() => exportAsSVG(layers, projectName)}
                title="Export Scalable Vector Graphics"
              />
              <RibbonBtn
                icon={<Image size={16} />}
                label="PNG Image"
                onClick={() => exportAsPNG(layers, projectName)}
                title="Export High-Resolution PNG"
              />
            </RibbonGroup>
            <RibbonDivider />
            <RibbonGroup label="3d model">
              <RibbonBtn
                icon={<Box size={16} />}
                label="3D Model"
                onClick={() => setShow3DModal(true)}
                title="Convert 2D drawing to 3D Extrusion model (.OBJ)"
              />
            </RibbonGroup>
            <RibbonDivider />
            <RibbonGroup label="dialogs">
              <RibbonBtn
                icon={<Download size={16} />}
                label="Export Center"
                onClick={() => setShowExportModal(true)}
                title="Open full Export & Save dialog"
              />
            </RibbonGroup>
          </>
        )}
      </div>
 
      <React.Suspense fallback={null}>
        {showExportModal && (
          <ExportModal onClose={() => setShowExportModal(false)} />
        )}
        {showShortcutsModal && <KeyboardShortcutsModal />}
        {showTemplatesModal && <TemplatesModal />}
        {show3DModal && <ThreeDViewerModal />}
      </React.Suspense>
    </header>
  );
};