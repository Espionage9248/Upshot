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
