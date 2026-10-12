export interface Point {
  x: number;
  y: number;
}

export type ShapeType =
  | 'line' | 'rectangle' | 'circle' | 'ellipse'
  | 'polyline' | 'text' | 'arc' | 'dimension';

export type ToolType =
  | 'select' | 'move' | 'eraser' | 'line' | 'rectangle'
  | 'circle' | 'ellipse' | 'text' | 'pan'
  | 'zoom' | 'polyline' | 'dimension' | 'arc';

export interface CADShape {
  id: string;
  type: ShapeType;
  layerId: string;
  points: Point[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  stroke: string;
  strokeWidth: number;
  fill: string;
  opacity: number;
  isSelected: boolean;
  isLocked: boolean;
  isVisible: boolean;
  label?: string;
  rotation: number;
  groupId?: string;
  height3d?: number;
  elevation3d?: number;
  material3d?: 'default' | 'glass' | 'concrete' | 'wood' | 'metal' | 'brick';
  color3d?: string;
}

export interface Layer {
  id: string;
  name: string;
  isVisible: boolean;
  isLocked: boolean;
  color: string;
  shapes: CADShape[];
}

export interface CanvasState {
  layers: Layer[];
  selectedShapeIds: string[];
  activeLayerId: string;
  zoom: number;
  panX: number;
  panY: number;
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  canvasState: CanvasState;
}