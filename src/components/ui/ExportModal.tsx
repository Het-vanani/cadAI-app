import React, { useState } from 'react';
import { X, Download, FileJson, Image, FileCode } from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { exportAsSVG, exportAsPNG, exportAsDXF } from '../../utils/exportUtils';
import { saveProjectToFile } from '../../utils/saveUtils';

interface ExportModalProps { onClose: () => void; }

export const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const { layers, activeLayerId, zoom, panX, panY, gridSize, snapToGrid, showGrid } = useCanvasStore();
  const storeProjectName = useCanvasStore((s) => s.projectName);
  const setStoreProjectName = useCanvasStore((s) => s.setProjectName);
  const [projectName, setProjectName] = useState(storeProjectName || 'Untitled Project');
  const [message, setMessage] = useState('');

  const notify = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 2500); };

  const handleNameChange = (val: string) => {
    setProjectName(val);
    setStoreProjectName(val);
  };

  const handleSave = () => {
    saveProjectToFile({ layers, selectedShapeIds: [], activeLayerId, zoom, panX, panY, gridSize, snapToGrid, showGrid }, projectName);
    notify(`✓ Saved as ${projectName}.cadai`);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-panel-bg border border-panel-border rounded-lg w-80 shadow-2xl" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-4 py-3 border-b border-panel-border">
          <span className="text-sm font-semibold text-white">Save & Export</span>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={16} /></button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Project name</label>
            <input
              type="text" value={projectName}
              onChange={e => handleNameChange(e.target.value)}
              className="w-full bg-[#18181b] border border-panel-border rounded px-3 py-1.5 text-sm text-white outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          {/* Save */}
          <div>
            <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Save project</p>
            <button onClick={handleSave}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded bg-zinc-700 hover:bg-zinc-600 border border-zinc-600/50 text-white text-sm shadow-sm cursor-pointer transition-colors">
              <FileJson size={16} />
              <div className="text-left">
                <div className="font-medium">Save Project</div>
                <div className="text-xs opacity-70">Downloads as .cadai file</div>
              </div>
            </button>
          </div>

          {/* Export */}
          <div>
            <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Export</p>
            <div className="space-y-2">

              <button
                onClick={() => { exportAsDXF(layers, projectName); notify('✓ DXF exported'); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded bg-panel-hover hover:bg-panel-border text-white text-sm"
              >
                <FileCode size={16} className="text-amber-400" />
                <div className="text-left">
                  <div className="font-medium">Export DXF</div>
                  <div className="text-xs text-slate-500">Opens in AutoCAD, FreeCAD, LibreCAD</div>
                </div>
              </button>

              <button
                onClick={() => { exportAsSVG(layers, projectName); notify('✓ SVG exported'); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded bg-panel-hover hover:bg-panel-border text-white text-sm"
              >
                <Download size={16} className="text-accent-green" />
                <div className="text-left">
                  <div className="font-medium">Export SVG</div>
                  <div className="text-xs text-slate-500">Vector — scalable</div>
                </div>
              </button>

              <button
                onClick={() => { exportAsPNG(layers, projectName); notify('✓ PNG exported'); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded bg-panel-hover hover:bg-panel-border text-white text-sm"
              >
                <Image size={16} className="text-zinc-300" />
                <div className="text-left">
                  <div className="font-medium">Export PNG</div>
                  <div className="text-xs text-slate-500">High resolution image</div>
                </div>
              </button>
            </div>
          </div>

          {message && (
            <div className="text-xs text-accent-green text-center py-1 bg-green-950/30 rounded">{message}</div>
          )}
        </div>
      </div>
    </div>
  );
};