import React, { useMemo } from 'react';
import { Line } from 'react-konva';

interface GridProps {
  width: number;
  height: number;
  gridSize: number;
  panX: number;
  panY: number;
  zoom: number;
}

export const Grid: React.FC<GridProps> = ({
  width,
  height,
  gridSize,
  panX,
  panY,
  zoom,
}) => {
  // Scale grid size with zoom so it stays readable
  const scaledGrid = gridSize * zoom;

  // Calculate offset so grid tiles start from panned position
  const offsetX = panX % scaledGrid;
  const offsetY = panY % scaledGrid;

  // Build all vertical and horizontal grid lines
  const lines = useMemo(() => {
    const result: React.ReactNode[] = [];

    // Vertical lines
    for (let x = offsetX; x < width; x += scaledGrid) {
      result.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, height]}
          stroke="#27272a"
          strokeWidth={0.5}
          listening={false}  // grid lines don't capture mouse events
        />
      );
    }

    // Horizontal lines
    for (let y = offsetY; y < height; y += scaledGrid) {
      result.push(
        <Line
          key={`h-${y}`}
          points={[0, y, width, y]}
          stroke="#27272a"
          strokeWidth={0.5}
          listening={false}
        />
      );
    }

    return result;
  }, [width, height, scaledGrid, offsetX, offsetY]);

  return <>{lines}</>;
};