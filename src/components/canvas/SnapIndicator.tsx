import React from 'react';
import { Circle, Rect, Line, Text, Group } from 'react-konva';
import type { SnapPoint } from '../../utils/geometry';
import { snapColors, snapLabels } from '../../utils/geometry';

interface SnapIndicatorProps {
  snap: SnapPoint;
  zoom: number;
  panX: number;
  panY: number;
}

export const SnapIndicator: React.FC<SnapIndicatorProps> = ({
  snap, zoom, panX, panY,
}) => {
  const sx = snap.point.x * zoom + panX;
  const sy = snap.point.y * zoom + panY;
  const color = snapColors[snap.type];
  const label = snapLabels[snap.type];
  const size = 8;

  return (
    <Group listening={false}>
      {snap.type === 'endpoint' && (
        <Rect
          x={sx - size / 2}
          y={sy - size / 2}
          width={size}
          height={size}
          stroke={color}
          strokeWidth={1.5}
          fill="transparent"
        />
      )}

      {snap.type === 'midpoint' && (
        <Line
          points={[sx, sy - size / 1.5, sx + size / 1.5, sy + size / 2, sx - size / 1.5, sy + size / 2]}
          closed
          stroke={color}
          strokeWidth={1.5}
          fill="transparent"
        />
      )}

      {snap.type === 'center' && (
        <Circle
          x={sx}
          y={sy}
          radius={size / 2}
          stroke={color}
          strokeWidth={1.5}
          fill="transparent"
        />
      )}

      {snap.type === 'grid' && (
        <>
          <Line points={[sx - size / 2, sy, sx + size / 2, sy]} stroke={color} strokeWidth={1} opacity={0.5} />
          <Line points={[sx, sy - size / 2, sx, sy + size / 2]} stroke={color} strokeWidth={1} opacity={0.5} />
        </>
      )}

      {snap.type !== 'grid' && (
        <Text
          x={sx + size}
          y={sy - size}
          text={label}
          fontSize={10}
          fill={color}
          fontFamily="monospace"
        />
      )}
    </Group>
  );
};