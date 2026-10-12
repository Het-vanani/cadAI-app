import type { Point, CADShape, Layer } from '../types';

export const snapToGrid = (value: number, gridSize: number): number =>
  Math.round(value / gridSize) * gridSize;

export const snapPointToGrid = (point: Point, gridSize: number): Point => ({
  x: snapToGrid(point.x, gridSize),
  y: snapToGrid(point.y, gridSize),
});

export const distance = (a: Point, b: Point): number =>
  Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));

export const getBoundingBox = (start: Point, end: Point) => ({
  x: Math.min(start.x, end.x),
  y: Math.min(start.y, end.y),
  width: Math.abs(end.x - start.x),
  height: Math.abs(end.y - start.y),
});

export const screenToCanvas = (
  screenX: number, screenY: number,
  panX: number, panY: number, zoom: number
): Point => ({
  x: (screenX - panX) / zoom,
  y: (screenY - panY) / zoom,
});

export const generateId = (): string =>
  `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ─────────────────────────────────────────────
// SNAP SYSTEM
// ─────────────────────────────────────────────

export type SnapType = 'endpoint' | 'midpoint' | 'center' | 'grid';

export interface SnapPoint {
  point: Point;
  type: SnapType;
}

const getShapeSnapPoints = (shape: CADShape): SnapPoint[] => {
  const snaps: SnapPoint[] = [];
  switch (shape.type) {
    case 'line': {
      const p0 = shape.points?.[0];
      const p1 = shape.points?.[1];
      if (!p0 || !p1) break;
      snaps.push({ point: p0, type: 'endpoint' });
      snaps.push({ point: p1, type: 'endpoint' });
      snaps.push({ point: { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 }, type: 'midpoint' });
      break;
    }
    case 'rectangle': {
      const x = shape.x ?? 0, y = shape.y ?? 0;
      const w = shape.width ?? 0, h = shape.height ?? 0;
      snaps.push({ point: { x, y }, type: 'endpoint' });
      snaps.push({ point: { x: x + w, y }, type: 'endpoint' });
      snaps.push({ point: { x, y: y + h }, type: 'endpoint' });
      snaps.push({ point: { x: x + w, y: y + h }, type: 'endpoint' });
      snaps.push({ point: { x: x + w / 2, y }, type: 'midpoint' });
      snaps.push({ point: { x: x + w / 2, y: y + h }, type: 'midpoint' });
      snaps.push({ point: { x, y: y + h / 2 }, type: 'midpoint' });
      snaps.push({ point: { x: x + w, y: y + h / 2 }, type: 'midpoint' });
      snaps.push({ point: { x: x + w / 2, y: y + h / 2 }, type: 'center' });
      break;
    }
    case 'circle':
    case 'ellipse': {
      const cx = (shape.x ?? 0) + (shape.width ?? 0) / 2;
      const cy = (shape.y ?? 0) + (shape.height ?? 0) / 2;
      const rx = (shape.width ?? 0) / 2;
      const ry = (shape.height ?? 0) / 2;
      snaps.push({ point: { x: cx, y: cy }, type: 'center' });
      snaps.push({ point: { x: cx + rx, y: cy }, type: 'endpoint' });
      snaps.push({ point: { x: cx - rx, y: cy }, type: 'endpoint' });
      snaps.push({ point: { x: cx, y: cy + ry }, type: 'endpoint' });
      snaps.push({ point: { x: cx, y: cy - ry }, type: 'endpoint' });
      break;
    }
    case 'arc': {
      const center = shape.points?.[0];
      const startPt = shape.points?.[1];
      const endPt = shape.points?.[2];
      if (center) snaps.push({ point: center, type: 'center' });
      if (startPt) snaps.push({ point: startPt, type: 'endpoint' });
      if (endPt) snaps.push({ point: endPt, type: 'endpoint' });
      break;
    }
  }
  return snaps;
};

export const findNearestSnapPoint = (
  cursor: Point, layers: Layer[],
  snapRadius: number = 12, gridSize: number = 20,
  snapToGridEnabled: boolean = true
): SnapPoint | null => {
  let nearest: SnapPoint | null = null;
  let nearestDist = snapRadius;

  const allShapes = layers
    .filter((l) => l.isVisible && !l.isLocked)
    .flatMap((l) => l.shapes);

  for (const shape of allShapes) {
    for (const snap of getShapeSnapPoints(shape)) {
      const dist = distance(cursor, snap.point);
      if (dist < nearestDist) { nearestDist = dist; nearest = snap; }
    }
  }

  if (!nearest && snapToGridEnabled) {
    return { point: snapPointToGrid(cursor, gridSize), type: 'grid' };
  }
  return nearest;
};

export const snapColors: Record<SnapType, string> = {
  endpoint: '#ffcc00', midpoint: '#00ff99',
  center: '#ff6699', grid: '#a1a1aa',
};

export const snapLabels: Record<SnapType, string> = {
  endpoint: 'Endpoint', midpoint: 'Midpoint',
  center: 'Center', grid: 'Grid',
};

// ─────────────────────────────────────────────
// ARC HELPER
// ─────────────────────────────────────────────

export const computeArcPath = (
  center: Point, startPt: Point, endPt: Point,
  zoom: number, panX: number, panY: number
): string => {
  const cx = center.x * zoom + panX;
  const cy = center.y * zoom + panY;

  const r = Math.sqrt(
    Math.pow((startPt.x - center.x) * zoom, 2) +
    Math.pow((startPt.y - center.y) * zoom, 2)
  );
  if (r < 1) return '';

  const startAngle = Math.atan2(startPt.y - center.y, startPt.x - center.x);
  const endAngle = Math.atan2(endPt.y - center.y, endPt.x - center.x);

  const sx = cx + r * Math.cos(startAngle);
  const sy = cy + r * Math.sin(startAngle);
  const ex = cx + r * Math.cos(endAngle);
  const ey = cy + r * Math.sin(endAngle);

  let sweep = endAngle - startAngle;
  if (sweep <= 0) sweep += 2 * Math.PI;
  const largeArc = sweep > Math.PI ? 1 : 0;

  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`;
};

// ─────────────────────────────────────────────
// BOUNDING BOX HELPERS — for selection, align, distribute
// ─────────────────────────────────────────────

// Get bounding box for any single shape, regardless of type
export const getShapeBoundingBox = (shape: CADShape) => {
  switch (shape.type) {
    case 'rectangle':
    case 'circle':
    case 'ellipse':
    case 'text':
      return {
        x: shape.x ?? 0,
        y: shape.y ?? 0,
        width: shape.width ?? 0,
        height: shape.height ?? 0,
      };
    case 'line':
    case 'polyline':
    case 'arc':
    case 'dimension': {
      const pts = shape.points ?? [];
      if (pts.length === 0) {
        return { x: shape.x ?? 0, y: shape.y ?? 0, width: 0, height: 0 };
      }
      const xs = pts.map((p) => p.x);
      const ys = pts.map((p) => p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    default:
      return {
        x: shape.x ?? 0, y: shape.y ?? 0,
        width: shape.width ?? 0, height: shape.height ?? 0,
      };
  }
};

// Combine bounding boxes of multiple shapes into one
export const computeMultiBoundingBox = (shapes: CADShape[]) => {
  if (shapes.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  const boxes = shapes.map(getShapeBoundingBox);
  const minX = Math.min(...boxes.map((b) => b.x));
  const minY = Math.min(...boxes.map((b) => b.y));
  const maxX = Math.max(...boxes.map((b) => b.x + b.width));
  const maxY = Math.max(...boxes.map((b) => b.y + b.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};