import { useEffect } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';
import { useToolStore } from '../store/useToolStore';

export const useKeyboard = () => {
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const deleteSelectedShapes = useCanvasStore((s) => s.deleteSelectedShapes);
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const toggleGrid = useCanvasStore((s) => s.toggleGrid);
  const toggleSnap = useCanvasStore((s) => s.toggleSnap);
  const setZoom = useCanvasStore((s) => s.setZoom);
  const zoomToFit = useCanvasStore((s) => s.zoomToFit);
  const setShowShortcutsModal = useCanvasStore((s) => s.setShowShortcutsModal);
  const copyShapes = useCanvasStore((s) => s.copyShapes);
  const pasteShapes = useCanvasStore((s) => s.pasteShapes);
  const setActiveTool = useToolStore((s) => s.setActiveTool);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) return;

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            e.shiftKey ? redo() : undo();
            return;
          case 'y':
          case 'Z':
            e.preventDefault();
            redo();
            return;
          case 'a':
            e.preventDefault();
            const allIds = useCanvasStore
              .getState()
              .layers.flatMap((l: any) => l.shapes.map((s: any) => s.id));
            useCanvasStore.setState({ selectedShapeIds: allIds });
            return;
          case 'c':
            e.preventDefault();
            copyShapes();
            return;
          case 'v':
            e.preventDefault();
            pasteShapes();
            return;
          case 'd':
            e.preventDefault();
            copyShapes();
            setTimeout(() => pasteShapes(), 10);
            return;
          case 'ArrowRight':
            e.preventDefault();
            (useCanvasStore.getState() as any).rotateSelectedShapes(90);
            return;
          case 'ArrowLeft':
            e.preventDefault();
            (useCanvasStore.getState() as any).rotateSelectedShapes(-90);
            return;
          case 'g':
            e.preventDefault();
            if (e.shiftKey) {
              (useCanvasStore.getState() as any).ungroupSelectedShapes();
            } else {
              (useCanvasStore.getState() as any).groupSelectedShapes();
            }
            return;
          case 'l':
          case 'L':
            if (e.shiftKey) {
              e.preventDefault();
              (useCanvasStore.getState() as any).toggleLockSelectedShapes();
              return;
            }
            break;
        }
      }

      switch (key) {
        case 'v': setActiveTool('select'); break;
        case 'm': setActiveTool('move'); break;
        case 'h': setActiveTool('pan'); break;
        case 'l': setActiveTool('line'); break;
        case 'r': setActiveTool('rectangle'); break;
        case 'c': if (!ctrl) setActiveTool('circle'); break;
        case 'e': setActiveTool('ellipse'); break;
        case 't': setActiveTool('text'); break;
        case 'p': setActiveTool('polyline'); break;
        case 'd': if (!ctrl) setActiveTool('dimension'); break;
        case 'a': if (!ctrl) setActiveTool('arc'); break;
        case 'x': if (!ctrl) setActiveTool('eraser'); break;
        case 'f':
          if (!ctrl) {
            e.preventDefault();
            if (e.shiftKey) {
              zoomToFit(true);
            } else {
              zoomToFit(false);
            }
          }
          break;
        case '?':
          if (!ctrl) {
            e.preventDefault();
            setShowShortcutsModal(true);
          }
          break;
        case 'delete':
        case 'backspace':
          e.preventDefault();
          deleteSelectedShapes();
          break;
        case 'escape':
          setActiveTool('select');
          clearSelection();
          break;
        case 'g': if (!ctrl) toggleGrid(); break;
        case 's': if (!ctrl) toggleSnap(); break;
        case '=':
        case '+':
          if (!ctrl) {
            e.preventDefault();
            setZoom(useCanvasStore.getState().zoom + 0.1);
          }
          break;
        case '-':
          if (!ctrl) {
            e.preventDefault();
            setZoom(useCanvasStore.getState().zoom - 0.1);
          }
          break;
        case '0':
          setZoom(1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    undo, redo, deleteSelectedShapes, clearSelection,
    toggleGrid, toggleSnap, setZoom, zoomToFit, setShowShortcutsModal,
    setActiveTool, copyShapes, pasteShapes
  ]);
};