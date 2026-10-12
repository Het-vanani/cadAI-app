# CAD AI — 2D/3D Architectural Web CAD Workstation

![CAD AI](https://img.shields.io/badge/CAD%20AI-2025-blue?style=for-the-badge)
![React 19](https://img.shields.io/badge/React-19.2-61dafb?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?style=for-the-badge&logo=typescript)
![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=for-the-badge&logo=three.js)
![Konva.js](https://img.shields.io/badge/Konva.js-2D_Canvas-0D83CD?style=for-the-badge)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)

CAD AI is an industrial-grade, browser-native 2D/3D Computer-Aided Design (CAD) drafting workstation built for architects, engineers, interior designers, and mechanical drafters.

---

## 🚀 Key Features

- **2D Vector CAD Drafting Engine:**
  - High-precision tools: Select, Move, Eraser, Pan, Line, Rectangle, Circle, Ellipse, 3-Point Arc, Polyline, Text, and Measurement Dimensions.
  - Smart geometric snap: Endpoints, midpoints, centers, and grid intersections.
  - Multi-selection marquee, multi-shape grouping (`Ctrl+G`), alignment, distribution, and horizontal/vertical mirroring.
  - Space-key panning: Hold `Space` + drag to pan the viewport from any tool.

- **3D Architectural Extrusion Studio:**
  - WebGL 3D architectural scene powered by Three.js with OrbitControls.
  - Converts 2D planar floor plans and geometry into 3D extruded volumes with customizable wall heights and base elevations.
  - PBR Architectural Material Finishes: Concrete, Glass, Wood, Metal, Brick, and CAD Gray.
  - Interactive 3D Transform Gizmos: Direct 3D axis resize (`S`) and translation arrows (`M`/`G`).
  - Camera presets: Isometric, Top Plan, Front Elevation, Side Elevation.
  - 3D Model Export: Download standard Wavefront `.OBJ` files for Blender, AutoCAD 3D, and 3D printing.

- **AI Generative Drafting Assistant:**
  - Natural language CAD drafting interface powered by Anthropic Claude (with offline demo fallback).
  - Describe floor plans or shapes (e.g., *"Draw a 10x8 room with a door and 2 windows"*) to generate vector CAD shapes instantly.

- **CAD Interoperability & Exporters:**
  - **AutoCAD DXF:** Standard AutoCAD DXF (AC1015/R2000) for AutoCAD, FreeCAD, LibreCAD, and SolidWorks.
  - **SVG:** Scalable vector graphics with layer and color preservation.
  - **PNG:** High-resolution raster images with clean geometry.
  - **JSON Project File (.cadai):** Save and reopen complete project sessions with history and settings.

- **Civil Engineering Units & Scaling:**
  - Supports Metric (`mm`, `cm`, `m`, `km`) and Imperial (`in`, `ft`, `yd`).
  - Architectural drawing scales from `1:1` to `1:1000`.

---

## 🛠️ Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **2D Rendering:** Konva.js 10.5 (`react-konva`)
- **3D Rendering:** Three.js 0.186 (`three`)
- **State Management:** Zustand 5
- **Styling:** Tailwind CSS + Vanilla CSS tokens
- **Icons:** Lucide React

---

## 📦 Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/cadai-app.git
cd cadai-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables (Optional)
Copy `.env.example` to `.env` if you wish to configure the Anthropic Claude API key for live AI generation:
```bash
cp .env.example .env
```
Add your key:
```env
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 4. Run the development server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 5. Build for production
```bash
npm run build
```

---

## ☁️ Deploy to Vercel

### Method 1: Deploy with Git (Recommended)
1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and log in.
3. Click **"Add New"** → **"Project"**.
4. Import your `cadai-app` repository.
5. Vercel automatically detects the framework as **Vite**:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. (Optional) Under **Environment Variables**, add:
   - Key: `VITE_ANTHROPIC_API_KEY`
   - Value: `your_anthropic_api_key_here`
7. Click **Deploy**.

### Method 2: Deploy using Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## ⌨️ Primary Keyboard Shortcuts

| Key | Tool / Action |
| :--- | :--- |
| `V` | Select tool |
| `M` | Move tool |
| `X` | Eraser tool |
| `H` / `Space` + Drag | Pan canvas viewport |
| `L` / `R` / `C` / `E` | Line / Rectangle / Circle / Ellipse |
| `A` / `P` / `T` / `D` | Arc / Polyline / Text / Dimension |
| `Ctrl + Z` / `Ctrl + Y` | Undo / Redo |
| `Ctrl + C` / `Ctrl + D` | Copy / Duplicate |
| `Delete` / `Backspace` | Delete selected shapes or dimensions |
| `F` / `Shift + F` | Zoom to fit all / Zoom to fit selection |
| `G` / `S` | Toggle Grid / Toggle Snap |
| `Ctrl + S` / `Ctrl + O` | Save & Export / Open `.cadai` |
| `?` | Keyboard shortcuts reference |

---

## 📄 Documentation

- Standalone PDF Report: `CAD_AI_Project_Documentation_and_Icon_Report.pdf`
- Printable HTML Report: `CAD_AI_Project_Documentation_and_Icon_Report.html`

---

## 📜 License
MIT License.
