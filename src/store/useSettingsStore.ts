import { create } from 'zustand';

export type UnitType =
  | 'mm'
  | 'cm'
  | 'm'
  | 'km'
  | 'in'
  | 'ft'
  | 'yd';

export interface UnitConfig {
  label: string;
  shortLabel: string;
  // How many pixels = 1 unit (at zoom 1)
  pixelsPerUnit: number;
}

// Civil engineering unit definitions
export const UNITS: Record<UnitType, UnitConfig> = {
  mm: { label: 'Millimeters', shortLabel: 'mm', pixelsPerUnit: 0.1 },
  cm: { label: 'Centimeters', shortLabel: 'cm', pixelsPerUnit: 1 },
  m:  { label: 'Meters',      shortLabel: 'm',  pixelsPerUnit: 100 },
  km: { label: 'Kilometers',  shortLabel: 'km', pixelsPerUnit: 100000 },
  in: { label: 'Inches',      shortLabel: 'in', pixelsPerUnit: 2.54 },
  ft: { label: 'Feet',        shortLabel: 'ft', pixelsPerUnit: 30.48 },
  yd: { label: 'Yards',       shortLabel: 'yd', pixelsPerUnit: 91.44 },
};

interface SettingsStore {
  unit: UnitType;
  scale: number; // multiplier — e.g. 1 means 1:1, 100 means 1:100
  setUnit: (unit: UnitType) => void;
  setScale: (scale: number) => void;
  // Convert pixels to display string
  formatDistance: (pixels: number) => string;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  unit: 'cm',
  scale: 1,

  setUnit: (unit) => set({ unit }),
  setScale: (scale) => set({ scale }),

  formatDistance: (pixels: number) => {
    const { unit, scale } = get();
    const config = UNITS[unit];
    // Convert pixels to real-world units
    const realValue = (pixels / config.pixelsPerUnit) * scale;

    // Smart decimal places based on unit
    let decimals = 2;
    if (unit === 'km') decimals = 4;
    if (unit === 'm') decimals = 3;
    if (unit === 'mm') decimals = 0;

    return `${realValue.toFixed(decimals)} ${config.shortLabel}`;
  },
}));