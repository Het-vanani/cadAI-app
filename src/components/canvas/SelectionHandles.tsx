import React, { useMemo } from 'react';
import { Group, Rect, Circle, Line, Text, Path } from 'react-konva';

interface SelectionHandlesProps {
  shape: any;
  zoom: number;
  panX: number;
  panY: number;
  onRotateCW: () => void;
  onRotateCCW: () => void;
}

// Get bounding box of any shape in canvas coordinates
const getShapeBounds = (shape: any) => {
  switch (shape.type) {
    case 'rectangle':
    case 'circle':
    case 'ellipse':
    case 'text':
      return {
        x: shape.x ?? 0, y: shape.y ?? 0,
        w: shape.width ?? 0, h: shape.height ?? 0,
      };
    case 'line': {
      const p0 = shape.points?.[0] ?? { x: 0, y: 0 };
      const p1 = shape.points?.[1] ?? { x: 0, y: 0 };
      return {
        x: Math.min(p0.x, p1.x), y: Math.min(p0.y, p1.y),
        w: Math.abs(p1.x - p0.x) || 20, h: Math.abs(p1.y - p0.y) || 20,
      };
    }
    case 'polyline':
    case 'arc': {
      const pts = shape.points ?? [];
      if (pts.length === 0) return null;
      const xs = pts.map((p: any) => p.x);
      const ys = pts.map((p: any) => p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      return {
        x: minX, y: minY,
        w: Math.max(maxX - minX, 20),
        h: Math.max(maxY - minY, 20),
      };
    }
    default:
      return null;
  }
};

export const SelectionHandles: React.FC<SelectionHandlesProps> = ({
  shape, zoom, panX, panY, onRotateCW, onRotateCCW,
}) => {
  const bounds = useMemo(() => getShapeBounds(shape), [shape]);
  if (!bounds) return null;

  // Convert to screen coordinates with padding
  const pad = 8;
  const sx = bounds.x * zoom + panX - pad;
  const sy = bounds.y * zoom + panY - pad;
  const sw = bounds.w * zoom + pad * 2;
  const sh = bounds.h * zoom + pad * 2;

  // Center points
  const cx = sx + sw / 2;
  const cy = sy + sh / 2;

  // Rotate handle position (above top center)
  const rotHandleY = sy - 28;
  const rotHandleX = cx;

  // Corner handle size
  const hs = 6;

  return (
    <Group listening={true}>
      {/* ── Dashed selection border ── */}
      <Rect
        x={sx} y={sy} width={sw} height={sh}
        stroke="#a1a1aa" strokeWidth={1}
        dash={[5, 4]} fill="transparent"
        listening={false}
      />

      {/* ── Line from center top to rotate handle ── */}
      <Line
        points={[cx, sy, rotHandleX, rotHandleY]}
        stroke="#a1a1aa" strokeWidth={1}
        dash={[3, 3]} opacity={0.6} listening={false}
      />

      {/* ── Rotate CW handle (click to rotate 90° CW) ── */}
      <Group x={rotHandleX} y={rotHandleY}
        onClick={onRotateCW}
        onMouseEnter={(e) => { e.target.getStage()!.container().style.cursor = 'grab'; }}
        onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = 'crosshair'; }}
      >
        <Circle radius={10} fill="#27272a" stroke="#a1a1aa" strokeWidth={1.5} />
        {/* Rotate arrow icon */}
        <Path
          data="M -5 0 A 5 5 0 0 1 5 0 L 3 -3 M 5 0 L 7 -3"
          stroke="#a1a1aa" strokeWidth={1.5}
          fill="transparent"
          listening={false}
        />
        <Text
          x={-4} y={-5} text="↻" fontSize={10}
          fill="#e4e4e7" listening={false}
        />
      </Group>

      {/* ── 4 Corner handles ── */}
      {[
        { x: sx,      y: sy      }, // top-left
        { x: sx + sw, y: sy      }, // top-right
        { x: sx,      y: sy + sh }, // bottom-left
        { x: sx + sw, y: sy + sh }, // bottom-right
      ].map((corner, i) => (
        <Rect
          key={i}
          x={corner.x - hs / 2} y={corner.y - hs / 2}
          width={hs} height={hs}
          fill="white" stroke="#a1a1aa" strokeWidth={1.5}
          listening={false}
        />
      ))}

      {/* ── 4 Edge midpoint handles ── */}
      {[
        { x: cx,      y: sy      }, // top
        { x: cx,      y: sy + sh }, // bottom
        { x: sx,      y: cy      }, // left
        { x: sx + sw, y: cy      }, // right
      ].map((mid, i) => (
        <Rect
          key={`m${i}`}
          x={mid.x - 4} y={mid.y - 2}
          width={8} height={4}
          fill="white" stroke="#a1a1aa" strokeWidth={1}
          listening={false}
        />
      ))}

      {/* ── Rotation angle badge ── */}
      {(shape.rotation ?? 0) !== 0 && (
        <Group x={sx + sw + 4} y={sy}>
          <Rect width={36} height={14} fill="#27272a"
            stroke="#a1a1aa" strokeWidth={0.5} cornerRadius={3} />
          <Text x={2} y={3} text={`${Math.round(shape.rotation ?? 0)}°`}
            fontSize={9} fill="#e4e4e7" fontFamily="monospace" />
        </Group>
      )}
    </Group>
  );
};