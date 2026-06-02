/*__IIFE_WRAP__*/;(function(){
// expansion.jsx — CONVERGED Upshot system (round 2). Concatenated build.
// Now consumes the canonical token contract (ds/tokens.css) — light + dark.


// ===== build/core.jsx =====
// core.jsx — CONVERGED "Upshot" system: warm editorial shell (Vellum) +
// confident, colourblind-safe money (Beacon). Tokens + icons + shared atoms.

(function injectUp() {
  if (document.getElementById('up-tokens')) return;
  const s = document.createElement('style');
  s.id = 'up-tokens';
  s.textContent = `
  /* Consumes the canonical token contract (ds/tokens.css): light (:root) +
     dark (.dark) authored as peers, canonical names. .up is now a thin
     ergonomic scope — font + box-sizing + tabular figures + focus ring.
     No colour overrides: every surface/text/semantic value flows from tokens. */
  .up{ font-family: var(--font-sans); color: var(--text); background: var(--bg); }
  .up, .up *{ box-sizing:border-box; }
  .up .tnum{ font-variant-numeric:tabular-nums; font-feature-settings:'tnum' 1; white-space:nowrap; }
  .up :focus-visible{ outline:2px solid var(--focus); outline-offset:2px; border-radius:var(--radius-sm); }
  `;
  document.head.appendChild(s);
})();

const UP_ICONS = {
  today:'M12 3.6v2M5 7l1.4 1.4M3.6 12h2M19 7l-1.4 1.4M20.4 12h-2M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM7.5 17.5h9',
  money:'M3.5 7.5h17v10h-17zM3.5 11h17M7 14.5h3',
  ledger:'M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3V3.5zM9 8h6M9 11.5h6M9 15h3',
  plan:'M12 4l8 4-8 4-8-4 8-4zM4 12l8 4 8-4M4 16l8 4 8-4',
  look:'M5 19V5M5 19h14M9 16v-4M13 16V9M17 16v-7',
  gear:'M12 9.2a2.8 2.8 0 100 5.6 2.8 2.8 0 000-5.6zM12 3.5l1 2.2 2.4-.5.6 2.4 2.2 1-1 2.2 1.4 2-2 1.4.4 2.4-2.4.6-1 2.2H11l-1-2.2-2.4-.5-.4-2.4-2-1.4 1.4-2-1-2.2 2.2-1 .6-2.4 2.4.5z',
  search:'M11 4.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM20 20l-4.4-4.4',
  plus:'M12 5v14M5 12h14',
  up:'M12 19V5M6 11l6-6 6 6',
  down:'M12 5v14M6 13l6 6 6-6',
  swap:'M7 8h12l-3-3M17 16H5l3 3',
  bell:'M12 4a5 5 0 015 5c0 5 2 6 2 6H5s2-1 2-6a5 5 0 015-5zM10 19a2 2 0 004 0',
  sync:'M19 8a7 7 0 10.5 6M19 4v4h-4',
  flame:'M12 3.5c2 3 5 4.5 5 8.5a5 5 0 11-10 0c0-1.6.7-2.6 1.5-3.5.4 1 .9 1.5 1.7 1.8C9.5 8 10 5.5 12 3.5z',
  calendar:'M5 6.5h14v13H5zM5 10h14M9 4v3M15 4v3',
  card:'M3.5 6.5h17v11h-17zM3.5 10.5h17M7 14.5h4',
  target:'M12 4.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM12 11.6a.4.4 0 100 .8.4.4 0 000-.8z',
  check:'M5 12.5l4.5 4.5L19 7',
  dot:'M12 9a3 3 0 100 6 3 3 0 000-6z',
  arrowR:'M5 12h13M13 6l6 6-6 6',
  filter:'M4 6h16M7 12h10M10 18h4',
  wallet:'M4 7.5h13a2 2 0 012 2V17a2 2 0 01-2 2H5a1.5 1.5 0 01-1.5-1.5V7.5zM4 7.5L15 4v3.5M17 12.5h.01',
  pie:'M12 4.5v7.5h7.5A7.5 7.5 0 1012 4.5zM13.5 3.2A7.5 7.5 0 0120.8 10.5h-7.3z',
  shield:'M12 3.5l7 2.5v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z',
  clock:'M12 4.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM12 8.5V12l2.5 1.5',
  grid:'M4 4.5h6v6H4zM14 4.5h6v6h-6zM4 14.5h6v6H4zM14 14.5h6v6h-6z',
  scale:'M12 4v16M7 20h10M12 6l-6 2 6-2 6 2M6 8l-2.5 5h5zM18 8l-2.5 5h5zM3.5 13a2.5 2.5 0 005 0M15.5 13a2.5 2.5 0 005 0',
  building:'M5 20.5V5.5h9v15M14 11h5v9.5M8 9h3M8 13h3M8 17h3M16.5 14h0M16.5 17.5h0',
  percent:'M7 7.5a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4zM17 14.1a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4zM6 18L18 6',
  tag:'M4 4.5h7l9 9-6.5 6.5-9-9V4.5zM8 8.5h0',
  flag:'M6 21V4.5M6 5h11l-2 3.5L17 12H6',
  command:'M9 6a3 3 0 10-3 3h3V6zM15 6a3 3 0 113 3h-3V6zM9 18a3 3 0 11-3-3h3v3zM15 18a3 3 0 103-3h-3v3zM9 9h6v6H9z',
  repeat:'M5 9a6 6 0 016-6h3l-2-2M19 15a6 6 0 01-6 6h-3l2 2M16 3l2 2-2 2M8 21l-2-2 2-2',
  alert:'M12 4l9 16H3zM12 10v4M12 17h.01',
  pencil:'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
  eye:'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9a3 3 0 100 6 3 3 0 000-6z',
  trend:'M4 16l5-5 3 3 6-7M14 7h4v4',
  merge:'M6 4v6a4 4 0 004 4h8M18 4v6a4 4 0 01-4 4M16 18l3-2-3-2',
  sliders:'M5 7h9M18 7h1M5 12h1M10 12h9M5 17h5M14 17h5M14 5v4M6 10v4M10 15v4',
  gift:'M4 9h16v3H4zM5 12h14v8H5zM12 9v11M12 9S10.5 4.5 8 5.5 9 9 12 9zM12 9s1.5-4.5 4-3.5S15 9 12 9z',
  pause:'M9 5v14M15 5v14',
  link:'M9 12h6M10 8.5H8a3.5 3.5 0 000 7h2M14 8.5h2a3.5 3.5 0 010 7h-2',
  zero:'M12 4.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM7 17L17 7',
  drag:'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  home:'M4 11l8-6.5L20 11M6 9.5V20h12V9.5M10 20v-5h4v5',
};

function UIcon({ name, size = 18, stroke = 1.6, style, className }) {
  const d = UP_ICONS[name] || UP_ICONS.dot;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style} className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function fmt(n, { cents = true, k = false } = {}) {
  const neg = n < 0; let abs = Math.abs(n);
  if (k && abs >= 1000) return { sign: neg ? '−' : '+', neg, body: '$' + (abs / 1000).toFixed(abs >= 10000 ? 0 : 1) + 'k' };
  const s = abs.toLocaleString('en-AU', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
  return { sign: neg ? '−' : '+', neg, body: '$' + s };
}

// converged money atom — colour-coded + sign (+ optional arrow); quiet=neutral text
function Money({ n, kind = 'expense', size = 15, weight = 600, cents = true, arrow = false, quiet = false, k = false }) {
  const f = fmt(n, { cents, k });
  const map = {
    income: ['var(--income)', '+', 'up'], expense: ['var(--expense)', '−', 'down'],
    transfer: ['var(--transfer)', '', 'swap'], saved: ['var(--saved)', '+', 'up'],
    debt: ['var(--debt)', '−', 'down'], projected: ['var(--proj)', '~', null],
    neutral: ['var(--text)', f.neg ? '−' : '', null],
  };
  const [color, sign, ic] = map[kind] || map.expense;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: quiet ? 'var(--text)' : color, whiteSpace: 'nowrap',
      borderBottom: kind === 'projected' ? '1px dashed var(--proj)' : 'none', paddingBottom: kind === 'projected' ? 1 : 0 }}>
      {arrow && ic && <UIcon name={ic} size={size * 0.8} stroke={2.3} />}
      <span className="tnum" style={{ fontFamily: 'var(--font-mono)', fontWeight: weight, fontSize: size, letterSpacing: '-0.02em' }}>
        <span style={{ opacity: 0.85 }}>{sign}</span>{f.body}
      </span>
    </span>
  );
}

function Card({ children, style, pad = 20, soft = true }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: soft ? 'var(--radius-card)' : 'var(--radius-data)', padding: pad,
      boxShadow: 'var(--elev-2)', ...style }}>{children}</div>
  );
}

function Label({ children, style }) {
  return <div style={{ fontSize: 11, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, ...style }}>{children}</div>;
}

function Pill({ kind, label }) {
  const map = { income: ['Income', 'var(--income)'], expense: ['Expense', 'var(--expense)'], transfer: ['Transfer', 'var(--transfer)'], saved: ['Saved', 'var(--saved)'], debt: ['Debt', 'var(--debt)'], warn: ['Warning', 'var(--warn)'], projected: ['Projected', 'var(--proj)'] };
  const [lbl, c] = map[kind] || ['', 'var(--text-2)'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: c, padding: '3px 9px 3px 7px', borderRadius: 'var(--radius-data)', whiteSpace: 'nowrap',
      background: `color-mix(in oklch, ${c} 14%, transparent)`, border: `1px solid color-mix(in oklch, ${c} 28%, transparent)` }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: c }} />{label || lbl}
    </span>
  );
}

// confidence: 'on' | 'at' | 'off' — never colour-only (label + glyph + position)
function Confidence({ level = 'on', compact = false }) {
  const steps = [['off', 'Off track', 'var(--expense)'], ['at', 'At risk', 'var(--warn)'], ['on', 'On track', 'var(--income)']];
  const active = steps.find((s) => s[0] === level) || steps[2];
  if (compact) {
    const [, lbl, c] = active;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: c, whiteSpace: 'nowrap' }}>
        {level === 'on' ? <UIcon name="check" size={13} stroke={2.6} /> : level === 'at' ? <UIcon name="alert" size={13} stroke={2.2} /> : <UIcon name="down" size={13} stroke={2.4} />}
        {lbl}
      </span>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {steps.map(([id, lbl, c]) => {
        const on = id === level;
        return (
          <div key={id} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 700, padding: '6px 0', borderRadius: 'var(--radius-data)', whiteSpace: 'nowrap',
            background: on ? `color-mix(in oklch, ${c} 16%, transparent)` : 'transparent', color: on ? c : 'var(--text-3)',
            border: on ? `1px solid color-mix(in oklch, ${c} 32%, transparent)` : '1px solid var(--line)' }}>{on ? (id === 'on' ? '✓ ' : '• ') : ''}{lbl}</div>
        );
      })}
    </div>
  );
}

// credit-card utilisation — concern, not panic
function Utilisation({ used, limit, w = '100%' }) {
  const pct = Math.min(1, used / limit);
  const c = pct > 0.8 ? 'var(--warn)' : pct > 0.5 ? 'var(--debt)' : 'var(--income)';
  return (
    <div style={{ width: w }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600 }}>Utilisation</span>
        <span className="tnum" style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, color: c }}>{Math.round(pct * 100)}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: 'var(--surface-3)', overflow: 'hidden', position: 'relative' }}>
        <div style={{ width: pct * 100 + '%', height: '100%', borderRadius: 999, background: c }} />
        <div style={{ position: 'absolute', top: -2, bottom: -2, left: '80%', width: 1.5, background: 'var(--text-3)', opacity: 0.6 }} />
      </div>
      <div className="tnum" style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 5, fontFamily: 'var(--font-mono)' }}>${used.toLocaleString()} of ${limit.toLocaleString()} limit</div>
    </div>
  );
}

function Gauge({ pct, size = 116, value, sub, color = 'var(--saved)', thickness = 9 }) {
  const r = (size - thickness - 2) / 2, c = 2 * Math.PI * r, off = c * (1 - pct);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={thickness} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="tnum" style={{ fontSize: size * 0.2, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{value}</div>
        {sub && <div style={{ fontSize: 9.5, color: 'var(--text-3)' }}>{sub}</div>}
      </div>
    </div>
  );
}

// line/area spark with optional projected tail + confidence band
function Spark({ points, w = 160, h = 44, stroke = 'var(--coral)', fill, sw = 2, projFrom = null, band = null }) {
  const max = Math.max(...points), min = Math.min(...points), rng = max - min || 1;
  const X = (i) => (i / (points.length - 1)) * w, Y = (v) => h - ((v - min) / rng) * (h - 6) - 3;
  const seg = (a, b) => points.slice(a, b).map((p, i) => `${i ? 'L' : 'M'}${X(i + a).toFixed(1)} ${Y(p).toFixed(1)}`).join(' ');
  const pf = projFrom == null ? points.length - 1 : projFrom;
  const solid = seg(0, pf + 1), proj = pf < points.length - 1 ? seg(pf, points.length) : null;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ display: 'block', overflow: 'visible' }}>
      {band && (() => { const up = band.map((b, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(points[i] + b).toFixed(1)}`).join(' '); const dn = band.map((b, i) => `L${X(band.length - 1 - i).toFixed(1)} ${Y(points[band.length - 1 - i] - band[band.length - 1 - i]).toFixed(1)}`).join(' '); return <path d={`${up} ${dn} Z`} fill={stroke} opacity="0.12" stroke="none" />; })()}
      {fill && <path d={`${solid} L${X(pf)} ${h} L0 ${h} Z`} fill={fill} stroke="none" />}
      <path d={solid} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      {proj && <path d={proj} stroke={stroke} strokeWidth={sw} strokeDasharray="3 3" opacity="0.75" strokeLinecap="round" />}
    </svg>
  );
}

Object.assign(window, { UIcon, fmt, Money, Card, Label, Pill, Confidence, Utilisation, Gauge, Spark });


// ===== build/charts.jsx =====
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


// ===== build/nav.jsx =====
// nav.jsx — converged chrome (UpRail) + the revised IA map artboard.

const ROOMS = [
  ['today', 'today', 'Today'],
  ['ledger', 'ledger', 'Money'],
  ['wallet', 'wallet', 'Budget'],
  ['plan', 'plan', 'Plan'],
  ['look', 'look', 'Analyze'],
];

function UpRail({ active = 'today' }) {
  return (
    <div style={{ width: 84, flexShrink: 0, background: 'var(--bg)', borderRight: '1px solid var(--line-soft)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '22px 0 18px' }}>
      <div style={{ width: 32, height: 32, borderRadius: 11, background: 'radial-gradient(120% 120% at 30% 20%, #ffb199, var(--coral) 55%, #e8553f)', boxShadow: '0 4px 14px rgba(255,112,92,0.34)', marginBottom: 26 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        {ROOMS.map(([id, ic, label]) => {
          const on = id === active;
          return (
            <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 64 }}>
              <div style={{ width: 48, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? 'var(--coral-dim)' : 'transparent', color: on ? 'var(--coral)' : 'var(--text-3)' }}>
                <UIcon name={ic} size={21} stroke={on ? 1.9 : 1.6} />
              </div>
              <span style={{ fontSize: 10.5, color: on ? 'var(--coral)' : 'var(--text-3)', fontWeight: on ? 600 : 500 }}>{label}</span>
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 9px', borderRadius: 8, border: '1px solid var(--line)', color: 'var(--text-3)', fontSize: 10.5, marginBottom: 14, fontFamily: 'var(--font-mono)' }}>⌘K</div>
      <div style={{ color: 'var(--text-3)', marginBottom: 14 }}><UIcon name="gear" size={20} /></div>
      <div style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', fontWeight: 600, fontSize: 12 }}>SM</div>
    </div>
  );
}

function TopBar({ title, sub, healthy = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        {sub && <div style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 4 }}>{sub}</div>}
        <div style={{ fontSize: 27, fontWeight: 600, letterSpacing: '-0.02em' }}>{title}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 14px', borderRadius: 999, border: '1px solid var(--line)', color: 'var(--text-3)', fontSize: 13, whiteSpace: 'nowrap' }}><UIcon name="search" size={15} /> Search <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.7 }}>⌘K</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 13px', borderRadius: 999, border: '1px solid var(--line)', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap' }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--income)' }} /> Synced · 4m
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 999, border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}><UIcon name="bell" size={17} /></div>
      </div>
    </div>
  );
}

// ── Revised IA map ──
function IAChip({ children, isNew }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '8px 10px', borderRadius: 9, minHeight: 34, background: isNew ? 'var(--coral-dim)' : 'var(--surface-2)', border: isNew ? '1px solid color-mix(in oklch, var(--coral) 30%, transparent)' : '1px solid var(--line)' }}>
      <span style={{ fontSize: 12, lineHeight: 1.25, color: isNew ? 'var(--text)' : 'var(--text-2)', fontWeight: isNew ? 600 : 500, flex: 1 }}>{children}</span>
      {isNew && <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.06em', color: 'var(--coral-text)', flexShrink: 0, marginTop: 2 }}>NEW</span>}
    </div>
  );
}

function IAMap() {
  const cols = [
    ['today', 'Today', 'The configurable glance', [['Safe-to-spend', 0], ['Named health state', 1], ['Net-worth summary', 1], ['Upcoming bills & BNPL', 0], ['Auto-insight cards', 1], ['Arrangeable widgets', 1]]],
    ['ledger', 'Money', 'The ledger + rules', [['Transactions', 0], ['Categories & tags', 0], ['Match-rule builder', 0], ['Flag deductible', 1]]],
    ['wallet', 'Budget', 'Envelopes & savers', [['Saver vs allocation', 0], ['Saver confidence', 1], ['Emergency fund', 0], ['Allocate / transfer', 0]]],
    ['plan', 'Plan', 'What you owe & intend', [['Debts + utilisation', 1], ['BNPL / installments', 0], ['Recurring intelligence', 1], ['Purchases + confidence', 1], ['Scenarios + bands', 1]]],
    ['look', 'Analyze', 'Read more than edit', [['Reports + MoM deltas', 1], ['Spending heatmap', 1], ['No-spend streaks', 1], ['Money-flow diagram', 1], ['Tax time', 1], ['Health & patterns', 0]]],
  ];
  const decisions = [
    ['scale', 'Net worth & assets', 'A dashboard section (total + trend) that drills into a dedicated surface for managing manual assets. The glance needs the number; managing assets needs room — so it earns a surface, not a rail slot. Reached from Today & Plan.'],
    ['flag', 'Tax time', 'A seasonal surface under Analyze. It is read a few weeks a year, so it doesn\u2019t earn permanent nav weight — the dashboard raises a quiet \u201ctax time\u201d nudge near EOFY instead.'],
    ['merge', 'Money-flow & configurable glance', 'The Sankey is a Reports centrepiece, not the daily hero — it\u2019s exploratory, not glanceable. The dashboard stays owner-arrangeable, but ships a strong default that protects the 2-second read.'],
  ];
  return (
    <div className="up" style={{ width: '100%', height: '100%', background: 'var(--bg)', padding: 40, display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 6 }}>ROUND 2 · REVISED INFORMATION ARCHITECTURE</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em' }}>Five places, plus ⌘K</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>14 V1 routes + a dozen new capabilities → <span style={{ color: 'var(--text)', fontWeight: 600 }}>5 calm rooms</span></div>
      </div>
      <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5, margin: '10px 0 20px', maxWidth: 880 }}>
        Each new capability gets a home below — <span style={{ color: 'var(--coral-text)', fontWeight: 600 }}>coral = newly committed</span>. The rail stays five so it survives a phone; everything else nests one layer in, reachable instantly by command palette.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 22 }}>
        {cols.map(([ic, name, tag, items]) => (
          <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, paddingBottom: 11, borderBottom: '1px solid var(--line)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--coral-dim)', color: 'var(--coral-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UIcon name={ic} size={18} /></div>
              <div><div style={{ fontSize: 15, fontWeight: 700 }}>{name}</div><div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{tag}</div></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {items.map(([t, n]) => <IAChip key={t} isNew={!!n}>{t}</IAChip>)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 'auto' }}>
        {decisions.map(([ic, t, body]) => (
          <div key={t} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-card)', padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <span style={{ color: 'var(--coral-text)' }}><UIcon name={ic} size={18} /></span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{t}</span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>{body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { UpRail, TopBar, IAMap });


// ===== build/dash.jsx =====
// dash.jsx — Dashboard, two directions + edit mode.
// DashCalm (opinionated default) · DashGrid (configurable bento) · DashEdit (arrange)

// named health state — calm spectrum, current highlighted (not a bare score)
function HealthSpectrum({ current = 2 }) {
  const states = ['Stretched', 'Tight', 'Steady', 'Comfortable', 'Ahead'];
  return (
    <div>
      <div style={{ display: 'flex', gap: 6 }}>
        {states.map((s, i) => {
          const on = i === current;
          return (
            <div key={s} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: 9, whiteSpace: 'nowrap',
              background: on ? 'var(--coral-dim)' : 'var(--surface-2)', border: on ? '1px solid color-mix(in oklch, var(--coral) 32%, transparent)' : '1px solid var(--line)',
              fontSize: 11.5, fontWeight: on ? 700 : 500, color: on ? 'var(--coral)' : 'var(--text-3)' }}>{s}</div>
          );
        })}
      </div>
    </div>
  );
}

function NetWorthMini() {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Label>Net worth</Label>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>Assets <UIcon name="arrowR" size={13} /></span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span className="tnum" style={{ fontSize: 30, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em' }}>$46,760</span>
        <Money n={1240} kind="income" size={13} arrow weight={700} />
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>+2.7% this month</div>
      <div style={{ marginTop: 'auto', paddingTop: 14 }}><Spark points={[40, 41, 40.5, 42, 43, 44, 44.5, 45.5, 46, 46.7]} w={300} h={40} stroke="var(--coral)" fill="color-mix(in oklch, var(--coral) 10%, transparent)" /></div>
    </Card>
  );
}

function ForecastCard() {
  const pts = [10.4, 9.8, 9.2, 10.1, 9.6, 8.9, 9.4, 10.2, 11.1, 10.6, 11.4, 12.2];
  const band = pts.map((_, i) => i < 7 ? 0 : (i - 6) * 0.35);
  return (
    <Card style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Label>Cashflow forecast · 90 days</Label>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--text-3)' }}><span style={{ width: 12, height: 0, borderTop: '2px dashed var(--proj)' }} /> projected band</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '8px 0 4px' }}>
        <Money n={1043} kind="neutral" size={22} weight={700} />
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>balance, 30 days</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', minHeight: 70 }}><Spark points={pts} w={320} h={74} stroke="var(--coral)" sw={2.2} projFrom={7} band={band} fill="color-mix(in oklch, var(--coral) 9%, transparent)" /></div>
      <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 8 }}>90-day low <span className="tnum" style={{ fontFamily: 'var(--font-mono)', color: 'var(--warn)', fontWeight: 700 }}>$210</span> · stays positive</div>
    </Card>
  );
}

function ReadinessCard() {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Label>Emergency-fund readiness</Label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Gauge pct={0.75} value="75%" sub="of goal" color="var(--saved)" size={104} />
        <div style={{ flex: 1 }}>
          <div className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--saved)' }}>$4,500 <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>/ $6,000</span></div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', margin: '3px 0 10px' }}>2.4 months runway</div>
          <Confidence level="on" compact />
        </div>
      </div>
    </Card>
  );
}

function InsightCard({ icon, text, accent = 'var(--coral)' }) {
  return (
    <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '13px 14px', background: 'var(--surface-2)', borderRadius: 'var(--radius-data)', border: '1px solid var(--line-soft)' }}>
      <span style={{ color: accent, flexShrink: 0, marginTop: 1 }}><UIcon name={icon} size={16} /></span>
      <span style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45 }}>{text}</span>
    </div>
  );
}

function EnvGlance() {
  const envs = [['Groceries', 186, 600], ['Transport', 92, 180], ['Fun', -22, 150], ['Bills', 410, 410]];
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <Label>Envelopes</Label><span style={{ fontSize: 11.5, color: 'var(--expense)', fontWeight: 600 }}>Fun overspent</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        {envs.map(([n, b, a]) => { const over = b < 0; const pct = Math.max(0, Math.min(1, b / a)); return (
          <div key={n}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{n}</span>
              <span className="tnum" style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: over ? 'var(--expense)' : 'var(--text-2)', fontWeight: 600 }}>{over ? '−$' + Math.abs(b) : '$' + b}<span style={{ color: 'var(--text-3)', fontWeight: 400 }}> / {a}</span></span>
            </div>
            <div style={{ height: 5, borderRadius: 999, background: 'var(--surface-3)', overflow: 'hidden' }}><div style={{ width: (over ? 100 : pct * 100) + '%', height: '100%', borderRadius: 999, background: over ? 'var(--expense)' : 'linear-gradient(90deg, var(--coral-2), var(--coral))' }} /></div>
          </div>
        ); })}
      </div>
    </Card>
  );
}

function UpcomingCard() {
  const bills = [['Origin Energy', 'Electricity', 3, -142.10], ['Cotton On', 'Afterpay 3/4', 2, -48.75], ['Spotify', 'Subscription', 5, -13.99]];
  return (
    <Card>
      <Label style={{ marginBottom: 12 }}>Coming up</Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {bills.map(([n, s, d, amt]) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span className="tnum" style={{ width: 32, height: 26, borderRadius: 7, background: d <= 2 ? 'color-mix(in oklch, var(--warn) 16%, transparent)' : 'var(--surface-2)', color: d <= 2 ? 'var(--warn)' : 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{d}d</span>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n}</div><div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{s}</div></div>
            <Money n={amt} kind="projected" size={12.5} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function DashCalm() {
  return (
    <div className="up" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)' }}>
      <UpRail active="today" />
      <div style={{ flex: 1, padding: '34px 40px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
        <TopBar title="Evening, Sam." sub="SATURDAY, 2 JUNE" />
        {/* hero: named health state + safe to spend */}
        <Card pad={24} style={{ display: 'flex', gap: 28, alignItems: 'stretch' }}>
          <div style={{ flex: '1 1 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Label style={{ margin: 0 }}>This week</Label>
              <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>spending is in line with a normal week</span>
            </div>
            <HealthSpectrum current={2} />
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: 18 }}>
              <div>
                <Label style={{ marginBottom: 6 }}>Safe to spend · through Sunday</Label>
                <span className="tnum" style={{ fontSize: 46, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em', lineHeight: 0.95 }}>$312<span style={{ fontSize: 26, color: 'var(--text-2)' }}>.40</span></span>
              </div>
            </div>
          </div>
          <div style={{ width: 1, background: 'var(--line-soft)' }} />
          <div style={{ flex: '0 0 196px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, whiteSpace: 'nowrap' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={{ fontSize: 13, color: 'var(--text-2)' }}>In this week</span><Money n={2480} kind="income" size={14} weight={700} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={{ fontSize: 13, color: 'var(--text-2)' }}>Out this week</span><Money n={-1914.6} kind="expense" size={14} weight={700} /></div>
            <div style={{ height: 1, background: 'var(--line-soft)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={{ fontSize: 13, color: 'var(--text-2)' }}>Net</span><Money n={565.4} kind="income" size={16} weight={700} /></div>
          </div>
        </Card>
        {/* row: net worth · forecast · readiness */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>
          <NetWorthMini />
          <ForecastCard />
          <ReadinessCard />
        </div>
        {/* row: envelopes · upcoming · insights */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr 1.1fr', gap: 16, flex: 1, minHeight: 0 }}>
          <EnvGlance />
          <UpcomingCard />
          <Card style={{ display: 'flex', flexDirection: 'column' }}>
            <Label style={{ marginBottom: 12 }}>For you</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <InsightCard icon="trend" text="Groceries are tracking 12% under last month — moving $40 to Emergency Fund keeps you on track." />
              <InsightCard icon="repeat" accent="var(--warn)" text="Your Spotify charge rose $2 in May. Two music subscriptions are active." />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Direction 2: configurable bento ──
function Widget({ title, children, span = 1, rows = 1, editing, onAdd }) {
  return (
    <div style={{ gridColumn: `span ${span}`, gridRow: `span ${rows}`, background: 'var(--surface)', border: editing ? '1px dashed color-mix(in oklch, var(--coral) 45%, transparent)' : '1px solid var(--line)', borderRadius: 'var(--radius-card)', padding: 16, position: 'relative', boxShadow: '0 6px 22px rgba(0,0,0,0.18)' }}>
      {editing && (
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
          <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--surface-3)', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab' }}><UIcon name="drag" size={13} /></span>
          <span style={{ width: 22, height: 22, borderRadius: 6, background: 'color-mix(in oklch, var(--expense) 18%, transparent)', color: 'var(--expense)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>×</span>
        </div>
      )}
      {title && <Label style={{ marginBottom: 10 }}>{title}</Label>}
      {children}
    </div>
  );
}

function DashGrid({ editing = false }) {
  return (
    <div className="up" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)' }}>
      <UpRail active="today" />
      <div style={{ flex: 1, padding: '34px 40px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div><div style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>SATURDAY, 2 JUNE</div><div style={{ fontSize: 27, fontWeight: 600, letterSpacing: '-0.02em' }}>Evening, Sam.</div></div>
          <div style={{ display: 'flex', gap: 10 }}>
            {editing ? (
              <React.Fragment>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 999, border: '1px solid var(--line)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600 }}>Reset to default</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 18px', borderRadius: 999, background: 'var(--coral)', color: '#2a1410', fontSize: 13, fontWeight: 700 }}><UIcon name="check" size={15} /> Done</span>
              </React.Fragment>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 15px', borderRadius: 999, border: '1px solid var(--line)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600 }}><UIcon name="sliders" size={15} /> Arrange</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: '1fr', gap: 14, minHeight: 0, opacity: editing ? 0.96 : 1 }}>
            <Widget span={2} title="Safe to spend · through Sunday" editing={editing}>
              <div className="tnum" style={{ fontSize: 38, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em', marginTop: 2 }}>$312<span style={{ fontSize: 22, color: 'var(--text-2)' }}>.40</span></div>
              <div style={{ marginTop: 10 }}><HealthSpectrum current={2} /></div>
            </Widget>
            <Widget title="Net worth" editing={editing}>
              <div className="tnum" style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>$46.8k</div>
              <div style={{ marginTop: 2 }}><Money n={1240} kind="income" size={11.5} arrow weight={700} /></div>
            </Widget>
            <Widget title="Readiness" editing={editing}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Gauge pct={0.75} value="75%" size={56} thickness={7} color="var(--saved)" /><Confidence level="on" compact /></div>
            </Widget>
            <Widget span={2} title="Cashflow forecast" editing={editing}>
              <div style={{ marginTop: 4 }}><Spark points={[10.4, 9.8, 9.2, 10.1, 9.6, 8.9, 9.4, 10.2, 11.1, 10.6, 11.4, 12.2]} w={300} h={56} stroke="var(--coral)" projFrom={7} band={[0, 0, 0, 0, 0, 0, 0, 0.4, 0.8, 1.1, 1.5, 1.8]} fill="color-mix(in oklch, var(--coral) 9%, transparent)" /></div>
            </Widget>
            <Widget title="Streak" editing={editing}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}><span style={{ color: 'var(--income)' }}><UIcon name="flame" size={20} /></span><span className="tnum" style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>6</span></div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>no-spend days</div>
            </Widget>
            <Widget title="Upcoming" editing={editing}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}><span>Origin</span><Money n={-142.1} kind="projected" size={12} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}><span>Afterpay</span><Money n={-48.75} kind="projected" size={12} /></div>
            </Widget>
            <Widget span={2} title="For you" editing={editing}>
              <InsightCard icon="repeat" accent="var(--warn)" text="Spotify rose $2 in May — and two music subscriptions are active." />
            </Widget>
          </div>
          {editing && (
            <div style={{ width: 232, flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-card)', padding: 16, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Add a widget</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 14 }}>Drag onto the grid</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['pie', 'Category breakdown'], ['merge', 'Money-flow'], ['scale', 'Net-worth trend'], ['calendar', 'Spending heatmap'], ['card', 'Card utilisation'], ['gift', 'Wishlist progress']].map(([ic, t]) => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--line)', cursor: 'grab' }}>
                    <span style={{ color: 'var(--text-3)' }}><UIcon name={ic} size={16} /></span>
                    <span style={{ fontSize: 12.5, fontWeight: 500, flex: 1 }}>{t}</span>
                    <span style={{ color: 'var(--coral-text)' }}><UIcon name="plus" size={15} /></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DashEdit() { return <DashGrid editing />; }

Object.assign(window, { DashCalm, DashGrid, DashEdit, HealthSpectrum, NetWorthMini, ForecastCard, ReadinessCard, InsightCard, EnvGlance, UpcomingCard });


// ===== build/surfaces.jsx =====
// surfaces.jsx — Net worth · Recurring intelligence · Analytics · Tax time.

function AssetRow({ icon, name, type, value, delta, manual, util }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--line-soft)' }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', flexShrink: 0 }}><UIcon name={icon} size={19} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>{name}</span>
          {manual && <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-3)', padding: '2px 6px', borderRadius: 5, border: '1px solid var(--line)' }}>MANUAL</span>}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>{type}</div>
        {util && <div style={{ marginTop: 8, maxWidth: 230 }}><Utilisation used={util[0]} limit={util[1]} /></div>}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="tnum" style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>${value.toLocaleString()}</div>
        {delta != null && <div style={{ marginTop: 2 }}><Money n={delta} kind={delta >= 0 ? 'income' : 'debt'} size={11.5} arrow weight={600} /></div>}
      </div>
    </div>
  );
}

function NetWorth() {
  return (
    <div className="up" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)' }}>
      <UpRail active="plan" />
      <div style={{ flex: 1, padding: '34px 40px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
        <TopBar title="Net worth" sub="ASSETS − DEBTS · UPDATED TODAY" />
        <Card pad={22} style={{ display: 'flex', gap: 28 }}>
          <div style={{ flex: '0 0 230px' }}>
            <Label>Total net worth</Label>
            <div className="tnum" style={{ fontSize: 44, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em', margin: '8px 0 6px' }}>$46,760</div>
            <Money n={1240} kind="income" size={14} arrow weight={700} /><span style={{ fontSize: 12.5, color: 'var(--text-3)', marginLeft: 8 }}>+2.7% this month</span>
            <div style={{ display: 'flex', gap: 7, marginTop: 18 }}>
              {['3M', '6M', '1Y', 'All'].map((t, i) => <span key={t} style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, background: i === 2 ? 'var(--coral-dim)' : 'transparent', color: i === 2 ? 'var(--coral)' : 'var(--text-3)', border: i === 2 ? '1px solid color-mix(in oklch, var(--coral) 30%, transparent)' : '1px solid var(--line)' }}>{t}</span>)}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
              {[['Assets', 'var(--saved)', '$55.0k'], ['Debts', 'var(--debt)', '$8.2k'], ['Net', 'var(--coral)', '$46.8k']].map(([l, c, v]) => (
                <div key={l}><div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}</div><div className="tnum" style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: 3 }}>{v}</div></div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}><NetWorthTrend w={620} h={210} /></div>
        </Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>
          <Card pad={0}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 12px' }}>
              <Label>Assets · $55,000</Label>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--coral-text)' }}><UIcon name="plus" size={14} /> Add asset</span>
            </div>
            <AssetRow icon="wallet" name="Up Savers" type="Bank · auto-synced" value={4500} delta={200} />
            <AssetRow icon="trend" name="Superannuation" type="AustralianSuper" value={28200} delta={640} manual />
            <AssetRow icon="scale" name="Investments" type="Stake · CommSec" value={9800} delta={-180} manual />
            <AssetRow icon="building" name="Car" type="2019 Mazda 3 · est." value={12500} delta={-120} manual />
          </Card>
          <Card pad={0}>
            <div style={{ padding: '16px 16px 12px' }}><Label>Debts · $8,240</Label></div>
            <AssetRow icon="flame" name="Car loan" type="3.1% · clear Mar ’27" value={6240} delta={-450} />
            <AssetRow icon="card" name="Visa credit card" type="18.9% · $612 due" value={2000} delta={-162} util={[1240, 2000]} />
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Recurring intelligence ──
function SubRow({ name, cat, monthly, next, perUse, drift, overlap, paused }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr 0.9fr 0.9fr', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: '1px solid var(--line-soft)', opacity: paused ? 0.55 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{name[0]}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>{name}</span>
            {drift && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: 'var(--warn)', padding: '2px 6px', borderRadius: 6, background: 'color-mix(in oklch, var(--warn) 14%, transparent)' }}><UIcon name="up" size={10} stroke={2.6} />+${drift}</span>}
            {overlap && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--transfer)', padding: '2px 6px', borderRadius: 6, background: 'color-mix(in oklch, var(--transfer) 14%, transparent)' }}>OVERLAP</span>}
            {paused && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', padding: '2px 6px', borderRadius: 6, border: '1px solid var(--line)' }}>PAUSED</span>}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>{cat} · next {next}</div>
        </div>
      </div>
      <div className="tnum" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700 }}>${monthly.toFixed(2)}<span style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 400 }}>/mo</span></div>
      <div className="tnum" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-2)' }}>${(monthly * 12).toFixed(0)}<span style={{ fontSize: 10, color: 'var(--text-3)' }}>/yr</span></div>
      <div style={{ textAlign: 'right', fontSize: 12, color: perUse.warn ? 'var(--warn)' : 'var(--text-2)' }}><span className="tnum" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>${perUse.v}</span><div style={{ fontSize: 10, color: 'var(--text-3)' }}>{perUse.label}</div></div>
    </div>
  );
}

function Recurring() {
  return (
    <div className="up" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)' }}>
      <UpRail active="plan" />
      <div style={{ flex: 1, padding: '34px 40px', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        <TopBar title="Recurring" sub="BILLS & SUBSCRIPTIONS" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <Card pad={16}><Label>Monthly commitment</Label><div className="tnum" style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: 6 }}>$486.40</div><div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>11 active · 2 paused · $5,837/yr</div></Card>
          <Card pad={16} style={{ borderLeft: '2px solid var(--warn)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--warn)', marginBottom: 7 }}><UIcon name="up" size={16} stroke={2.4} /><Label style={{ color: 'var(--warn)' }}>Price drift</Label></div><div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.4 }}><b style={{ color: 'var(--text)' }}>Spotify +$2.00</b> and <b style={{ color: 'var(--text)' }}>Netflix +$3.00</b> rose since March.</div></Card>
          <Card pad={16} style={{ borderLeft: '2px solid var(--transfer)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--transfer)', marginBottom: 7 }}><UIcon name="merge" size={16} /><Label style={{ color: 'var(--transfer)' }}>Overlap</Label></div><div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.4 }}>Two <b style={{ color: 'var(--text)' }}>music</b> services active — $16.98/mo combined.</div></Card>
        </div>
        <Card pad={0} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr 0.9fr 0.9fr', gap: 12, padding: '11px 16px', borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}>
            {['Service', 'Monthly', 'Annual', 'Cost / use'].map((h, i) => <span key={h} style={{ fontSize: 10.5, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, textAlign: i ? 'right' : 'left' }}>{h}</span>)}
          </div>
          <SubRow name="Spotify" cat="Music" monthly={13.99} next="5 Jun" drift={2} overlap perUse={{ v: '0.47', label: '30×/mo', warn: false }} />
          <SubRow name="Apple Music" cat="Music" monthly={12.99} next="12 Jun" overlap perUse={{ v: '6.50', label: '2×/mo', warn: true }} />
          <SubRow name="Netflix" cat="Streaming" monthly={22.99} next="8 Jun" drift={3} perUse={{ v: '2.87', label: '8×/mo', warn: false }} />
          <SubRow name="Adobe CC" cat="Software" monthly={21.99} next="20 Jun" perUse={{ v: '1.10', label: '20×/mo', warn: false }} />
          <SubRow name="Gym — Anytime" cat="Health" monthly={64.00} next="1 Jul" perUse={{ v: '32.00', label: '2×/mo', warn: true }} />
          <SubRow name="iCloud 2TB" cat="Storage" monthly={12.49} next="14 Jun" perUse={{ v: '0.42', label: 'daily', warn: false }} />
          <SubRow name="Disney+" cat="Streaming" monthly={13.99} next="—" paused perUse={{ v: '—', label: 'paused', warn: false }} />
        </Card>
      </div>
    </div>
  );
}

// ── Analytics ──
function Analytics() {
  return (
    <div className="up" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)' }}>
      <UpRail active="look" />
      <div style={{ flex: 1, padding: '34px 40px', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        <TopBar title="Analytics" sub="MAY · MONTH TO DATE" />
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>
          <Card style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Label>Spending heatmap · May</Label>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: 'var(--income)' }}><UIcon name="flame" size={15} /> 6-day no-spend streak</span>
            </div>
            <div style={{ display: 'flex', gap: 22 }}>
              <Heatmap cell={34} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }}>
                <div><div className="tnum" style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>11</div><div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>no-spend days this month</div></div>
                <div><div className="tnum" style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>$124</div><div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>avg / spending day</div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--text-3)' }}><span style={{ width: 14, height: 14, borderRadius: 4, border: '1px dashed var(--line)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ width: 3, height: 3, borderRadius: 999, background: 'var(--text-3)' }} /></span> no-spend day</div>
              </div>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Label>Auto-insights</Label>
              <InsightCard icon="trend" text="Your biggest spend day was Friday 24th ($480) — mostly the quarterly car service." />
              <InsightCard icon="zero" accent="var(--income)" text="Weekends now average 28% less than January — the no-spend habit is sticking." />
            </div>
          </Card>
          <Card style={{ display: 'flex', flexDirection: 'column' }}>
            <Label style={{ marginBottom: 14 }}>Where it went · May</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ position: 'relative' }}><Donut size={130} /><div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><span className="tnum" style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>$3.8k</span><span style={{ fontSize: 9.5, color: 'var(--text-3)' }}>spent</span></div></div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[['Housing', 42, 'var(--viz-1)'], ['Food', 18, 'var(--viz-2)'], ['Lifestyle', 16, 'var(--viz-4)'], ['Transport', 12, 'var(--viz-3)'], ['Bills', 12, 'var(--viz-5)']].map(([n, v, c]) => (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: c, flexShrink: 0 }} /><span style={{ fontSize: 12.5, flex: 1 }}>{n}</span><span className="tnum" style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-2)', fontWeight: 600 }}>{v}%</span></div>
                ))}
              </div>
            </div>
            <div style={{ height: 1, background: 'var(--line-soft)', margin: '18px 0' }} />
            <Label style={{ marginBottom: 12 }}>Month over month</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[['Total spend', -3829, -212, 'expense'], ['Income', 4960, 300, 'income'], ['Saved', 770, 120, 'saved']].map(([l, v, d, k]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{l}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Money n={v} kind={k} size={13.5} weight={700} /><span style={{ fontSize: 11, color: 'var(--text-3)', width: 70, textAlign: 'right' }} className="tnum">{d >= 0 ? '▲' : '▼'} ${Math.abs(d)} MoM</span></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Tax time ──
function TaxTime() {
  const rows = [['Home office', 'WFH running costs', 1240, 12], ['Vehicle', 'Logbook 18%', 980, 7], ['Tools & equipment', 'Depreciation', 640, 4], ['Professional dev', 'Courses, books', 420, 3], ['Donations', 'DGR receipts', 180, 2]];
  return (
    <div className="up" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)' }}>
      <UpRail active="look" />
      <div style={{ flex: 1, padding: '34px 40px', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>ANALYZE · FY 2025–26 · 27 DAYS TO EOFY</div>
            <div style={{ fontSize: 27, fontWeight: 600, letterSpacing: '-0.02em' }}>Tax time</div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 15px', borderRadius: 999, border: '1px solid var(--line)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600 }}><UIcon name="flag" size={15} /> Flag a transaction</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <Card pad={18} style={{ borderTop: '2px solid var(--coral)' }}><Label>Deductible total</Label><div className="tnum" style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: 6 }}>$3,460</div><div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>28 flagged transactions</div></Card>
          <Card pad={18} style={{ borderTop: '2px solid var(--income)' }}><Label>Est. deduction benefit</Label><div style={{ marginTop: 6 }}><Money n={1142} kind="income" size={28} weight={700} arrow={false} /></div><div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>at 32.5% marginal rate</div></Card>
          <Card pad={18}><Label>Est. refund position</Label><div className="tnum" style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: 6, color: 'var(--income)' }}>+$2,310</div><div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>estimate · not advice</div></Card>
        </div>
        <Card pad={0} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <Label>Deductible by category</Label>
            <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Estimate only · confirm with your accountant</span>
          </div>
          {rows.map(([n, s, v, c]) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--line-soft)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--coral-text)', flexShrink: 0 }}><UIcon name="flag" size={17} /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>{n}</div><div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{s} · {c} transactions</div></div>
              <div className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700 }}>${v.toLocaleString()}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { NetWorth, Recurring, Analytics, TaxTime });


// ===== build/components.jsx =====
// components.jsx — new-component gallery + command palette + token strip.

function SpecCard({ title, spec, children, style }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-card)', padding: 18, display: 'flex', flexDirection: 'column', ...style }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 16, lineHeight: 1.4 }}>{spec}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>{children}</div>
    </div>
  );
}

function ComponentsGallery() {
  return (
    <div className="up" style={{ width: '100%', height: '100%', background: 'var(--bg)', padding: 40, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 6 }}>ROUND 2 · NEW COMPONENTS</div>
      <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>Nine new parts, one language</div>
      <p style={{ fontSize: 13.5, color: 'var(--text-2)', marginBottom: 22, maxWidth: 820 }}>Each maps to a Radix + CVA primitive with full states; money stays sign + colour + icon (colourblind-safe), projected stays dashed.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr', gap: 16, flex: 1, minHeight: 0 }}>
        <SpecCard title="Confidence indicator" spec="Goal/saver likelihood. Segmented + compact. Never colour-only — label + glyph + position.">
          <Confidence level="on" />
          <div style={{ display: 'flex', gap: 16, marginTop: 14 }}><Confidence level="at" compact /><Confidence level="off" compact /></div>
        </SpecCard>
        <SpecCard title="Card utilisation" spec="Balance-vs-limit. Concern at >80% (warn), not alarm. Marker at the 80% line.">
          <Utilisation used={1240} limit={2000} />
          <div style={{ marginTop: 16 }}><Utilisation used={1850} limit={2000} /></div>
        </SpecCard>
        <SpecCard title="Streak indicator" spec="Quiet encouragement — no-spend days. Calm, never a dopamine mechanic.">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'var(--income)' }}><UIcon name="flame" size={28} /></span>
            <div><div className="tnum" style={{ fontSize: 30, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>6</div><div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>no-spend days · best 9</div></div>
          </div>
        </SpecCard>
        <SpecCard title="Asset card" spec="Manual or synced holding. Value, MoM delta, source tag.">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}><UIcon name="trend" size={19} /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>Superannuation</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>Manual</div></div>
            <div style={{ textAlign: 'right' }}><div className="tnum" style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>$28,200</div><Money n={640} kind="income" size={11} arrow weight={600} /></div>
          </div>
        </SpecCard>
        <SpecCard title="Insight card" spec="Plain-language auto-observation. Helpful, never nagging. Icon accent by topic.">
          <InsightCard icon="repeat" accent="var(--warn)" text="Spotify rose $2 in May — and two music subscriptions are active." />
        </SpecCard>
        <SpecCard title="Net-worth trend" spec="Assets up, debts down from a baseline, net line in coral.">
          <NetWorthTrend w={300} h={110} />
        </SpecCard>
        <SpecCard title="Spending heatmap" spec="Daily intensity calendar; zero-spend dashed; payday/bill auto-labels.">
          <Heatmap cell={20} gap={4} />
        </SpecCard>
        <SpecCard title="Money-flow (Sankey)" spec="income → categories → saved. Respects semantics; a Reports centrepiece.">
          <Sankey w={300} h={150} />
        </SpecCard>
        <SpecCard title="Command palette" spec="⌘K — search, navigate, act. Cross-cutting; keyboard-first.">
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 10, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, paddingBottom: 10, borderBottom: '1px solid var(--line-soft)' }}><UIcon name="search" size={15} style={{ color: 'var(--text-3)' }} /><span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Search or jump to…</span><span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>⌘K</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 6px', marginTop: 6, borderRadius: 7, background: 'var(--coral-dim)' }}><UIcon name="plus" size={14} style={{ color: 'var(--coral-text)' }} /><span style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 600 }}>Add transaction</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 6px', borderRadius: 7 }}><UIcon name="flag" size={14} style={{ color: 'var(--text-3)' }} /><span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>Flag deductible</span></div>
          </div>
        </SpecCard>
      </div>
    </div>
  );
}

function CmdRow({ icon, label, hint, sub, active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: active ? 'var(--coral-dim)' : 'transparent' }}>
      <span style={{ color: active ? 'var(--coral)' : 'var(--text-3)' }}><UIcon name={icon} size={17} /></span>
      <span style={{ fontSize: 13.5, fontWeight: active ? 600 : 500, color: active ? 'var(--text)' : 'var(--text-2)' }}>{label}</span>
      {sub && <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{sub}</span>}
      {hint && <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', border: '1px solid var(--line)', padding: '2px 7px', borderRadius: 6 }}>{hint}</span>}
    </div>
  );
}

function CommandPalette() {
  return (
    <div className="up" style={{ width: '100%', height: '100%', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      {/* faint backdrop hint */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 50% 0%, color-mix(in oklch, var(--coral) 6%, transparent), transparent 60%)' }} />
      <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(2px)', background: 'rgba(10,8,6,0.35)' }} />
      <div style={{ position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)', width: 600, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--elev-3)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: '1px solid var(--line)' }}>
          <UIcon name="search" size={19} style={{ color: 'var(--text-3)' }} />
          <span style={{ fontSize: 16, color: 'var(--text)' }}>spot<span style={{ color: 'var(--text-3)' }}>ify</span><span style={{ display: 'inline-block', width: 1.5, height: 18, background: 'var(--coral)', marginLeft: 1, verticalAlign: 'middle' }} /></span>
          <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>esc</span>
        </div>
        <div style={{ padding: 10, maxHeight: 470, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-3)', padding: '8px 12px 4px' }}>TOP RESULT</div>
          <CmdRow icon="repeat" label="Spotify" sub="Subscription · $13.99/mo · price rose $2" active />
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-3)', padding: '10px 12px 4px' }}>TRANSACTIONS</div>
          <CmdRow icon="ledger" label="Spotify" sub="5 May · −$13.99" />
          <CmdRow icon="ledger" label="Spotify" sub="5 Apr · −$11.99" />
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-3)', padding: '10px 12px 4px' }}>ACTIONS</div>
          <CmdRow icon="flag" label="Flag Spotify as deductible" hint="⏎" />
          <CmdRow icon="pause" label="Pause this subscription" />
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-3)', padding: '10px 12px 4px' }}>GO TO</div>
          <CmdRow icon="repeat" label="Recurring" sub="Bills & subscriptions" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '11px 18px', borderTop: '1px solid var(--line)', background: 'var(--surface-2)', fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          <span>↑↓ navigate</span><span>⏎ select</span><span>⌘1–5 jump to a room</span><span style={{ marginLeft: 'auto' }}>esc close</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ComponentsGallery, CommandPalette });


})();
