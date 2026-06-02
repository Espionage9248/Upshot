// charts.jsx — data-viz built in the converged language. Colourblind-aware,
// tabular, projected = dashed. Sankey · Heatmap · NetWorthTrend · Donut.

// ── Money-flow (static Sankey): income → categories → saved/left ──
function Sankey({ w = 560, h = 300 }) {
  const inflow = [['Salary', 4960, 'var(--income)'], ['Refunds', 180, 'var(--income)']];
  const cats = [['Housing', 2100], ['Groceries', 640], ['Transport', 320], ['Lifestyle', 540], ['Bills', 410]];
  const saved = 770;
  const total = inflow.reduce((a, b) => a + b[1], 0);
  const outTotal = cats.reduce((a, b) => a + b[1], 0) + saved;
  const padY = 10, colH = h - padY * 2;
  const inX = 0, inW = 13, midX = w * 0.46, outX = w - inW, gap = 8;
  // left stack
  let iy = padY; const inNodes = inflow.map(([n, v, c]) => { const bh = (v / total) * colH; const node = { n, v, c, y: iy, bh }; iy += bh + gap; return node; });
  const inSpan = iy - gap - padY;
  // right stack (categories then saved)
  const rights = [...cats.map(([n, v]) => [n, v, 'var(--expense)']), ['Saved', saved, 'var(--saved)']];
  let oy = padY; const outNodes = rights.map(([n, v, c]) => { const bh = (v / outTotal) * colH; const node = { n, v, c, y: oy, bh }; oy += bh + gap; return node; });
  const midY = padY, midH = colH;
  // flows: distribute from a single merged middle bar to each out node
  let fromY = midY;
  const flows = outNodes.map((o) => { const fh = o.bh; const path = `M${midX + inW} ${fromY} C${(midX + outX) / 2} ${fromY}, ${(midX + outX) / 2} ${o.y}, ${outX} ${o.y} L${outX} ${o.y + o.bh} C${(midX + outX) / 2} ${o.y + o.bh}, ${(midX + outX) / 2} ${fromY + fh}, ${midX + inW} ${fromY + fh} Z`; const seg = { path, c: o.c }; fromY += fh; return seg; });
  let fromYi = midY;
  const inFlows = inNodes.map((i) => { const fh = i.bh; const path = `M${inX + inW} ${i.y} C${(inX + midX) / 2} ${i.y}, ${(inX + midX) / 2} ${fromYi}, ${midX} ${fromYi} L${midX} ${fromYi + fh} C${(inX + midX) / 2} ${fromYi + fh}, ${(inX + midX) / 2} ${i.y + i.bh}, ${inX + inW} ${i.y + i.bh} Z`; const seg = { path, c: i.c }; fromYi += fh; return seg; });
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible', fontFamily: 'var(--font-mono)' }}>
      {inFlows.map((f, i) => <path key={i} d={f.path} fill={f.c} opacity="0.22" />)}
      {flows.map((f, i) => <path key={i} d={f.path} fill={f.c} opacity="0.22" />)}
      {inNodes.map((n, i) => <rect key={i} x={inX} y={n.y} width={inW} height={n.bh} rx={3} fill={n.c} />)}
      <rect x={midX} y={midY} width={inW} height={midH} rx={3} fill="var(--coral)" />
      {outNodes.map((n, i) => <rect key={i} x={outX} y={n.y} width={inW} height={n.bh} rx={3} fill={n.c} />)}
      {inNodes.map((n, i) => <text key={i} x={inX + inW + 7} y={n.y + n.bh / 2 + 3} fontSize="11" fill="var(--text-2)">{n.n}</text>)}
      <text x={midX - 6} y={midY - 3} fontSize="10.5" fill="var(--text-3)" textAnchor="end" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700 }}>IN $5,140</text>
      {outNodes.map((n, i) => <text key={i} x={outX - 7} y={n.y + n.bh / 2 + 3} fontSize="11" fill={n.n === 'Saved' ? 'var(--saved)' : 'var(--text-2)'} textAnchor="end">{n.n}</text>)}
    </svg>
  );
}

// ── spending heatmap calendar (5 weeks) ──
function Heatmap({ cell = 30, gap = 5 }) {
  // 35 days; value 0 = no spend; labels for payday/bill
  const data = [0, 18, 42, 0, 88, 64, 120, 0, 0, 34, 210, 22, 48, 90, 0, 12, 0, 0, 156, 38, 72, 0, 28, 480, 14, 0, 0, 62, 41, 19, 0, 0, 33, 142, 7];
  const labels = { 10: 'Pay', 23: 'Rent', 18: 'Bills' };
  const max = Math.max(...data);
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const colorFor = (v) => v === 0 ? 'var(--surface-3)' : `color-mix(in oklch, var(--coral) ${18 + (v / max) * 72}%, var(--surface-2))`;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, ${cell}px)`, gap, marginBottom: 6 }}>
        {days.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, ${cell}px)`, gap }}>
        {data.map((v, i) => (
          <div key={i} title={v === 0 ? 'No spend' : '$' + v} style={{ width: cell, height: cell, borderRadius: 7, background: colorFor(v), border: v === 0 ? '1px dashed var(--line)' : '1px solid transparent', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {v === 0 && <span style={{ width: 4, height: 4, borderRadius: 999, background: 'var(--text-3)', opacity: 0.5 }} />}
            {labels[i] && <span style={{ position: 'absolute', bottom: -1, right: 1, fontSize: 7.5, fontWeight: 700, color: 'var(--text-2)', fontFamily: 'var(--font-sans)' }}>{labels[i]}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── net-worth trend: assets up, debts down from baseline, net line ──
function NetWorthTrend({ w = 540, h = 220 }) {
  const assets = [38, 39, 41, 40, 43, 45, 46, 48, 49, 51, 53, 55];
  const debts = [14, 13.6, 13, 12.2, 11.5, 10.8, 10.1, 9.6, 9.1, 8.7, 8.4, 8.24];
  const net = assets.map((a, i) => a - debts[i]);
  const maxA = Math.max(...assets) * 1.05, padX = 4;
  const X = (i) => padX + (i / (assets.length - 1)) * (w - padX * 2);
  const mid = h * 0.62; // baseline for assets/debts split
  const aY = (v) => mid - (v / maxA) * (mid - 10);
  const dY = (v) => mid + (v / maxA) * (h - mid - 24);
  const nMax = Math.max(...net), nMin = Math.min(...net);
  const nY = (v) => mid - ((v - nMin) / (nMax - nMin || 1)) * (mid - 14) - 2;
  const area = (pts, yf) => pts.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${yf(p).toFixed(1)}`).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
      <line x1={0} x2={w} y1={mid} y2={mid} stroke="var(--line)" strokeWidth="1" />
      <path d={`${area(assets, aY)} L${X(assets.length - 1)} ${mid} L${X(0)} ${mid} Z`} fill="var(--saved)" opacity="0.16" />
      <path d={area(assets, aY)} fill="none" stroke="var(--saved)" strokeWidth="2" />
      <path d={`${area(debts, dY)} L${X(debts.length - 1)} ${mid} L${X(0)} ${mid} Z`} fill="var(--debt)" opacity="0.16" />
      <path d={area(debts, dY)} fill="none" stroke="var(--debt)" strokeWidth="2" />
      <path d={area(net, nY)} fill="none" stroke="var(--coral)" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx={X(net.length - 1)} cy={nY(net[net.length - 1])} r="3.5" fill="var(--coral)" stroke="var(--bg)" strokeWidth="2" />
    </svg>
  );
}

// ── donut category breakdown ──
function Donut({ size = 130, thickness = 16, data }) {
  const segs = data || [['Housing', 42, 'var(--viz-1)'], ['Food', 18, 'var(--viz-2)'], ['Transport', 12, 'var(--viz-3)'], ['Lifestyle', 16, 'var(--viz-4)'], ['Bills', 12, 'var(--viz-5)']];
  const r = (size - thickness) / 2, c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      {segs.map(([n, v, col], i) => {
        const len = (v / 100) * c; const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={thickness} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc} />; acc += len; return el;
      })}
    </svg>
  );
}

Object.assign(window, { Sankey, Heatmap, NetWorthTrend, Donut });
