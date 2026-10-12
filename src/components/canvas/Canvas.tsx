import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, Ellipse, Path, Text as KonvaText } from 'react-konva';
import Konva from 'konva';
import { Grid } from './Grid';
import { SnapIndicator } from './SnapIndicator';
import { DimensionShape } from './DimensionShape';
import { TextEditor } from './TextEditor';
import { SelectionHandles } from './SelectionHandles';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useToolStore } from '../../store/useToolStore';
import { CADShape, Point } from '../../types';
import {
  screenToCanvas, generateId, getBoundingBox, getShapeBoundingBox,
  findNearestSnapPoint, computeArcPath, distance,
  computeMultiBoundingBox, SnapPoint
} from '../../utils/geometry';

interface CanvasProps {
  onMouseMove?: (x: number, y: number) => void;
}

export const Canvas: React.FC<CanvasProps> = ({ onMouseMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const [size, setSize] = useState({ width: 800, height: 600 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [previewShape, setPreviewShape] = useState<Partial<CADShape> | null>(null);
  const [activeSnap, setActiveSnap] = useState<SnapPoint | null>(null);

  // Polyline
  const [polylinePoints, setPolylinePoints] = useState<Point[]>([]);
  const [polylineCursor, setPolylineCursor] = useState<Point | null>(null);

  // Dimension
  const [dimStart, setDimStart] = useState<Point | null>(null);
  const [dimCursor, setDimCursor] = useState<Point | null>(null);

  // Arc
  const [arcStep, setArcStep] = useState(0);
  const [arcCenter, setArcCenter] = useState<Point | null>(null);
  const [arcStartPt, setArcStartPt] = useState<Point | null>(null);
  const [arcCursor, setArcCursor] = useState<Point | null>(null);

  // Text editor
  const [textPos, setTextPos] = useState<{ x: number; y: number; cx: number; cy: number } | null>(null);

  // Pan
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [panStartOffset, setPanStartOffset] = useState({ x: 0, y: 0 });
  const [isSpaceDown, setIsSpaceDown] = useState(false); // Space-key pan modifier

  // Move — now supports multiple shapes at once (groups / multi-select)
  const [isMoving, setIsMoving] = useState(false);
  const [moveStart, setMoveStart] = useState<Point | null>(null);
  const [movingShapeIds, setMovingShapeIds] = useState<string[]>([]);
  const [moveOriginalPositions, setMoveOriginalPositions] = useState
    <{ id: string; x: number; y: number; points: Point[] }[]
    >([]);

  const {
    layers, zoom, panX, panY, gridSize,
    snapToGrid: snapEnabled, showGrid,
    addShape, updateShapeRaw, selectShape, clearSelection,
    setZoom, setPan, selectedShapeIds, setCanvasSize,
    copyShapes, pasteShapes, deleteSelectedShapes, deleteShape,
  } = useCanvasStore();

  // Marquee selection
  const [selectionBoxStart, setSelectionBoxStart] = useState<Point | null>(null);
  const [selectionBoxCurrent, setSelectionBoxCurrent] = useState<Point | null>(null);

  // Right-click context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; shapeId: string } | null>(null);

  const { activeTool, strokeColor, fillColor, strokeWidth } = useToolStore();

  useEffect(() => {
    const resize = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        const h = containerRef.current.offsetHeight;
        setSize({ width: w, height: h });
        setCanvasSize(w, h);
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [setCanvasSize]);

  const finishPolyline = useCallback(() => {
    if (polylinePoints.length < 2) return;
    const shape: CADShape = {
      id: generateId(), type: 'polyline',
      layerId: useCanvasStore.getState().activeLayerId,
      stroke: strokeColor, strokeWidth, fill: 'transparent',
      opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
      points: polylinePoints,
      x: Math.min(...polylinePoints.map(p => p.x)),
      y: Math.min(...polylinePoints.map(p => p.y)),
      width: Math.max(...polylinePoints.map(p => p.x)) - Math.min(...polylinePoints.map(p => p.x)),
      height: Math.max(...polylinePoints.map(p => p.y)) - Math.min(...polylinePoints.map(p => p.y)),
    };
    addShape(shape);
    setPolylinePoints([]); setPolylineCursor(null); setIsDrawing(false);
  }, [polylinePoints, strokeColor, strokeWidth, addShape]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        setSelectionBoxStart(null);
        setSelectionBoxCurrent(null);
        setIsDrawing(false);
        setDrawStart(null);
        setPreviewShape(null);
        setIsMoving(false);
        setMoveStart(null);
        setMovingShapeIds([]);
        setMoveOriginalPositions([]);
        if (activeTool === 'polyline') { setPolylinePoints([]); setPolylineCursor(null); }
        if (activeTool === 'dimension') { setDimStart(null); setDimCursor(null); }
        if (activeTool === 'arc') { setArcStep(0); setArcCenter(null); setArcStartPt(null); setArcCursor(null); }
        if (activeTool === 'text') setTextPos(null);
        setContextMenu(null);
      }
      // Delete / Backspace — remove selected shapes
      if ((e.key === 'Delete' || e.key === 'Backspace') && useCanvasStore.getState().selectedShapeIds.length > 0) {
        deleteSelectedShapes();
      }
      if (e.key === 'Enter' && activeTool === 'polyline' && polylinePoints.length >= 2) {
        finishPolyline();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeTool, polylinePoints, finishPolyline, deleteSelectedShapes]);

  // Space key — temporary pan mode (press+hold Space to pan from any tool)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        setIsSpaceDown(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpaceDown(false);
        // If we were space-panning, stop it cleanly
        setIsPanning(prev => {
          if (prev) { setPanStart(null); }
          return false;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Cleanly reset any in-flight actions when switching tools
  useEffect(() => {
    setSelectionBoxStart(null);
    setSelectionBoxCurrent(null);
    setIsDrawing(false);
    setDrawStart(null);
    setPreviewShape(null);
    setDimStart(null);
    setDimCursor(null);
    setArcStep(0);
    setArcCenter(null);
    setArcStartPt(null);
    setArcCursor(null);
    setIsMoving(false);
    setMoveStart(null);
    setMovingShapeIds([]);
    setMoveOriginalPositions([]);
  }, [activeTool]);

  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

  const getSnappedPoint = useCallback((screenPos: { x: number; y: number }) => {
    const rawPoint = screenToCanvas(screenPos.x, screenPos.y, panX, panY, zoom);
    if (!snapEnabled) return { point: rawPoint, snap: null };
    const snapRadius = 14 / zoom;
    const snap = findNearestSnapPoint(rawPoint, layers, snapRadius, gridSize, snapEnabled);
    return { point: snap ? snap.point : rawPoint, snap };
  }, [panX, panY, zoom, snapEnabled, layers, gridSize]);

  const handleTextConfirm = useCallback((text: string) => {
    if (!textPos) return;
    const fs = useToolStore.getState().fontSize ?? 16;
    const shape: any = {
      id: generateId(), type: 'text',
      layerId: useCanvasStore.getState().activeLayerId,
      stroke: strokeColor, strokeWidth: 1, fill: strokeColor,
      opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
      label: text, fontSize: fs,
      points: [{ x: textPos.cx, y: textPos.cy }],
      x: textPos.cx, y: textPos.cy,
      width: text.length * (fs * 0.65), height: fs * 1.4,
    };
    addShape(shape);
    setTextPos(null);
  }, [textPos, strokeColor, addShape]);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (e.evt.button === 1) {
      e.evt.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.evt.clientX, y: e.evt.clientY });
      setPanStartOffset({ x: panX, y: panY });
      return;
    }
    // Only primary left button (0) should trigger drawing, selection, or tool action
    if (e.evt.button !== 0) {
      return;
    }

    if (activeTool === 'pan' || isSpaceDown) {
      setIsPanning(true);
      setPanStart({ x: e.evt.clientX, y: e.evt.clientY });
      setPanStartOffset({ x: panX, y: panY });
      return;
    }

    const { point } = getSnappedPoint(pos);

    if (activeTool === 'text') {
      const rect = containerRef.current?.getBoundingClientRect();
      setTextPos({
        x: (rect?.left ?? 0) + pos.x,
        y: (rect?.top ?? 0) + pos.y,
        cx: point.x, cy: point.y,
      });
      return;
    }

    if (activeTool === 'arc') {
      if (arcStep === 0) { setArcCenter(point); setArcStep(1); }
      else if (arcStep === 1) { setArcStartPt(point); setArcStep(2); }
      else if (arcStep === 2 && arcCenter && arcStartPt) {
        const r = distance(arcCenter, arcStartPt);
        const arcShape: CADShape = {
          id: generateId(), type: 'arc',
          layerId: useCanvasStore.getState().activeLayerId,
          stroke: strokeColor, strokeWidth, fill: 'transparent',
          opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
          points: [arcCenter, arcStartPt, point],
          x: arcCenter.x, y: arcCenter.y, radius: r, width: r * 2, height: r * 2,
        };
        addShape(arcShape);
        setArcStep(0); setArcCenter(null); setArcStartPt(null); setArcCursor(null);
      }
      return;
    }

    if (activeTool === 'dimension') {
      if (!dimStart) { setDimStart(point); setDimCursor(point); }
      else {
        const dimShape: CADShape = {
          id: generateId(), type: 'dimension',
          layerId: useCanvasStore.getState().activeLayerId,
          stroke: '#00d4aa', strokeWidth: 1, fill: 'transparent',
          opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
          points: [dimStart, point],
          x: Math.min(dimStart.x, point.x), y: Math.min(dimStart.y, point.y),
          width: Math.abs(point.x - dimStart.x), height: Math.abs(point.y - dimStart.y),
        };
        addShape(dimShape);
        setDimStart(null); setDimCursor(null);
      }
      return;
    }
    if (activeTool === 'polyline') { setPolylinePoints(prev => [...prev, point]); setIsDrawing(true); return; }
    if (activeTool === 'select') {
      if (e.target === stage) {
        const isMulti = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
        if (!isMulti) {
          clearSelection();
        }
        const rawPoint = screenToCanvas(pos.x, pos.y, panX, panY, zoom);
        setSelectionBoxStart(rawPoint);
        setSelectionBoxCurrent(rawPoint);
        setContextMenu(null);
      }
      return;
    }

    if (activeTool === 'eraser') {
      return;
    }

    setIsDrawing(true);
    setDrawStart(point);
    setPreviewShape({
      id: generateId(), type: activeTool as CADShape['type'],
      stroke: strokeColor, strokeWidth, fill: fillColor,
      opacity: 1, points: [point, point],
      x: point.x, y: point.y, width: 0, height: 0, radius: 0,
      rotation: 0, isSelected: false, isLocked: false, isVisible: true, layerId: '',
    });
  }, [activeTool, getSnappedPoint, clearSelection, strokeColor, strokeWidth,
    fillColor, panX, panY, dimStart, arcStep, arcCenter, arcStartPt, addShape]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Safety guard: If no mouse button is currently held down, cancel any stuck drag operations immediately
    if ((e.evt.buttons & 1) === 0) {
      if (selectionBoxStart) {
        setSelectionBoxStart(null);
        setSelectionBoxCurrent(null);
      }
      if (isMoving) {
        setIsMoving(false);
        setMoveStart(null);
        setMovingShapeIds([]);
        setMoveOriginalPositions([]);
      }
      if (isDrawing) {
        setIsDrawing(false);
        setPreviewShape(null);
        setDrawStart(null);
      }
      // Only auto-cancel panning if it was triggered by middle-mouse (not the Pan tool or Space pan)
      if (isPanning && activeTool !== 'pan' && !isSpaceDown && (e.evt.buttons & 4) === 0) {
        setIsPanning(false);
        setPanStart(null);
      }
    }

    if (isPanning && panStart) {
      setPan(panStartOffset.x + e.evt.clientX - panStart.x, panStartOffset.y + e.evt.clientY - panStart.y);
      return;
    }

    const { point, snap } = getSnappedPoint(pos);
    setActiveSnap(snap);
    onMouseMove?.(point.x, point.y);

    if (selectionBoxStart) {
      setSelectionBoxCurrent(screenToCanvas(pos.x, pos.y, panX, panY, zoom));
      return;
    }

    if (activeTool === 'arc') { setArcCursor(point); return; }
    if (activeTool === 'dimension' && dimStart) { setDimCursor(point); return; }
    if (activeTool === 'polyline') { setPolylineCursor(point); return; }

    // ── Multi-shape move (handles groups and multi-select together) ──
    if (activeTool === 'move' && isMoving && moveStart && movingShapeIds.length > 0) {
      const dx = point.x - moveStart.x;
      const dy = point.y - moveStart.y;
      moveOriginalPositions.forEach((orig) => {
        updateShapeRaw(orig.id, {
          x: orig.x + dx,
          y: orig.y + dy,
          points: orig.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
        });
      });
      return;
    }

    if (!isDrawing || !drawStart) return;
    const box = getBoundingBox(drawStart, point);
    setPreviewShape(prev => prev ? {
      ...prev, points: [drawStart, point],
      x: box.x, y: box.y, width: box.width, height: box.height,
      radius: activeTool === 'circle' ? Math.max(box.width, box.height) / 2 : 0,
    } : null);
  }, [isPanning, panStart, panStartOffset, getSnappedPoint, isDrawing, drawStart,
    activeTool, onMouseMove, setPan, isMoving, moveStart, movingShapeIds,
    moveOriginalPositions, updateShapeRaw, dimStart, selectionBoxStart, panX, panY, zoom, isSpaceDown]);

  const handleMouseUp = useCallback((e?: any) => {
    if (isPanning) { setIsPanning(false); setPanStart(null); return; }

    if (selectionBoxStart) {
      if (selectionBoxCurrent) {
        const minX = Math.min(selectionBoxStart.x, selectionBoxCurrent.x);
        const maxX = Math.max(selectionBoxStart.x, selectionBoxCurrent.x);
        const minY = Math.min(selectionBoxStart.y, selectionBoxCurrent.y);
        const maxY = Math.max(selectionBoxStart.y, selectionBoxCurrent.y);

        if (maxX - minX > 4 || maxY - minY > 4) {
          const hitIds: string[] = [];
          const currentLayers = useCanvasStore.getState().layers;
          const currentSelected = useCanvasStore.getState().selectedShapeIds;
          const visibleShapes = currentLayers
            .filter((l: any) => l.isVisible && !l.isLocked)
            .flatMap((l: any) => l.shapes);

          visibleShapes.forEach((s: any) => {
            const b = getShapeBoundingBox(s);
            const intersects = !(
              b.x + b.width < minX ||
              b.x > maxX ||
              b.y + b.height < minY ||
              b.y > maxY
            );
            if (intersects) {
              hitIds.push(s.id);
            }
          });

          const isMulti = e?.evt ? (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey) : (e?.shiftKey || e?.ctrlKey || e?.metaKey || false);
          if (isMulti) {
            const combined = Array.from(new Set([...currentSelected, ...hitIds]));
            useCanvasStore.setState({ selectedShapeIds: combined });
          } else {
            useCanvasStore.setState({ selectedShapeIds: hitIds });
          }
        }
      }

      setSelectionBoxStart(null);
      setSelectionBoxCurrent(null);
      return;
    }

    if (isMoving) {
      setIsMoving(false);
      setMoveStart(null);
      setMovingShapeIds([]);
      setMoveOriginalPositions([]);
      return;
    }

    if (!isDrawing || !previewShape || !drawStart) return;

    const box = getBoundingBox(
      previewShape.points?.[0] ?? drawStart,
      previewShape.points?.[1] ?? drawStart
    );
    if (box.width < 3 && box.height < 3 && activeTool !== 'line') {
      setIsDrawing(false); setPreviewShape(null); setDrawStart(null); return;
    }

    const finalShape: CADShape = {
      id: generateId(), type: activeTool as CADShape['type'],
      layerId: useCanvasStore.getState().activeLayerId,
      stroke: strokeColor, strokeWidth, fill: fillColor,
      opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
      points: previewShape.points ?? [],
      x: box.x, y: box.y, width: box.width, height: box.height,
      radius: activeTool === 'circle' ? Math.max(box.width, box.height) / 2 : 0,
    };
    addShape(finalShape);
    setIsDrawing(false); setPreviewShape(null); setDrawStart(null);
  }, [isPanning, selectionBoxStart, selectionBoxCurrent, isMoving, isDrawing, previewShape, drawStart, activeTool,
    strokeColor, strokeWidth, fillColor, addShape]);

  // Global mouseup and window blur listeners to guarantee no stuck drag/selection states
  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (selectionBoxStart || isMoving || isDrawing || isPanning) {
        handleMouseUp(e);
      }
    };
    const handleBlur = () => {
      setSelectionBoxStart(null);
      setSelectionBoxCurrent(null);
      setIsMoving(false);
      setMoveStart(null);
      setMovingShapeIds([]);
      setMoveOriginalPositions([]);
      setIsPanning(false);
      setPanStart(null);
      setIsDrawing(false);
      setPreviewShape(null);
      setDrawStart(null);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [selectionBoxStart, isMoving, isDrawing, isPanning, handleMouseUp]);

  const handleMouseLeave = useCallback(() => { setActiveSnap(null); setArcCursor(null); }, []);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const scaleBy = 1.08, oldZoom = zoom;
    const newZoom = e.evt.deltaY < 0 ? Math.min(oldZoom * scaleBy, 20) : Math.max(oldZoom / scaleBy, 0.1);
    const mousePointTo = { x: (pointer.x - panX) / oldZoom, y: (pointer.y - panY) / oldZoom };
    setZoom(newZoom);
    setPan(pointer.x - mousePointTo.x * newZoom, pointer.y - mousePointTo.y * newZoom);
  }, [zoom, panX, panY, setZoom, setPan]);

  // ── Start dragging a shape (or its whole group / multi-selection) ──
  const startMoveDrag = useCallback((shape: any, screenPos: { x: number; y: number }) => {
    if (shape.isLocked) {
      // Locked shapes can still be selected (so user can unlock them) but not dragged
      if (shape.id) selectShape(shape.id);
      return;
    }

    const point = screenToCanvas(screenPos.x, screenPos.y, panX, panY, zoom);
    const store = useCanvasStore.getState();

    let idsToMove: string[];
    if (store.selectedShapeIds.includes(shape.id) && store.selectedShapeIds.length > 1) {
      // Already part of a multi-selection — move everything together
      idsToMove = store.selectedShapeIds;
    } else {
      // Select this shape (or its group) first, then move just that
      selectShape(shape.id);
      idsToMove = useCanvasStore.getState().selectedShapeIds;
    }

    // Save ONE history snapshot at drag start (not on every pixel of movement)
    (useCanvasStore.getState() as any)._saveHistory();

    const allShapes = layers.flatMap((l: any) => l.shapes);
    const origins = idsToMove.map((id) => {
      const s = allShapes.find((sh: any) => sh.id === id);
      return { id, x: s?.x ?? 0, y: s?.y ?? 0, points: s?.points ? [...s.points] : [] };
    });

    setIsMoving(true);
    setMoveStart(point);
    setMovingShapeIds(idsToMove);
    setMoveOriginalPositions(origins);
  }, [layers, panX, panY, zoom, selectShape]);

  const handleShapeContextMenu = useCallback((e: any, shapeId?: string) => {
    if (!shapeId) return;
    e.evt.preventDefault();
    e.cancelBubble = true;
    if (!selectedShapeIds.includes(shapeId)) {
      selectShape(shapeId, false);
    }
    setContextMenu({
      x: e.evt.clientX,
      y: e.evt.clientY,
      shapeId,
    });
  }, [selectedShapeIds, selectShape]);

  const renderShape = useCallback((shape: Partial<CADShape>, key: string) => {
    const isSelected = selectedShapeIds.includes(shape.id ?? '');
    const isInteractive = activeTool === 'select' || activeTool === 'move' || activeTool === 'eraser';

    const handleShapeClick = (e: any) => {
      if (!shape.id) return;
      if (activeTool === 'eraser') {
        deleteShape(shape.id);
        return;
      }
      const multi = e?.evt ? (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey) : (e.shiftKey || e.ctrlKey || e.metaKey);
      selectShape(shape.id, multi);
    };

    if (shape.type === 'dimension' && shape.points?.[0] && shape.points?.[1]) {
      return <DimensionShape key={key} p1={shape.points[0]} p2={shape.points[1]}
        zoom={zoom} panX={panX} panY={panY} isSelected={isSelected}
        onClick={handleShapeClick}
        onContextMenu={(e: any) => handleShapeContextMenu(e, shape.id)}
      />;
    }

    if (shape.type === 'arc' && shape.points?.[0] && shape.points?.[1] && shape.points?.[2]) {
      const pathData = computeArcPath(shape.points[0], shape.points[1], shape.points[2], zoom, panX, panY);
      if (!pathData) return null;
      return <Path key={key} data={pathData}
        stroke={shape.stroke ?? '#e4e4e7'}
        strokeWidth={(shape.strokeWidth ?? 1.5) * (1 / zoom)}
        fill="transparent" opacity={shape.opacity ?? 1}
        shadowColor={isSelected ? '#a1a1aa' : undefined}
        shadowBlur={isSelected ? 8 : 0}
        listening={isInteractive}
        onClick={handleShapeClick}
        onContextMenu={(e: any) => handleShapeContextMenu(e, shape.id)}
      />;
    }

    if (shape.type === 'text' && shape.label) {
      const tx = (shape.x ?? 0) * zoom + panX;
      const ty = (shape.y ?? 0) * zoom + panY;
      const storedSize = (shape as any).fontSize ?? 16;
      const displaySize = Math.max(storedSize * zoom, 10);
      return <KonvaText key={key}
        x={tx} y={ty}
        text={shape.label}
        fontSize={displaySize}
        fontFamily="Inter, system-ui, sans-serif"
        fill={shape.fill || shape.stroke || '#e4e4e7'}
        opacity={shape.opacity ?? 1}
        shadowColor={isSelected ? '#a1a1aa' : undefined}
        shadowBlur={isSelected ? 8 : 0}
        listening={isInteractive}
        onClick={handleShapeClick}
        onContextMenu={(e: any) => handleShapeContextMenu(e, shape.id)}
        onMouseDown={(e: any) => {
          if (activeTool !== 'move') return;
          e.cancelBubble = true;
          const stage = stageRef.current;
          const pos = stage?.getPointerPosition();
          if (pos) startMoveDrag(shape, pos);
        }} />;
    }

    const stroke = shape.stroke ?? '#e4e4e7';
    const strokeWidth = (shape.strokeWidth ?? 1.5) * (1 / zoom);
    const fill = shape.fill === 'transparent' ? 'transparent' : (shape.fill ?? 'transparent');
    const opacity = shape.opacity ?? 1;
    const shadowColor = isSelected ? '#a1a1aa' : undefined;
    const shadowBlur = isSelected ? 8 : 0;
    const listening = isInteractive;
    const handleMouseDownShape = (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool !== 'move') return;
      e.cancelBubble = true;
      const stage = stageRef.current;
      const pos = stage?.getPointerPosition();
      if (pos) startMoveDrag(shape, pos);
    };

    const tx = (x: number) => x * zoom + panX;
    const ty = (y: number) => y * zoom + panY;

    switch (shape.type) {
      case 'line':
        return (
          <Line
            key={key}
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill={fill}
            opacity={opacity}
            shadowColor={shadowColor}
            shadowBlur={shadowBlur}
            listening={listening}
            onClick={handleShapeClick}
            onContextMenu={(e: any) => handleShapeContextMenu(e, shape.id)}
            onMouseDown={handleMouseDownShape}
            points={[tx(shape.points?.[0]?.x ?? 0), ty(shape.points?.[0]?.y ?? 0), tx(shape.points?.[1]?.x ?? 0), ty(shape.points?.[1]?.y ?? 0)]}
          />
        );
      case 'polyline':
        return (
          <Line
            key={key}
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill={fill}
            opacity={opacity}
            shadowColor={shadowColor}
            shadowBlur={shadowBlur}
            listening={listening}
            onClick={handleShapeClick}
            onContextMenu={(e: any) => handleShapeContextMenu(e, shape.id)}
            onMouseDown={handleMouseDownShape}
            points={(shape.points ?? []).flatMap(p => [tx(p.x), ty(p.y)])}
          />
        );
      case 'rectangle':
        return (
          <Rect
            key={key}
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill={fill}
            opacity={opacity}
            shadowColor={shadowColor}
            shadowBlur={shadowBlur}
            listening={listening}
            onClick={handleShapeClick}
            onContextMenu={(e: any) => handleShapeContextMenu(e, shape.id)}
            onMouseDown={handleMouseDownShape}
            x={tx(shape.x ?? 0)}
            y={ty(shape.y ?? 0)}
            width={(shape.width ?? 0) * zoom}
            height={(shape.height ?? 0) * zoom}
          />
        );
      case 'circle':
        return (
          <Circle
            key={key}
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill={fill}
            opacity={opacity}
            shadowColor={shadowColor}
            shadowBlur={shadowBlur}
            listening={listening}
            onClick={handleShapeClick}
            onContextMenu={(e: any) => handleShapeContextMenu(e, shape.id)}
            onMouseDown={handleMouseDownShape}
            x={tx((shape.x ?? 0) + (shape.width ?? 0) / 2)}
            y={ty((shape.y ?? 0) + (shape.height ?? 0) / 2)}
            radius={(shape.radius ?? 0) * zoom}
          />
        );
      case 'ellipse':
        return (
          <Ellipse
            key={key}
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill={fill}
            opacity={opacity}
            shadowColor={shadowColor}
            shadowBlur={shadowBlur}
            listening={listening}
            onClick={handleShapeClick}
            onContextMenu={(e: any) => handleShapeContextMenu(e, shape.id)}
            onMouseDown={handleMouseDownShape}
            x={tx((shape.x ?? 0) + (shape.width ?? 0) / 2)}
            y={ty((shape.y ?? 0) + (shape.height ?? 0) / 2)}
            radiusX={((shape.width ?? 0) / 2) * zoom}
            radiusY={((shape.height ?? 0) / 2) * zoom}
          />
        );
      default:
        return null;
    }
  }, [zoom, panX, panY, selectedShapeIds, activeTool, selectShape, deleteShape, startMoveDrag]);

  const getCursor = () => {
    if (isPanning) return 'grabbing';
    if (activeTool === 'pan' || isSpaceDown) return 'grab';
    if (activeTool === 'move') return 'move';
    if (activeTool === 'select') return 'default';
    if (activeTool === 'text') return 'text';
    if (activeTool === 'eraser') return 'pointer';
    return 'crosshair';
  };

  const polylinePreviewPoints = [...polylinePoints, ...(polylineCursor ? [polylineCursor] : [])]
    .flatMap(p => [p.x * zoom + panX, p.y * zoom + panY]);

  const arcPreviewPath = arcStep === 2 && arcCenter && arcStartPt && arcCursor
    ? computeArcPath(arcCenter, arcStartPt, arcCursor, zoom, panX, panY) : null;

  const containerRect = containerRef.current?.getBoundingClientRect();

  // Data for selection visuals
  const allShapes = layers.flatMap((l: any) => l.shapes);
  const selectedShapesData = allShapes.filter((s: any) => selectedShapeIds.includes(s.id));
  const singleSelected = selectedShapesData.length === 1 ? selectedShapesData[0] : null;
  const multiBox = selectedShapesData.length > 1 ? computeMultiBoundingBox(selectedShapesData) : null;

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden bg-canvas-bg relative" style={{ cursor: getCursor() }}>
      <Stage ref={stageRef} width={size.width} height={size.height}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave} onWheel={handleWheel}
      >
        <Layer listening={false}>
          {showGrid && <Grid width={size.width} height={size.height} gridSize={gridSize} panX={panX} panY={panY} zoom={zoom} />}
        </Layer>

        <Layer>
          {layers.filter((l: any) => l.isVisible)
            .flatMap((layer: any) => layer.shapes.map((shape: any) => renderShape(shape, shape.id)))}
        </Layer>

        <Layer listening={false}>
          {isDrawing && previewShape && renderShape(previewShape, 'preview')}

          {activeTool === 'polyline' && polylinePreviewPoints.length >= 4 && (
            <Line points={polylinePreviewPoints} stroke={strokeColor}
              strokeWidth={strokeWidth * (1 / zoom)} dash={[6 / zoom, 4 / zoom]} listening={false} />
          )}
          {activeTool === 'polyline' && polylinePoints.map((p, i) => (
            <Circle key={i} x={p.x * zoom + panX} y={p.y * zoom + panY} radius={3} fill={strokeColor} listening={false} />
          ))}

          {activeTool === 'dimension' && dimStart && dimCursor && (
            <DimensionShape p1={dimStart} p2={dimCursor} zoom={zoom} panX={panX} panY={panY} isPreview={true} />
          )}

          {activeTool === 'arc' && arcStep === 1 && arcCenter && arcCursor && (
            <Line points={[arcCenter.x * zoom + panX, arcCenter.y * zoom + panY, arcCursor.x * zoom + panX, arcCursor.y * zoom + panY]}
              stroke={strokeColor} strokeWidth={1} dash={[4, 4]} listening={false} />
          )}
          {activeTool === 'arc' && arcStep === 2 && arcCenter && arcStartPt && (
            <>
              <Circle x={arcCenter.x * zoom + panX} y={arcCenter.y * zoom + panY} radius={4} fill={strokeColor} listening={false} />
              <Circle x={arcStartPt.x * zoom + panX} y={arcStartPt.y * zoom + panY} radius={4} fill={strokeColor} listening={false} />
              {arcPreviewPath && <Path data={arcPreviewPath} stroke={strokeColor} strokeWidth={strokeWidth * (1 / zoom)} fill="transparent" dash={[5 / zoom, 3 / zoom]} listening={false} />}
            </>
          )}
        </Layer>

        <Layer listening={false}>
          {activeSnap && <SnapIndicator snap={activeSnap} zoom={zoom} panX={panX} panY={panY} />}
        </Layer>

        {/* ── Selection visuals — single shape gets full handles, multi gets simple box ── */}
        <Layer>
          {/* Marquee selection drag box */}
          {selectionBoxStart && selectionBoxCurrent &&
            (Math.abs(selectionBoxCurrent.x - selectionBoxStart.x) * zoom > 3 ||
             Math.abs(selectionBoxCurrent.y - selectionBoxStart.y) * zoom > 3) && (
            <Rect
              x={Math.min(selectionBoxStart.x, selectionBoxCurrent.x) * zoom + panX}
              y={Math.min(selectionBoxStart.y, selectionBoxCurrent.y) * zoom + panY}
              width={Math.abs(selectionBoxCurrent.x - selectionBoxStart.x) * zoom}
              height={Math.abs(selectionBoxCurrent.y - selectionBoxStart.y) * zoom}
              fill="rgba(161, 161, 170, 0.12)"
              stroke="#a1a1aa"
              strokeWidth={1}
              dash={[5, 3]}
              listening={false}
            />
          )}

          {singleSelected && (
            <SelectionHandles
              shape={singleSelected}
              zoom={zoom} panX={panX} panY={panY}
              onRotateCW={() => (useCanvasStore.getState() as any).rotateSelectedShapes(90)}
              onRotateCCW={() => (useCanvasStore.getState() as any).rotateSelectedShapes(-90)}
            />
          )}

          {multiBox && (
            <Rect
              x={multiBox.x * zoom + panX - 10}
              y={multiBox.y * zoom + panY - 10}
              width={multiBox.width * zoom + 20}
              height={multiBox.height * zoom + 20}
              stroke="#00d4aa" strokeWidth={1.5}
              dash={[7, 4]} fill="transparent"
              listening={false}
            />
          )}
        </Layer>
      </Stage>

      {/* Right-click Context Menu */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 min-w-[160px] bg-panel-bg border border-panel-border rounded-lg shadow-2xl py-1 text-xs select-none backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { copyShapes(); setContextMenu(null); }}
            className="w-full flex items-center justify-between px-3 py-1.5 text-slate-300 hover:text-white hover:bg-panel-hover text-left cursor-pointer"
          >
            <span>Copy</span>
            <span className="text-[10px] text-slate-500 font-mono">Ctrl+C</span>
          </button>
          <button
            onClick={() => { pasteShapes(); setContextMenu(null); }}
            className="w-full flex items-center justify-between px-3 py-1.5 text-slate-300 hover:text-white hover:bg-panel-hover text-left cursor-pointer"
          >
            <span>Paste</span>
            <span className="text-[10px] text-slate-500 font-mono">Ctrl+V</span>
          </button>
          <button
            onClick={() => { copyShapes(); setTimeout(pasteShapes, 10); setContextMenu(null); }}
            className="w-full flex items-center justify-between px-3 py-1.5 text-slate-300 hover:text-white hover:bg-panel-hover text-left cursor-pointer"
          >
            <span>Duplicate</span>
            <span className="text-[10px] text-slate-500 font-mono">Ctrl+D</span>
          </button>

          <div className="w-full h-px bg-panel-border my-1" />

          <button
            onClick={() => { (useCanvasStore.getState() as any).bringToFront(); setContextMenu(null); }}
            className="w-full flex items-center justify-between px-3 py-1.5 text-slate-300 hover:text-white hover:bg-panel-hover text-left cursor-pointer"
          >
            <span>Bring to Front</span>
          </button>
          <button
            onClick={() => { (useCanvasStore.getState() as any).sendToBack(); setContextMenu(null); }}
            className="w-full flex items-center justify-between px-3 py-1.5 text-slate-300 hover:text-white hover:bg-panel-hover text-left cursor-pointer"
          >
            <span>Send to Back</span>
          </button>

          <div className="w-full h-px bg-panel-border my-1" />

          <button
            onClick={() => {
              const grouped = selectedShapesData.some((s: any) => s.groupId);
              if (grouped) {
                (useCanvasStore.getState() as any).ungroupSelectedShapes();
              } else {
                (useCanvasStore.getState() as any).groupSelectedShapes();
              }
              setContextMenu(null);
            }}
            disabled={!selectedShapesData.some((s: any) => s.groupId) && selectedShapeIds.length < 2}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-left cursor-pointer ${
              !selectedShapesData.some((s: any) => s.groupId) && selectedShapeIds.length < 2
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : 'text-slate-300 hover:text-white hover:bg-panel-hover'
            }`}
          >
            <span>{selectedShapesData.some((s: any) => s.groupId) ? 'Ungroup' : 'Group'}</span>
            <span className="text-[10px] text-slate-500 font-mono">
              {selectedShapesData.some((s: any) => s.groupId) ? 'Ctrl+Shift+G' : 'Ctrl+G'}
            </span>
          </button>

          <button
            onClick={() => { (useCanvasStore.getState() as any).toggleLockSelectedShapes(); setContextMenu(null); }}
            className="w-full flex items-center justify-between px-3 py-1.5 text-slate-300 hover:text-white hover:bg-panel-hover text-left cursor-pointer"
          >
            <span>{selectedShapesData.some((s: any) => s.isLocked) ? 'Unlock' : 'Lock'}</span>
            <span className="text-[10px] text-slate-500 font-mono">Ctrl+Shift+L</span>
          </button>

          <div className="w-full h-px bg-panel-border my-1" />

          <button
            onClick={() => { deleteSelectedShapes(); setContextMenu(null); }}
            className="w-full flex items-center justify-between px-3 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-left cursor-pointer"
          >
            <span>Delete</span>
            <span className="text-[10px] text-rose-400/60 font-mono">Del</span>
          </button>
        </div>
      )}

      {activeTool === 'text' && textPos && (
        <TextEditor
          x={textPos.x} y={textPos.y}
          color={strokeColor}
          onConfirm={handleTextConfirm}
          onCancel={() => setTextPos(null)}
        />
      )}

      {activeTool === 'polyline' && polylinePoints.length > 0 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-panel-bg border border-panel-border rounded px-3 py-1.5 text-xs text-slate-400 pointer-events-none">
          {polylinePoints.length} pts — <kbd className="bg-panel-border px-1 rounded text-white">Enter</kbd> finish · <kbd className="bg-panel-border px-1 rounded text-white">Esc</kbd> cancel
        </div>
      )}
      {activeTool === 'dimension' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-panel-bg border border-panel-border rounded px-3 py-1.5 text-xs text-slate-400 pointer-events-none">
          {!dimStart ? '📏 Click first point' : '📏 Click second point · Esc cancel'}
        </div>
      )}
      {activeTool === 'arc' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-panel-bg border border-panel-border rounded px-3 py-1.5 text-xs text-slate-400 pointer-events-none">
          {arcStep === 0 && '⌒ Click CENTER point'}
          {arcStep === 1 && '⌒ Click START point'}
          {arcStep === 2 && '⌒ Click END point · Esc cancel'}
        </div>
      )}
      {activeTool === 'text' && !textPos && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-panel-bg border border-panel-border rounded px-3 py-1.5 text-xs text-slate-400 pointer-events-none">
          T Click anywhere on canvas to place text
        </div>
      )}

      {multiBox && selectedShapesData.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-panel-bg border border-panel-border rounded px-3 py-1.5 text-xs text-accent-green pointer-events-none">
          {selectedShapesData.length} shapes selected — drag any one to move them together
        </div>
      )}
    </div>
  );
};