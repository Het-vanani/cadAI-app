import { CADShape, Layer, Project } from '../types';

export interface TemplateItem {
  id: string;
  name: string;
  category: 'Residential' | 'Commercial' | 'Architecture';
  description: string;
  icon: string;
  stats: {
    rooms: number;
    area: string;
    elements: number;
  };
  getProject: () => Project;
}

export const STARTER_TEMPLATES: TemplateItem[] = [
  {
    id: 'studio-apartment',
    name: 'Modern Studio Apartment',
    category: 'Residential',
    icon: '🏠',
    description: 'Complete open-concept studio with concrete perimeter walls, glass balcony sliders, wood bed platform, kitchen island, and bathroom.',
    stats: { rooms: 3, area: '48 m²', elements: 14 },
    getProject: () => {
      const wallLayer: Layer = {
        id: 'layer-walls',
        name: 'Walls & Structure',
        isVisible: true,
        isLocked: false,
        color: '#e2e8f0',
        shapes: [
          // Exterior Outer Boundary Walls (Concrete, 260mm height)
          {
            id: 'wall-perimeter',
            type: 'rectangle',
            layerId: 'layer-walls',
            x: 100, y: 100, width: 550, height: 380,
            stroke: '#e2e8f0', strokeWidth: 4, fill: 'transparent',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 260, elevation3d: 0, material3d: 'concrete', label: 'Perimeter Wall'
          },
          // Bathroom Partition
          {
            id: 'wall-bath',
            type: 'rectangle',
            layerId: 'layer-walls',
            x: 100, y: 100, width: 180, height: 150,
            stroke: '#cbd5e1', strokeWidth: 3, fill: 'transparent',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 260, elevation3d: 0, material3d: 'concrete', label: 'Bathroom Enclosure'
          },
          // Brick accent wall behind bed
          {
            id: 'wall-brick-accent',
            type: 'rectangle',
            layerId: 'layer-walls',
            x: 350, y: 100, width: 300, height: 20,
            stroke: '#ef4444', strokeWidth: 2, fill: '#ef444415',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 260, elevation3d: 0, material3d: 'brick', label: 'Brick Accent Wall'
          }
        ]
      };

      const glassLayer: Layer = {
        id: 'layer-glass',
        name: 'Glass & Glazing',
        isVisible: true,
        isLocked: false,
        color: '#06b6d4',
        shapes: [
          // Bedroom Glass Sliding Partition
          {
            id: 'glass-bed-slider',
            type: 'rectangle',
            layerId: 'layer-glass',
            x: 340, y: 120, width: 14, height: 160,
            stroke: '#06b6d4', strokeWidth: 2, fill: '#06b6d420',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 250, elevation3d: 0, material3d: 'glass', label: 'Glass Room Divider'
          },
          // Balcony Full Glass Wall / Doorway
          {
            id: 'glass-balcony',
            type: 'rectangle',
            layerId: 'layer-glass',
            x: 420, y: 465, width: 210, height: 15,
            stroke: '#06b6d4', strokeWidth: 2, fill: '#06b6d425',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 240, elevation3d: 0, material3d: 'glass', label: 'Balcony Glass Sliders'
          }
        ]
      };

      const interiorLayer: Layer = {
        id: 'layer-interior',
        name: 'Furniture & Built-ins',
        isVisible: true,
        isLocked: false,
        color: '#f59e0b',
        shapes: [
          // Hardwood Bed Platform
          {
            id: 'furn-bed',
            type: 'rectangle',
            layerId: 'layer-interior',
            x: 420, y: 130, width: 180, height: 140,
            stroke: '#d97706', strokeWidth: 2, fill: '#d9770622',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 55, elevation3d: 0, material3d: 'wood', label: 'Queen Bed Platform'
          },
          // Kitchen Counter / Breakfast Bar
          {
            id: 'furn-kitchen-counter',
            type: 'rectangle',
            layerId: 'layer-interior',
            x: 120, y: 320, width: 190, height: 60,
            stroke: '#b45309', strokeWidth: 2, fill: '#b4530922',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 90, elevation3d: 0, material3d: 'wood', label: 'Kitchen Island'
          },
          // Dining Table (Metal Frame / Glass Top)
          {
            id: 'furn-table',
            type: 'rectangle',
            layerId: 'layer-interior',
            x: 350, y: 340, width: 110, height: 75,
            stroke: '#64748b', strokeWidth: 2, fill: '#64748b20',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 75, elevation3d: 0, material3d: 'metal', label: 'Dining Table'
          },
          // Sofa / Lounge
          {
            id: 'furn-sofa',
            type: 'rectangle',
            layerId: 'layer-interior',
            x: 500, y: 320, width: 120, height: 65,
            stroke: '#3b82f6', strokeWidth: 2, fill: '#3b82f620',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 70, elevation3d: 0, material3d: 'default', label: 'Lounge Sofa'
          },
          // Stools (Circle)
          {
            id: 'stool-1',
            type: 'circle',
            layerId: 'layer-interior',
            x: 160, y: 395, width: 30, height: 30, radius: 15,
            stroke: '#64748b', strokeWidth: 1.5, fill: 'transparent',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 65, elevation3d: 0, material3d: 'metal', label: 'Counter Stool'
          },
          {
            id: 'stool-2',
            type: 'circle',
            layerId: 'layer-interior',
            x: 230, y: 395, width: 30, height: 30, radius: 15,
            stroke: '#64748b', strokeWidth: 1.5, fill: 'transparent',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 65, elevation3d: 0, material3d: 'metal', label: 'Counter Stool'
          },
          // Text Labels
          {
            id: 'lbl-living',
            type: 'text',
            layerId: 'layer-interior',
            label: 'Living Area',
            x: 430, y: 400, width: 80, height: 20,
            stroke: '#94a3b8', strokeWidth: 1, fill: '#94a3b8',
            opacity: 0.9, rotation: 0, isSelected: false, isLocked: true, isVisible: true,
            points: [{ x: 430, y: 400 }]
          },
          {
            id: 'lbl-bed',
            type: 'text',
            layerId: 'layer-interior',
            label: 'Master Bedroom',
            x: 450, y: 190, width: 100, height: 20,
            stroke: '#94a3b8', strokeWidth: 1, fill: '#94a3b8',
            opacity: 0.9, rotation: 0, isSelected: false, isLocked: true, isVisible: true,
            points: [{ x: 450, y: 190 }]
          },
          {
            id: 'lbl-bath',
            type: 'text',
            layerId: 'layer-interior',
            label: 'Bath Suite',
            x: 140, y: 170, width: 70, height: 20,
            stroke: '#94a3b8', strokeWidth: 1, fill: '#94a3b8',
            opacity: 0.9, rotation: 0, isSelected: false, isLocked: true, isVisible: true,
            points: [{ x: 140, y: 170 }]
          }
        ]
      };

      return {
        id: 'project-studio-' + Date.now(),
        name: 'Modern Studio Apartment',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        canvasState: {
          layers: [wallLayer, glassLayer, interiorLayer],
          selectedShapeIds: [],
          activeLayerId: 'layer-walls',
          zoom: 1.1,
          panX: 40,
          panY: 30,
          gridSize: 20,
          snapToGrid: true,
          showGrid: true,
        }
      };
    }
  },

  {
    id: 'office-suite',
    name: 'Corporate Tech Office',
    category: 'Commercial',
    icon: '🏢',
    description: 'Open office layout featuring an acoustic glass conference room, executive cabin, sleek reception desk, and collaborative workstation pods.',
    stats: { rooms: 4, area: '95 m²', elements: 16 },
    getProject: () => {
      const wallLayer: Layer = {
        id: 'layer-walls',
        name: 'Perimeter Structure',
        isVisible: true,
        isLocked: false,
        color: '#e2e8f0',
        shapes: [
          // Outer perimeter
          {
            id: 'off-outer',
            type: 'rectangle',
            layerId: 'layer-walls',
            x: 80, y: 80, width: 620, height: 420,
            stroke: '#e2e8f0', strokeWidth: 4, fill: 'transparent',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 280, elevation3d: 0, material3d: 'concrete', label: 'Office Perimeter'
          },
          // Structural Core Pillars (Metal columns)
          {
            id: 'pillar-1',
            type: 'circle',
            layerId: 'layer-walls',
            x: 270, y: 220, width: 36, height: 36, radius: 18,
            stroke: '#94a3b8', strokeWidth: 2, fill: '#94a3b830',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 280, elevation3d: 0, material3d: 'metal', label: 'Steel Column A1'
          },
          {
            id: 'pillar-2',
            type: 'circle',
            layerId: 'layer-walls',
            x: 480, y: 220, width: 36, height: 36, radius: 18,
            stroke: '#94a3b8', strokeWidth: 2, fill: '#94a3b830',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 280, elevation3d: 0, material3d: 'metal', label: 'Steel Column A2'
          }
        ]
      };

      const glassLayer: Layer = {
        id: 'layer-glass',
        name: 'Glass Partitions',
        isVisible: true,
        isLocked: false,
        color: '#06b6d4',
        shapes: [
          // Conference Room Glass Box
          {
            id: 'conf-glass-box',
            type: 'rectangle',
            layerId: 'layer-glass',
            x: 80, y: 80, width: 230, height: 180,
            stroke: '#06b6d4', strokeWidth: 2.5, fill: '#06b6d418',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 280, elevation3d: 0, material3d: 'glass', label: 'Conference Glass Enclosure'
          },
          // Executive Suite Glass Wall
          {
            id: 'exec-glass-wall',
            type: 'rectangle',
            layerId: 'layer-glass',
            x: 470, y: 80, width: 230, height: 170,
            stroke: '#06b6d4', strokeWidth: 2.5, fill: '#06b6d418',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 280, elevation3d: 0, material3d: 'glass', label: 'Executive Cabin Glazing'
          }
        ]
      };

      const furnitureLayer: Layer = {
        id: 'layer-furniture',
        name: 'Workstations & Desks',
        isVisible: true,
        isLocked: false,
        color: '#f59e0b',
        shapes: [
          // Conference Oval Table (Wood)
          {
            id: 'conf-table',
            type: 'ellipse',
            layerId: 'layer-furniture',
            x: 130, y: 130, width: 130, height: 80,
            stroke: '#d97706', strokeWidth: 2, fill: '#d9770622',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 76, elevation3d: 0, material3d: 'wood', label: 'Boardroom Oval Table'
          },
          // Curved Reception Desk
          {
            id: 'reception-desk',
            type: 'rectangle',
            layerId: 'layer-furniture',
            x: 310, y: 380, width: 170, height: 50,
            stroke: '#b45309', strokeWidth: 2, fill: '#b4530925',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 110, elevation3d: 0, material3d: 'wood', label: 'Reception Front Counter'
          },
          // Executive Desk (Wood)
          {
            id: 'exec-desk',
            type: 'rectangle',
            layerId: 'layer-furniture',
            x: 520, y: 125, width: 130, height: 70,
            stroke: '#d97706', strokeWidth: 2, fill: '#d9770620',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 78, elevation3d: 0, material3d: 'wood', label: 'Executive Mahogany Desk'
          },
          // Workstation Quad Pod 1 (Metal frame)
          {
            id: 'work-pod-1',
            type: 'rectangle',
            layerId: 'layer-furniture',
            x: 120, y: 310, width: 140, height: 110,
            stroke: '#64748b', strokeWidth: 2, fill: '#64748b20',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 75, elevation3d: 0, material3d: 'metal', label: 'Team Workstations A'
          },
          // Workstation Quad Pod 2 (Metal frame)
          {
            id: 'work-pod-2',
            type: 'rectangle',
            layerId: 'layer-furniture',
            x: 520, y: 310, width: 140, height: 110,
            stroke: '#64748b', strokeWidth: 2, fill: '#64748b20',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 75, elevation3d: 0, material3d: 'metal', label: 'Team Workstations B'
          },
          // Room labels
          {
            id: 'lbl-conf',
            type: 'text',
            layerId: 'layer-furniture',
            label: 'Conference Room',
            x: 130, y: 95, width: 120, height: 18,
            stroke: '#38bdf8', strokeWidth: 1, fill: '#38bdf8',
            opacity: 0.9, rotation: 0, isSelected: false, isLocked: true, isVisible: true,
            points: [{ x: 130, y: 95 }]
          },
          {
            id: 'lbl-exec',
            type: 'text',
            layerId: 'layer-furniture',
            label: 'Executive Cabin',
            x: 520, y: 95, width: 110, height: 18,
            stroke: '#38bdf8', strokeWidth: 1, fill: '#38bdf8',
            opacity: 0.9, rotation: 0, isSelected: false, isLocked: true, isVisible: true,
            points: [{ x: 520, y: 95 }]
          },
          {
            id: 'lbl-reception',
            type: 'text',
            layerId: 'layer-furniture',
            label: 'Welcome / Reception',
            x: 325, y: 445, width: 130, height: 18,
            stroke: '#94a3b8', strokeWidth: 1, fill: '#94a3b8',
            opacity: 0.9, rotation: 0, isSelected: false, isLocked: true, isVisible: true,
            points: [{ x: 325, y: 445 }]
          }
        ]
      };

      return {
        id: 'project-office-' + Date.now(),
        name: 'Corporate Tech Office',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        canvasState: {
          layers: [wallLayer, glassLayer, furnitureLayer],
          selectedShapeIds: [],
          activeLayerId: 'layer-walls',
          zoom: 1.05,
          panX: 40,
          panY: 30,
          gridSize: 20,
          snapToGrid: true,
          showGrid: true,
        }
      };
    }
  },

  {
    id: 'architectural-villa',
    name: 'Modern Architectural Villa',
    category: 'Architecture',
    icon: '🏛️',
    description: 'Striking multi-level luxury villa with high-ceiling grand hall, upper-floor cantilever terrace suite (elevation 300mm), and glass facade.',
    stats: { rooms: 5, area: '160 m²', elements: 15 },
    getProject: () => {
      const groundLayer: Layer = {
        id: 'layer-ground',
        name: 'Ground Level Pavilion',
        isVisible: true,
        isLocked: false,
        color: '#e2e8f0',
        shapes: [
          // Main Ground Floor (Concrete, 300mm high)
          {
            id: 'villa-ground-main',
            type: 'rectangle',
            layerId: 'layer-ground',
            x: 100, y: 120, width: 440, height: 320,
            stroke: '#e2e8f0', strokeWidth: 4, fill: 'transparent',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 300, elevation3d: 0, material3d: 'concrete', label: 'Ground Pavilion'
          },
          // Brick Feature Chimney / Core Tower
          {
            id: 'villa-brick-core',
            type: 'rectangle',
            layerId: 'layer-ground',
            x: 100, y: 220, width: 60, height: 120,
            stroke: '#ef4444', strokeWidth: 2, fill: '#ef444420',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 480, elevation3d: 0, material3d: 'brick', label: 'Masonry Fireplace Tower'
          },
          // Steel Columns supporting terrace
          {
            id: 'villa-col-1',
            type: 'circle',
            layerId: 'layer-ground',
            x: 480, y: 400, width: 30, height: 30, radius: 15,
            stroke: '#94a3b8', strokeWidth: 2, fill: '#94a3b830',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 300, elevation3d: 0, material3d: 'metal', label: 'Steel Pillar 1'
          },
          {
            id: 'villa-col-2',
            type: 'circle',
            layerId: 'layer-ground',
            x: 350, y: 400, width: 30, height: 30, radius: 15,
            stroke: '#94a3b8', strokeWidth: 2, fill: '#94a3b830',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 300, elevation3d: 0, material3d: 'metal', label: 'Steel Pillar 2'
          },
          // Wooden Decking / Patio
          {
            id: 'villa-wood-patio',
            type: 'rectangle',
            layerId: 'layer-ground',
            x: 180, y: 450, width: 360, height: 90,
            stroke: '#d97706', strokeWidth: 2, fill: '#d9770625',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 15, elevation3d: 0, material3d: 'wood', label: 'Teak Deck Patio'
          }
        ]
      };

      const upperLayer: Layer = {
        id: 'layer-upper',
        name: 'Upper Level Suite & Terrace',
        isVisible: true,
        isLocked: false,
        color: '#a855f7',
        shapes: [
          // Cantilevered Upper Master Suite (Elevated at 300mm, height 240mm)
          {
            id: 'villa-upper-suite',
            type: 'rectangle',
            layerId: 'layer-upper',
            x: 280, y: 80, width: 280, height: 220,
            stroke: '#a855f7', strokeWidth: 3, fill: '#a855f715',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 240, elevation3d: 300, material3d: 'concrete', label: 'Cantilever Penthouse'
          },
          // Glass Balustrade on Terrace (Elevation 300mm, height 100mm)
          {
            id: 'villa-terrace-glass',
            type: 'rectangle',
            layerId: 'layer-upper',
            x: 280, y: 295, width: 280, height: 12,
            stroke: '#06b6d4', strokeWidth: 2, fill: '#06b6d425',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 100, elevation3d: 300, material3d: 'glass', label: 'Terrace Glass Railing'
          },
          // Floor-to-Ceiling Panoramic Glass Window
          {
            id: 'villa-main-glass-facade',
            type: 'rectangle',
            layerId: 'layer-upper',
            x: 170, y: 430, width: 360, height: 14,
            stroke: '#06b6d4', strokeWidth: 2, fill: '#06b6d425',
            opacity: 1, rotation: 0, isSelected: false, isLocked: false, isVisible: true,
            points: [],
            height3d: 280, elevation3d: 15, material3d: 'glass', label: 'Panoramic Glass Facade'
          },
          {
            id: 'lbl-villa-ground',
            type: 'text',
            layerId: 'layer-upper',
            label: 'Grand Living Hall (Double Height)',
            x: 180, y: 260, width: 200, height: 20,
            stroke: '#94a3b8', strokeWidth: 1, fill: '#94a3b8',
            opacity: 0.9, rotation: 0, isSelected: false, isLocked: true, isVisible: true,
            points: [{ x: 180, y: 260 }]
          },
          {
            id: 'lbl-villa-upper',
            type: 'text',
            layerId: 'layer-upper',
            label: 'Upper Penthouse Suite (+3.0m)',
            x: 320, y: 150, width: 180, height: 20,
            stroke: '#c084fc', strokeWidth: 1, fill: '#c084fc',
            opacity: 0.9, rotation: 0, isSelected: false, isLocked: true, isVisible: true,
            points: [{ x: 320, y: 150 }]
          }
        ]
      };

      return {
        id: 'project-villa-' + Date.now(),
        name: 'Modern Architectural Villa',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        canvasState: {
          layers: [groundLayer, upperLayer],
          selectedShapeIds: [],
          activeLayerId: 'layer-ground',
          zoom: 1.0,
          panX: 40,
          panY: 20,
          gridSize: 20,
          snapToGrid: true,
          showGrid: true,
        }
      };
    }
  }
];
