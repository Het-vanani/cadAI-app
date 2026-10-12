import { create } from 'zustand';

interface ToolStore {
  activeTool: string;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
  setActiveTool: (tool: any) => void;
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setOpacity: (opacity: number) => void;
  setFontSize: (size: number) => void;
}

export const useToolStore = create<ToolStore>((set) => ({
  activeTool: 'select',
  strokeColor: '#e4e4e7',
  fillColor: 'transparent',
  strokeWidth: 1.5,
  opacity: 1,
  fontSize: 16,

  setActiveTool: (tool) => set({ activeTool: tool }),
  setStrokeColor: (color) => set({ strokeColor: color }),
  setFillColor: (color) => set({ fillColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setOpacity: (opacity) => set({ opacity }),
  setFontSize: (size) => set({ fontSize: size }),
}));