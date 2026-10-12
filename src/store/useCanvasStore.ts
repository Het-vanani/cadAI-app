import { create } from 'zustand';
import { autosaveToLocalStorage, loadAutosave } from '../utils/saveUtils';
import { getShapeBoundingBox, computeMultiBoundingBox } from '../utils/geometry';

const generateId = () =>
  `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const defaultLayer = {
  id: generateId(),
  name: 'Layer 1',
  isVisible: true,
  isLocked: false,
  color: '#e4e4e7',
  shapes: [] as any[],
};

interface CanvasStore {
  layers: any[];
  selectedShapeIds: string[];
  activeLayerId: string;
  zoom: number;
  panX: number;
  panY: number;
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  history: any[];
  future: any[];
  clipboard: any[];

  addShape: (shape: any) => void;
  updateShape: (id: string, updates: any) => void;
  updateShapeRaw: (id: string, updates: any) => void;
  deleteShape: (id: string) => void;
  deleteSelectedShapes: () => void;
  selectShape: (id: string, multiSelect?: boolean) => void;
  clearSelection: () => void;
  copyShapes: () => void;
  pasteShapes: () => void;
  rotateSelectedShapes: (delta: number) => void;
  mirrorSelectedShapes: (axis: string) => void;
  alignSelectedShapes: (type: string) => void;
  distributeSelectedShapes: (axis: string) => void;
  groupSelectedShapes: () => void;
  ungroupSelectedShapes: () => void;
  toggleLockSelectedShapes: () => void;
  bringToFront: (id?: string) => void;
  sendToBack: (id?: string) => void;


  undo: () => void;
  redo: () => void;

  addLayer: () => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  renameLayer: (id: string, name: string) => void;
  setActiveLayer: (id: string) => void;

  projectName: string;
  saveStatus: 'idle' | 'saving' | 'saved';
  showShortcutsModal: boolean;
  show3DModal: boolean;
  showTemplatesModal: boolean;
  canvasWidth: number;
  canvasHeight: number;

  setProjectName: (name: string) => void;
  setSaveStatus: (status: 'idle' | 'saving' | 'saved') => void;
  setShowShortcutsModal: (open: boolean) => void;
  setShow3DModal: (open: boolean) => void;
  setShowTemplatesModal: (open: boolean) => void;
  setCanvasSize: (width: number, height: number) => void;
  zoomToFit: (selectedOnly?: boolean) => void;

  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;

  loadProject: (canvasState: any) => void;
  restoreAutosave: () => boolean;

  _saveHistory: () => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  layers: [defaultLayer],
  selectedShapeIds: [],
  activeLayerId: defaultLayer.id,
  zoom: 1,
  panX: 0,
  panY: 0,
  gridSize: 20,
  snapToGrid: true,
  showGrid: true,
  projectName: 'Untitled Project',
  saveStatus: 'idle',
  showShortcutsModal: false,
  show3DModal: false,
  showTemplatesModal: false,
  canvasWidth: typeof window !== 'undefined' ? window.innerWidth : 1200,
  canvasHeight: typeof window !== 'undefined' ? window.innerHeight : 800,

  setProjectName: (name) => set({ projectName: name }),
  setSaveStatus: (status) => set({ saveStatus: status }),
  setShowShortcutsModal: (open) => set({ showShortcutsModal: open }),
  setShow3DModal: (open) => set({ show3DModal: open }),
  setShowTemplatesModal: (open) => set({ showTemplatesModal: open }),
  setCanvasSize: (width, height) => set({ canvasWidth: width, canvasHeight: height }),

  history: [],
  future: [],
  clipboard: [],

  _saveHistory: () => {
    const { layers, history } = get();
    set({
      history: [
        ...history.slice(-49),
        { layers: JSON.parse(JSON.stringify(layers)) },
      ],
      future: [],
    });
  },

  addShape: (shape) => {
    get()._saveHistory();
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === state.activeLayerId
          ? { ...layer, shapes: [...layer.shapes, shape] }
          : layer
      ),
    }));
  },

  // Updates a shape AND saves a history snapshot (for discrete actions)
  updateShape: (id, updates) => {
    get()._saveHistory();
    set((state) => ({
      layers: state.layers.map((layer) => ({
        ...layer,
        shapes: layer.shapes.map((shape: any) =>
          shape.id === id ? { ...shape, ...updates } : shape
        ),
      })),
    }));
  },

  // Updates a shape WITHOUT saving history — used for continuous drag moves
  // Call _saveHistory() once manually at drag start instead
  updateShapeRaw: (id, updates) => {
    set((state) => ({
      layers: state.layers.map((layer) => ({
        ...layer,
        shapes: layer.shapes.map((shape: any) =>
          shape.id === id ? { ...shape, ...updates } : shape
        ),
      })),
    }));
  },

  deleteShape: (id) => {
    get()._saveHistory();
    set((state) => ({
      layers: state.layers.map((layer) => ({
        ...layer,
        shapes: layer.shapes.filter((shape: any) => shape.id !== id),
      })),
      selectedShapeIds: state.selectedShapeIds.filter((sid) => sid !== id),
    }));
  },

  deleteSelectedShapes: () => {
    const { selectedShapeIds } = get();
    if (selectedShapeIds.length === 0) return;
    get()._saveHistory();
    set((state) => ({
      layers: state.layers.map((layer) => ({
        ...layer,
        shapes: layer.shapes.filter(
          (shape: any) => !state.selectedShapeIds.includes(shape.id)
        ),
      })),
      selectedShapeIds: [],
    }));
  },

  // ── Select a shape — if it belongs to a group, select the whole group ──
  selectShape: (id, multiSelect = false) => {
    const { layers } = get();
    const allShapes = layers.flatMap((l: any) => l.shapes);
    const shape = allShapes.find((s: any) => s.id === id);
    if (!shape) return;

    // If shape is part of a group, select all siblings too
    const idsToSelect = shape.groupId
      ? allShapes.filter((s: any) => s.groupId === shape.groupId).map((s: any) => s.id)
      : [id];

    set((state) => {
      if (multiSelect) {
        const allAlreadySelected = idsToSelect.every((gid: string) =>
          state.selectedShapeIds.includes(gid)
        );
        return {
          selectedShapeIds: allAlreadySelected
            ? state.selectedShapeIds.filter((sid) => !idsToSelect.includes(sid))
            : Array.from(new Set([...state.selectedShapeIds, ...idsToSelect])),
        };
      }
      return { selectedShapeIds: idsToSelect };
    });
  },

  clearSelection: () => set({ selectedShapeIds: [] }),

  copyShapes: () => {
    const { layers, selectedShapeIds } = get();
    const allShapes = layers.flatMap((l: any) => l.shapes);
    const copied = allShapes
      .filter((s: any) => selectedShapeIds.includes(s.id))
      .map((s: any) => JSON.parse(JSON.stringify(s)));
    set({ clipboard: copied });
  },

  pasteShapes: () => {
    const { clipboard, activeLayerId } = get();
    if (clipboard.length === 0) return;
    get()._saveHistory();

    const newId = () =>
      `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Pasted shapes get a fresh groupId mapping so groups stay intact
    const groupIdMap = new Map<string, string>();

    const newShapes = clipboard.map((shape: any) => {
      let newGroupId: string | undefined = undefined;
      if (shape.groupId) {
        if (!groupIdMap.has(shape.groupId)) {
          groupIdMap.set(shape.groupId, `group_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);
        }
        newGroupId = groupIdMap.get(shape.groupId);
      }
      return {
        ...JSON.parse(JSON.stringify(shape)),
        id: newId(),
        layerId: activeLayerId,
        isSelected: false,
        groupId: newGroupId,
        x: (shape.x ?? 0) + 20,
        y: (shape.y ?? 0) + 20,
        points: shape.points?.map((p: any) => ({ x: p.x + 20, y: p.y + 20 })),
      };
    });

    set((state) => ({
      layers: state.layers.map((layer: any) =>
        layer.id === activeLayerId
          ? { ...layer, shapes: [...layer.shapes, ...newShapes] }
          : layer
      ),
      selectedShapeIds: newShapes.map((s: any) => s.id),
    }));
  },

  rotateSelectedShapes: (delta: number) => {
    const { selectedShapeIds } = get();
    if (selectedShapeIds.length === 0) return;
    get()._saveHistory();

    set((state) => ({
      layers: state.layers.map((layer: any) => ({
        ...layer,
        shapes: layer.shapes.map((shape: any) => {
          if (!selectedShapeIds.includes(shape.id)) return shape;

          const cx = (shape.x ?? 0) + (shape.width ?? 0) / 2;
          const cy = (shape.y ?? 0) + (shape.height ?? 0) / 2;
          const rad = (delta * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);

          const rotatePoint = (px: number, py: number) => ({
            x: cx + (px - cx) * cos - (py - cy) * sin,
            y: cy + (px - cx) * sin + (py - cy) * cos,
          });

          const newPoints = shape.points?.map((p: any) =>
            rotatePoint(p.x, p.y)
          );

          if (
            (shape.type === 'rectangle' || shape.type === 'ellipse') &&
            (Math.abs(delta) === 90 || Math.abs(delta) === 270)
          ) {
            return {
              ...shape,
              x: cx - (shape.height ?? 0) / 2,
              y: cy - (shape.width ?? 0) / 2,
              width: shape.height ?? 0,
              height: shape.width ?? 0,
              points: newPoints,
              rotation: ((shape.rotation ?? 0) + delta + 360) % 360,
            };
          }

          return {
            ...shape,
            points: newPoints,
            rotation: ((shape.rotation ?? 0) + delta + 360) % 360,
          };
        }),
      })),
    }));
  },

  mirrorSelectedShapes: (axis: string) => {
    const { selectedShapeIds } = get();
    if (selectedShapeIds.length === 0) return;
    get()._saveHistory();

    set((state) => ({
      layers: state.layers.map((layer: any) => ({
        ...layer,
        shapes: layer.shapes.map((shape: any) => {
          if (!selectedShapeIds.includes(shape.id)) return shape;

          const cx = (shape.x ?? 0) + (shape.width ?? 0) / 2;
          const cy = (shape.y ?? 0) + (shape.height ?? 0) / 2;

          if (axis === 'h') {
            const newPoints = shape.points?.map((p: any) => ({
              x: 2 * cx - p.x, y: p.y,
            }));
            return { ...shape, points: newPoints, rotation: (360 - (shape.rotation ?? 0)) % 360 };
          } else {
            const newPoints = shape.points?.map((p: any) => ({
              x: p.x, y: 2 * cy - p.y,
            }));
            return { ...shape, points: newPoints, rotation: (180 - (shape.rotation ?? 0) + 360) % 360 };
          }
        }),
      })),
    }));
  },

  // ── Align selected shapes relative to their combined bounding box ──
  // type: 'left' | 'right' | 'top' | 'bottom' | 'centerH' | 'centerV'
  alignSelectedShapes: (type: string) => {
    const { selectedShapeIds, layers } = get();
    if (selectedShapeIds.length < 2) return;
    get()._saveHistory();

    const allShapes = layers.flatMap((l: any) => l.shapes);
    const selected = allShapes.filter((s: any) => selectedShapeIds.includes(s.id));
    const groupBox = computeMultiBoundingBox(selected);

    set((state) => ({
      layers: state.layers.map((layer: any) => ({
        ...layer,
        shapes: layer.shapes.map((shape: any) => {
          if (!selectedShapeIds.includes(shape.id)) return shape;
          const box = getShapeBoundingBox(shape);
          let dx = 0, dy = 0;

          switch (type) {
            case 'left':
              dx = groupBox.x - box.x;
              break;
            case 'right':
              dx = (groupBox.x + groupBox.width) - (box.x + box.width);
              break;
            case 'top':
              dy = groupBox.y - box.y;
              break;
            case 'bottom':
              dy = (groupBox.y + groupBox.height) - (box.y + box.height);
              break;
            case 'centerH':
              dx = (groupBox.x + groupBox.width / 2) - (box.x + box.width / 2);
              break;
            case 'centerV':
              dy = (groupBox.y + groupBox.height / 2) - (box.y + box.height / 2);
              break;
          }

          return {
            ...shape,
            x: (shape.x ?? 0) + dx,
            y: (shape.y ?? 0) + dy,
            points: shape.points?.map((p: any) => ({ x: p.x + dx, y: p.y + dy })),
          };
        }),
      })),
    }));
  },

  // ── Evenly space 3+ shapes between the first and last (by center) ──
  // axis: 'h' (horizontal spacing) | 'v' (vertical spacing)
  distributeSelectedShapes: (axis: string) => {
    const { selectedShapeIds, layers } = get();
    if (selectedShapeIds.length < 3) return;
    get()._saveHistory();

    const allShapes = layers.flatMap((l: any) => l.shapes);
    const selected = allShapes.filter((s: any) => selectedShapeIds.includes(s.id));

    const withBox = selected.map((s: any) => ({ shape: s, box: getShapeBoundingBox(s) }));
    const sorted = [...withBox].sort((a, b) => {
      const ac = axis === 'h' ? a.box.x + a.box.width / 2 : a.box.y + a.box.height / 2;
      const bc = axis === 'h' ? b.box.x + b.box.width / 2 : b.box.y + b.box.height / 2;
      return ac - bc;
    });

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const firstCenter = axis === 'h'
      ? first.box.x + first.box.width / 2
      : first.box.y + first.box.height / 2;
    const lastCenter = axis === 'h'
      ? last.box.x + last.box.width / 2
      : last.box.y + last.box.height / 2;
    const step = (lastCenter - firstCenter) / (sorted.length - 1);

    const deltas = new Map<string, number>();
    sorted.forEach((item, i) => {
      const targetCenter = firstCenter + step * i;
      const curCenter = axis === 'h'
        ? item.box.x + item.box.width / 2
        : item.box.y + item.box.height / 2;
      deltas.set(item.shape.id, targetCenter - curCenter);
    });

    set((state) => ({
      layers: state.layers.map((layer: any) => ({
        ...layer,
        shapes: layer.shapes.map((shape: any) => {
          if (!deltas.has(shape.id)) return shape;
          const delta = deltas.get(shape.id) ?? 0;
          const dx = axis === 'h' ? delta : 0;
          const dy = axis === 'v' ? delta : 0;
          return {
            ...shape,
            x: (shape.x ?? 0) + dx,
            y: (shape.y ?? 0) + dy,
            points: shape.points?.map((p: any) => ({ x: p.x + dx, y: p.y + dy })),
          };
        }),
      })),
    }));
  },

  // ── Group selected shapes together ──
  groupSelectedShapes: () => {
    const { selectedShapeIds } = get();
    if (selectedShapeIds.length < 2) return;
    get()._saveHistory();

    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    set((state) => ({
      layers: state.layers.map((layer: any) => ({
        ...layer,
        shapes: layer.shapes.map((shape: any) =>
          selectedShapeIds.includes(shape.id) ? { ...shape, groupId } : shape
        ),
      })),
    }));
  },

  // ── Remove group membership from selected shapes ──
  ungroupSelectedShapes: () => {
    const { selectedShapeIds } = get();
    if (selectedShapeIds.length === 0) return;
    get()._saveHistory();

    set((state) => ({
      layers: state.layers.map((layer: any) => ({
        ...layer,
        shapes: layer.shapes.map((shape: any) =>
          selectedShapeIds.includes(shape.id)
            ? { ...shape, groupId: undefined }
            : shape
        ),
      })),
    }));
  },

  // ── Toggle lock on selected shapes (locked shapes can't be moved) ──
  toggleLockSelectedShapes: () => {
    const { selectedShapeIds, layers } = get();
    if (selectedShapeIds.length === 0) return;
    get()._saveHistory();

    const allShapes = layers.flatMap((l: any) => l.shapes);
    const anyUnlocked = allShapes.some(
      (s: any) => selectedShapeIds.includes(s.id) && !s.isLocked
    );

    set((state) => ({
      layers: state.layers.map((layer: any) => ({
        ...layer,
        shapes: layer.shapes.map((shape: any) =>
          selectedShapeIds.includes(shape.id)
            ? { ...shape, isLocked: anyUnlocked }
            : shape
        ),
      })),
    }));
  },

  undo: () => {
    const { history, layers, future } = get();
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    set({
      layers: previous.layers,
      history: history.slice(0, -1),
      future: [
        { layers: JSON.parse(JSON.stringify(layers)) },
        ...future.slice(0, 49),
      ],
      selectedShapeIds: [],
    });
  },

  redo: () => {
    const { future, layers, history } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      layers: next.layers,
      future: future.slice(1),
      history: [
        ...history.slice(-49),
        { layers: JSON.parse(JSON.stringify(layers)) },
      ],
      selectedShapeIds: [],
    });
  },

  addLayer: () => {
    const newLayer = {
      id: generateId(),
      name: `Layer ${get().layers.length + 1}`,
      isVisible: true,
      isLocked: false,
      color: '#00d4aa',
      shapes: [],
    };
    set((state) => ({
      layers: [...state.layers, newLayer],
      activeLayerId: newLayer.id,
    }));
  },

  toggleLayerVisibility: (id) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, isVisible: !l.isVisible } : l
      ),
    })),

  toggleLayerLock: (id) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, isLocked: !l.isLocked } : l
      ),
    })),

  renameLayer: (id, name) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, name } : l
      ),
    })),

  setActiveLayer: (id) => set({ activeLayerId: id }),

  bringToFront: (id) => {
    get()._saveHistory();
    const ids = id ? [id] : get().selectedShapeIds;
    set((state) => ({
      layers: state.layers.map((layer) => {
        const toMove = layer.shapes.filter((s: any) => ids.includes(s.id));
        if (toMove.length === 0) return layer;
        const remaining = layer.shapes.filter((s: any) => !ids.includes(s.id));
        return { ...layer, shapes: [...remaining, ...toMove] };
      }),
    }));
  },

  sendToBack: (id) => {
    get()._saveHistory();
    const ids = id ? [id] : get().selectedShapeIds;
    set((state) => ({
      layers: state.layers.map((layer) => {
        const toMove = layer.shapes.filter((s: any) => ids.includes(s.id));
        if (toMove.length === 0) return layer;
        const remaining = layer.shapes.filter((s: any) => !ids.includes(s.id));
        return { ...layer, shapes: [...toMove, ...remaining] };
      }),
    }));
  },
  setZoom: (zoom) => set({ zoom: Math.min(Math.max(zoom, 0.1), 20) }),
  setPan: (panX, panY) => set({ panX, panY }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

  zoomToFit: (selectedOnly = false) => {
    const { layers, selectedShapeIds, canvasWidth, canvasHeight } = get();
    const visibleLayers = layers.filter((l: any) => l.isVisible);
    let targetShapes = visibleLayers.flatMap((l: any) => l.shapes);

    if (selectedOnly) {
      targetShapes = targetShapes.filter((s: any) => selectedShapeIds.includes(s.id));
    }

    if (targetShapes.length === 0) {
      set({ zoom: 1, panX: 0, panY: 0 });
      return;
    }

    const box = computeMultiBoundingBox(targetShapes);
    if (box.width <= 0 && box.height <= 0) {
      set({
        zoom: 1,
        panX: canvasWidth / 2 - box.x,
        panY: canvasHeight / 2 - box.y,
      });
      return;
    }

    const padding = 80;
    const availableW = Math.max(canvasWidth - padding * 2, 80);
    const availableH = Math.max(canvasHeight - padding * 2, 80);
    const fitZoom = Math.min(
      availableW / Math.max(box.width, 10),
      availableH / Math.max(box.height, 10)
    );
    const clampedZoom = Math.min(Math.max(fitZoom, 0.05), 10);
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const panX = canvasWidth / 2 - centerX * clampedZoom;
    const panY = canvasHeight / 2 - centerY * clampedZoom;

    set({ zoom: clampedZoom, panX, panY });
  },

  loadProject: (projectOrState) => {
    if (projectOrState.canvasState) {
      set({
        ...projectOrState.canvasState,
        projectName: projectOrState.name || 'Untitled Project',
        selectedShapeIds: [],
        history: [],
        future: [],
      });
    } else {
      set({
        ...projectOrState,
        selectedShapeIds: [],
        history: [],
        future: [],
      });
    }
  },

  restoreAutosave: () => {
    const saved = loadAutosave();
    if (saved && saved.canvasState) {
      set({
        ...saved.canvasState,
        projectName: saved.projectName || 'Untitled Project',
        selectedShapeIds: [],
        history: [],
        future: [],
      });
      return true;
    }
    return false;
  },
}));

let prevLayers = useCanvasStore.getState().layers;
let prevName = useCanvasStore.getState().projectName;
let saveTimer: any = null;
let resetTimer: any = null;

useCanvasStore.subscribe((state) => {
  if (state.layers === prevLayers && state.projectName === prevName) {
    return;
  }
  prevLayers = state.layers;
  prevName = state.projectName;

  useCanvasStore.setState({ saveStatus: 'saving' });

  if (saveTimer) clearTimeout(saveTimer);
  if (resetTimer) clearTimeout(resetTimer);

  saveTimer = setTimeout(() => {
    autosaveToLocalStorage(
      {
        layers: state.layers,
        selectedShapeIds: [],
        activeLayerId: state.activeLayerId,
        zoom: state.zoom,
        panX: state.panX,
        panY: state.panY,
        gridSize: state.gridSize,
        snapToGrid: state.snapToGrid,
        showGrid: state.showGrid,
      },
      state.projectName
    );

    useCanvasStore.setState({ saveStatus: 'saved' });

    resetTimer = setTimeout(() => {
      useCanvasStore.setState({ saveStatus: 'idle' });
    }, 1500);
  }, 400);
});