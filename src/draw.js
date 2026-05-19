export const canvas = document.getElementById('schematic');
export const ctx = canvas.getContext('2d');

export function resize() {
  const wrap = document.getElementById('canvas-wrap');
  const dpr = devicePixelRatio;
  canvas.width = wrap.clientWidth * dpr;
  canvas.height = wrap.clientHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

const W = () => canvas.width / devicePixelRatio;
const H = () => canvas.height / devicePixelRatio;

export function draw() {
  const w = W(), h = H();
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#30363d';
  ctx.lineWidth = 1;
  const grid = 20;
  for (let x = 0; x < w; x += grid) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += grid) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Draw nodes
  ctx.fillStyle = '#58a6ff';
  for (const n in nodePositions) {
    const p = nodePositions[n];
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#8d96a0'; ctx.font = '12px Courier New';
    ctx.fillText(n === '0'? 'GND' : n, p.x + 8, p.y - 8);
    ctx.fillStyle = '#58a6ff';
  }

  // Draw components
  for (const c of components) {
    const a = nodePositions[c.n1], b = nodePositions[c.n2];
    if (!a ||!b) continue;
    drawComp(c, a, b, selectedComp === c);
  }
}

export function drawComp(c, a, b, selected) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux;

  ctx.strokeStyle = selected? '#f85149' : '#e6edf3';
  ctx.lineWidth = 2;

  // Simple line for now
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();

  // Label
  const mx = (a.x + b.x) / 2 + c.displayOffX;
  const my = (a.y + b.y) / 2 + c.displayOffY;
  ctx.fillStyle = '#e6edf3';
  ctx.font = '14px Courier New';
  ctx.fillText(`${c.type}${c.id}`, mx, my - 10);
}

export function fmtR(R) {
  if (R >= 1e6) return (R / 1e6).toFixed(2) + 'MΩ';
  if (R >= 1e3) return (R / 1e3).toFixed(2) + 'kΩ';
  return R + 'Ω';
}
export function fmtC(C) {
  if (C >= 1e-6) return (C * 1e6).toFixed(2) + 'µF';
  if (C >= 1e-9) return (C * 1e9).toFixed(2) + 'nF';
  return (C * 1e12).toFixed(2) + 'pF';
}
export function fmtL(L) {
  if (L >= 1e-3) return (L * 1e3).toFixed(2) + 'mH';
  return (L * 1e6).toFixed(2) + 'µH';
}
export function fmtV(V) { return V.toFixed(2) + 'V'; }
export function fmtVS(V) { return V.toFixed(2) + 'V'; }