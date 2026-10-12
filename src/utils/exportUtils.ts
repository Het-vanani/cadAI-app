import type { Layer } from '../types';

// ── SVG export ──
export const exportAsSVG = (layers: Layer[], filename = 'drawing'): void => {
  const visibleShapes = layers.filter((l) => l.isVisible).flatMap((l) => l.shapes);
  if (visibleShapes.length === 0) { alert('Nothing to export.'); return; }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  visibleShapes.forEach((shape) => {
    const x = shape.x ?? 0, y = shape.y ?? 0;
    const w = shape.width ?? 0, h = shape.height ?? 0;
    const r = shape.radius ?? 0;
    if (shape.type === 'circle') {
      minX = Math.min(minX, x - r); minY = Math.min(minY, y - r);
      maxX = Math.max(maxX, x + r); maxY = Math.max(maxY, y + r);
    } else if (shape.type === 'line' || shape.type === 'polyline') {
      shape.points?.forEach(p => {
        minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
      });
    } else {
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w); maxY = Math.max(maxY, y + h);
    }
  });

  const pad = 20;
  const svgW = maxX - minX + pad * 2;
  const svgH = maxY - minY + pad * 2;
  const ox = -minX + pad, oy = -minY + pad;

  const shapeElements = visibleShapes.map((shape) => {
    const stroke = shape.stroke || '#e4e4e7';
    const fill = shape.fill === 'transparent' ? 'none' : (shape.fill || 'none');
    const sw = shape.strokeWidth || 1.5;
    switch (shape.type) {
      case 'line': {
        const p0 = shape.points?.[0], p1 = shape.points?.[1];
        if (!p0 || !p1) return '';
        return `<line x1="${p0.x + ox}" y1="${p0.y + oy}" x2="${p1.x + ox}" y2="${p1.y + oy}" stroke="${stroke}" stroke-width="${sw}"/>`;
      }
      case 'rectangle':
        return `<rect x="${(shape.x ?? 0) + ox}" y="${(shape.y ?? 0) + oy}" width="${shape.width ?? 0}" height="${shape.height ?? 0}" stroke="${stroke}" stroke-width="${sw}" fill="${fill}"/>`;
      case 'circle':
        return `<circle cx="${(shape.x ?? 0) + (shape.width ?? 0) / 2 + ox}" cy="${(shape.y ?? 0) + (shape.height ?? 0) / 2 + oy}" r="${shape.radius ?? 0}" stroke="${stroke}" stroke-width="${sw}" fill="${fill}"/>`;
      case 'ellipse':
        return `<ellipse cx="${(shape.x ?? 0) + (shape.width ?? 0) / 2 + ox}" cy="${(shape.y ?? 0) + (shape.height ?? 0) / 2 + oy}" rx="${(shape.width ?? 0) / 2}" ry="${(shape.height ?? 0) / 2}" stroke="${stroke}" stroke-width="${sw}" fill="${fill}"/>`;
      case 'polyline': {
        const pts = (shape.points ?? []).map(p => `${p.x + ox},${p.y + oy}`).join(' ');
        return `<polyline points="${pts}" stroke="${stroke}" stroke-width="${sw}" fill="none"/>`;
      }
      case 'arc': {
        const center = shape.points?.[0], sp = shape.points?.[1], ep = shape.points?.[2];
        if (!center || !sp || !ep) return '';
        const r = Math.sqrt(Math.pow(sp.x - center.x, 2) + Math.pow(sp.y - center.y, 2));
        const startAngle = Math.atan2(sp.y - center.y, sp.x - center.x);
        const endAngle = Math.atan2(ep.y - center.y, ep.x - center.x);
        const sx = center.x + r * Math.cos(startAngle) + ox;
        const sy = center.y + r * Math.sin(startAngle) + oy;
        const ex = center.x + r * Math.cos(endAngle) + ox;
        const ey = center.y + r * Math.sin(endAngle) + oy;
        let sweep = endAngle - startAngle;
        if (sweep <= 0) sweep += 2 * Math.PI;
        const largeArc = sweep > Math.PI ? 1 : 0;
        return `<path d="M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}" stroke="${stroke}" stroke-width="${sw}" fill="none"/>`;
      }
      default: return '';
    }
  }).filter(Boolean).join('\n  ');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
  <rect width="100%" height="100%" fill="#18181b"/>
  ${shapeElements}
</svg>`;
  downloadFile(svg, `${filename}.svg`, 'image/svg+xml');
};

// ── PNG export ──
export const exportAsPNG = (layers: Layer[], filename = 'drawing'): void => {
  const visibleShapes = layers.filter((l) => l.isVisible).flatMap((l) => l.shapes);
  if (visibleShapes.length === 0) { alert('Nothing to export.'); return; }

  const canvas = document.createElement('canvas');
  canvas.width = 1920; canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const scale = 4;

  visibleShapes.forEach((shape) => {
    ctx.strokeStyle = shape.stroke || '#e4e4e7';
    ctx.lineWidth = (shape.strokeWidth || 1.5) * scale;
    ctx.fillStyle = shape.fill === 'transparent' ? 'transparent' : (shape.fill || 'transparent');
    ctx.globalAlpha = shape.opacity || 1;
    ctx.beginPath();
    switch (shape.type) {
      case 'line': {
        const p0 = shape.points?.[0], p1 = shape.points?.[1];
        if (p0 && p1) { ctx.moveTo(p0.x * scale, p0.y * scale); ctx.lineTo(p1.x * scale, p1.y * scale); }
        break;
      }
      case 'rectangle':
        ctx.rect((shape.x ?? 0) * scale, (shape.y ?? 0) * scale, (shape.width ?? 0) * scale, (shape.height ?? 0) * scale);
        break;
      case 'circle':
        ctx.arc(((shape.x ?? 0) + (shape.width ?? 0) / 2) * scale, ((shape.y ?? 0) + (shape.height ?? 0) / 2) * scale, (shape.radius ?? 0) * scale, 0, Math.PI * 2);
        break;
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  });

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.png`;
    a.click(); URL.revokeObjectURL(url);
  });
};

// ── DXF export — industry standard CAD format ──
export const exportAsDXF = (layers: Layer[], filename = 'drawing'): void => {
  const visibleShapes = layers.filter((l) => l.isVisible).flatMap((l) => l.shapes);
  if (visibleShapes.length === 0) { alert('Nothing to export.'); return; }

  // DXF Y-axis is inverted (increases upward)
  const fy = (y: number) => -y;

  const lines: string[] = [];

  // ── Header ──
  lines.push('0', 'SECTION', '2', 'HEADER');
  lines.push('9', '$ACADVER', '1', 'AC1015');
  lines.push('9', '$INSUNITS', '70', '4');
  lines.push('0', 'ENDSEC');

  // ── Tables (required for layers) ──
  lines.push('0', 'SECTION', '2', 'TABLES');
  lines.push('0', 'TABLE', '2', 'LTYPE', '70', '1');
  lines.push('0', 'LTYPE', '2', 'CONTINUOUS', '70', '0', '3', 'Solid line', '72', '65', '73', '0', '40', '0.0');
  lines.push('0', 'ENDTAB');

  lines.push('0', 'TABLE', '2', 'LAYER', '70', `${layers.length}`);
  layers.forEach((layer, i) => {
    lines.push('0', 'LAYER', '2', layer.name || `Layer${i}`, '70', '0', '62', '7', '6', 'CONTINUOUS');
  });
  lines.push('0', 'ENDTAB');
  lines.push('0', 'ENDSEC');

  // ── Entities ──
  lines.push('0', 'SECTION', '2', 'ENTITIES');

  for (const shape of visibleShapes) {
    const layerName = layers.find(l => l.shapes.some((s: any) => s.id === shape.id))?.name || '0';

    switch (shape.type) {
      case 'line': {
        const p0 = shape.points?.[0], p1 = shape.points?.[1];
        if (!p0 || !p1) break;
        lines.push('0', 'LINE', '8', layerName);
        lines.push('10', `${p0.x.toFixed(4)}`, '20', `${fy(p0.y).toFixed(4)}`, '30', '0.0');
        lines.push('11', `${p1.x.toFixed(4)}`, '21', `${fy(p1.y).toFixed(4)}`, '31', '0.0');
        break;
      }
      case 'rectangle': {
        const x = shape.x ?? 0, y = shape.y ?? 0;
        const w = shape.width ?? 0, h = shape.height ?? 0;
        lines.push('0', 'LWPOLYLINE', '8', layerName, '90', '4', '70', '1', '43', '0.0');
        lines.push('10', `${x.toFixed(4)}`, '20', `${fy(y).toFixed(4)}`);
        lines.push('10', `${(x+w).toFixed(4)}`, '20', `${fy(y).toFixed(4)}`);
        lines.push('10', `${(x+w).toFixed(4)}`, '20', `${fy(y+h).toFixed(4)}`);
        lines.push('10', `${x.toFixed(4)}`, '20', `${fy(y+h).toFixed(4)}`);
        break;
      }
      case 'circle': {
        const cx = (shape.x ?? 0) + (shape.width ?? 0) / 2;
        const cy = (shape.y ?? 0) + (shape.height ?? 0) / 2;
        const r = shape.radius ?? 0;
        lines.push('0', 'CIRCLE', '8', layerName);
        lines.push('10', `${cx.toFixed(4)}`, '20', `${fy(cy).toFixed(4)}`, '30', '0.0');
        lines.push('40', `${r.toFixed(4)}`);
        break;
      }
      case 'arc': {
        const center = shape.points?.[0], sp = shape.points?.[1], ep = shape.points?.[2];
        if (!center || !sp || !ep) break;
        const r = Math.sqrt(Math.pow(sp.x - center.x, 2) + Math.pow(sp.y - center.y, 2));
        // In DXF ARC, angles are measured from positive X axis counterclockwise
        const startAngle = Math.atan2(-(sp.y - center.y), sp.x - center.x) * (180 / Math.PI);
        const endAngle = Math.atan2(-(ep.y - center.y), ep.x - center.x) * (180 / Math.PI);
        lines.push('0', 'ARC', '8', layerName);
        lines.push('10', `${center.x.toFixed(4)}`, '20', `${fy(center.y).toFixed(4)}`, '30', '0.0');
        lines.push('40', `${r.toFixed(4)}`);
        lines.push('50', `${((startAngle % 360) + 360) % 360}`);
        lines.push('51', `${((endAngle % 360) + 360) % 360}`);
        break;
      }
      case 'ellipse': {
        const cx = (shape.x ?? 0) + (shape.width ?? 0) / 2;
        const cy = (shape.y ?? 0) + (shape.height ?? 0) / 2;
        const rx = (shape.width ?? 0) / 2;
        const ry = (shape.height ?? 0) / 2;
        const major = Math.max(rx, ry);
        const ratio = Math.min(rx, ry) / (major || 1);
        lines.push('0', 'ELLIPSE', '8', layerName);
        lines.push('10', `${cx.toFixed(4)}`, '20', `${fy(cy).toFixed(4)}`, '30', '0.0');
        lines.push(rx >= ry ? '11' : '12', `${major.toFixed(4)}`, '21', '0.0', '31', '0.0');
        lines.push('40', `${ratio.toFixed(6)}`);
        lines.push('41', '0.0', '42', `${(2 * Math.PI).toFixed(6)}`);
        break;
      }
      case 'polyline': {
        const pts = shape.points ?? [];
        if (pts.length < 2) break;
        lines.push('0', 'LWPOLYLINE', '8', layerName, '90', `${pts.length}`, '70', '0', '43', '0.0');
        pts.forEach(p => { lines.push('10', `${p.x.toFixed(4)}`, '20', `${fy(p.y).toFixed(4)}`); });
        break;
      }
    }
  }

  lines.push('0', 'ENDSEC', '0', 'EOF');

  downloadFile(lines.join('\n'), `${filename}.dxf`, 'application/dxf');
};

// ── Helper: trigger browser download ──
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
};