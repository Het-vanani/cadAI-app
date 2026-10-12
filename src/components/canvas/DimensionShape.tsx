import React from 'react';
import { Group, Line, Arrow, Text, Circle, Rect } from 'react-konva';
import { useSettingsStore } from '../../store/useSettingsStore';

interface DimensionShapeProps {
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  zoom: number;
  panX: number;
  panY: number;
  isSelected?: boolean;
  isPreview?: boolean;
  onClick?: (e?: any) => void;
  onContextMenu?: (e?: any) => void;
}

// ── Determine dimension type from two points ──
const getDimensionType = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
  const dx = Math.abs(p2.x - p1.x);
  const dy = Math.abs(p2.y - p1.y);
  const angle = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));

  if (angle < 10) return 'Horizontal';
  if (angle > 80) return 'Vertical';
  return 'Aligned';
};

// ── Get dimension line direction based on type ──
const getOffsetDirection = (type: string, angle: number) => {
  if (type === 'Horizontal') return { px: 0, py: -1 }; // always goes up
  if (type === 'Vertical') return { px: -1, py: 0 };   // always goes left
  // Aligned — perpendicular to the line
  return {
    px: -Math.sin(angle),
    py: Math.cos(angle),
  };
};

export const DimensionShape: React.FC<DimensionShapeProps> = ({
  p1, p2, zoom, panX, panY,
  isSelected = false,
  isPreview = false,
  onClick,
  onContextMenu,
}) => {
  const { formatDistance } = useSettingsStore();

  // Screen coordinates
  const sx1 = p1.x * zoom + panX;
  const sy1 = p1.y * zoom + panY;
  const sx2 = p2.x * zoom + panX;
  const sy2 = p2.y * zoom + panY;

  // Canvas distance
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const distCanvas = Math.sqrt(dx * dx + dy * dy);

  // Dimension type
  const dimType = getDimensionType(p1, p2);

  // For horizontal/vertical — measure only one axis
  const measuredDist = dimType === 'Horizontal'
    ? Math.abs(dx)
    : dimType === 'Vertical'
    ? Math.abs(dy)
    : distCanvas;

  const displayText = formatDistance(measuredDist);

  // Angle of actual line
  const lineAngle = Math.atan2(sy2 - sy1, sx2 - sx1);

  // Offset direction
  const offsetDist = 36;
  const { px, py } = getOffsetDirection(dimType, lineAngle);
  const perpX = px * offsetDist;
  const perpY = py * offsetDist;

  // For horizontal/vertical, project points onto axis first
  let dl1x: number, dl1y: number, dl2x: number, dl2y: number;

  if (dimType === 'Horizontal') {
    // Dimension line at same Y offset — spans X range
    const dimY = Math.min(sy1, sy2) + perpY;
    dl1x = sx1; dl1y = dimY;
    dl2x = sx2; dl2y = dimY;
  } else if (dimType === 'Vertical') {
    // Dimension line at same X offset — spans Y range
    const dimX = Math.min(sx1, sx2) + perpX;
    dl1x = dimX; dl1y = sy1;
    dl2x = dimX; dl2y = sy2;
  } else {
    // Aligned — offset perpendicular to line
    dl1x = sx1 + perpX; dl1y = sy1 + perpY;
    dl2x = sx2 + perpX; dl2y = sy2 + perpY;
  }

  // Midpoint for text
  const midX = (dl1x + dl2x) / 2;
  const midY = (dl1y + dl2y) / 2;

  // Colors
  const dimColor = isPreview
    ? '#ffcc00'
    : isSelected
    ? '#a1a1aa'
    : dimType === 'Horizontal'
    ? '#00d4aa'
    : dimType === 'Vertical'
    ? '#ff6699'
    : '#a78bfa'; // purple for aligned

  const sw = isSelected ? 1.5 : 1;

  // Text offset — perpendicular from midpoint
  const textOffsetX = px * 14;
  const textOffsetY = py * 14;

  return (
    <Group onClick={onClick} onContextMenu={onContextMenu} listening={!isPreview}>

      {/* ── Extension lines (dashed) ── */}
      <Line
        points={[sx1, sy1, dl1x, dl1y]}
        stroke={dimColor} strokeWidth={sw}
        dash={[4, 3]} opacity={0.6} listening={false}
      />
      <Line
        points={[sx2, sy2, dl2x, dl2y]}
        stroke={dimColor} strokeWidth={sw}
        dash={[4, 3]} opacity={0.6} listening={false}
      />

      {/* ── Main dimension line with arrows ── */}
      <Arrow
        points={[dl1x, dl1y, dl2x, dl2y]}
        stroke={dimColor} strokeWidth={sw}
        fill={dimColor}
        pointerLength={8} pointerWidth={5}
        pointerAtBeginning={true}
        pointerAtEnding={true}
        listening={false}
      />

      {/* ── Measurement text background ── */}
      <Rect
        x={midX + textOffsetX - 36}
        y={midY + textOffsetY - 9}
        width={72} height={16}
        fill="#18181b"
        opacity={0.85}
        cornerRadius={3}
        listening={false}
      />

      {/* ── Measurement value ── */}
      <Text
        x={midX + textOffsetX - 36}
        y={midY + textOffsetY - 8}
        width={72}
        text={displayText}
        fontSize={10}
        fontFamily="monospace"
        fontStyle="bold"
        fill={dimColor}
        align="center"
        listening={false}
      />

      {/* ── Dimension type label ── */}
      <Text
        x={midX + textOffsetX - 36}
        y={midY + textOffsetY + 6}
        width={72}
        text={dimType}
        fontSize={8}
        fontFamily="monospace"
        fill={dimColor}
        opacity={0.6}
        align="center"
        listening={false}
      />

      {/* ── Endpoint dots when selected ── */}
      {isSelected && (
        <>
          <Circle x={sx1} y={sy1} radius={4} fill={dimColor} opacity={0.9} listening={false} />
          <Circle x={sx2} y={sy2} radius={4} fill={dimColor} opacity={0.9} listening={false} />
        </>
      )}

      {/* ── Preview start dot ── */}
      {isPreview && (
        <Circle x={sx1} y={sy1} radius={4} fill={dimColor} listening={false} />
      )}
    </Group>
  );
};