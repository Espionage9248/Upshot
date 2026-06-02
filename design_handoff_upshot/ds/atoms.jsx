// ds/atoms.jsx — atoms for the Design System page. Reference tokens.css vars
// globally (no .up scope) so they flip with the light/dark wrapper.

const ICONS = {
  today:'M12 3.6v2M5 7l1.4 1.4M3.6 12h2M19 7l-1.4 1.4M20.4 12h-2M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM7.5 17.5h9',
  ledger:'M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3V3.5zM9 8h6M9 11.5h6M9 15h3',
  wallet:'M4 7.5h13a2 2 0 012 2V17a2 2 0 01-2 2H5a1.5 1.5 0 01-1.5-1.5V7.5zM4 7.5L15 4v3.5M17 12.5h.01',
  plan:'M12 4l8 4-8 4-8-4 8-4zM4 12l8 4 8-4M4 16l8 4 8-4',
  look:'M5 19V5M5 19h14M9 16v-4M13 16V9M17 16v-7',
  search:'M11 4.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM20 20l-4.4-4.4',
  plus:'M12 5v14M5 12h14', up:'M12 19V5M6 11l6-6 6 6', down:'M12 5v14M6 13l6 6 6-6',
  swap:'M7 8h12l-3-3M17 16H5l3 3', check:'M5 12.5l4.5 4.5L19 7', flame:'M12 3.5c2 3 5 4.5 5 8.5a5 5 0 11-10 0c0-1.6.7-2.6 1.5-3.5.4 1 .9 1.5 1.7 1.8C9.5 8 10 5.5 12 3.5z',
  alert:'M12 4l9 16H3zM12 10v4M12 17h.01', repeat:'M5 9a6 6 0 016-6h3l-2-2M19 15a6 6 0 01-6 6h-3l2 2M16 3l2 2-2 2M8 21l-2-2 2-2',
  bell:'M12 4a5 5 0 015 5c0 5 2 6 2 6H5s2-1 2-6a5 5 0 015-5zM10 19a2 2 0 004 0', sync:'M19 8a7 7 0 10.5 6M19 4v4h-4',
  gear:'M12 9.2a2.8 2.8 0 100 5.6 2.8 2.8 0 000-5.6zM12 3.5l1 2.2 2.4-.5.6 2.4 2.2 1-1 2.2 1.4 2-2 1.4.4 2.4-2.4.6-1 2.2H11l-1-2.2-2.4-.5-.4-2.4-2-1.4 1.4-2-1-2.2 2.2-1 .6-2.4 2.4.5z',
  card:'M3.5 6.5h17v11h-17zM3.5 10.5h17M7 14.5h4', flag:'M6 21V4.5M6 5h11l-2 3.5L17 12H6', trend:'M4 16l5-5 3 3 6-7M14 7h4v4',
  sun:'M12 3.6v2M5 7l1.4 1.4M3.6 12h2M19 7l-1.4 1.4M20.4 12h-2M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM7.5 17.5h9M12 18.4v2',
  moon:'M20 14.5A8 8 0 019.5 4 7 7 0 1020 14.5z', dot:'M12 9a3 3 0 100 6 3 3 0 000-6z', x:'M6 6l12 12M18 6L6 18',
  chevron:'M9 5l7 7-7 7', drag:'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01', clock:'M12 4.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM12 8.5V12l2.5 1.5',
};
function Icon({ name, size = 18, stroke = 1.7, style }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true"><path d={ICONS[name] || ICONS.dot} /></svg>;
}

function fmtm(n, cents = true) {
  const neg = n < 0, abs = Math.abs(n);
  return { neg, body: '$' + abs.toLocaleString('en-AU', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }) };
}
function Money({ n, kind = 'expense', size = 15, weight = 600, cents = true, arrow = false, quiet = false }) {
  const f = fmtm(n, cents);
  const map = { income: ['var(--income)', '+', 'up'], expense: ['var(--expense)', '−', 'down'], transfer: ['var(--transfer)', '', 'swap'], saved: ['var(--saved)', '+', 'up'], debt: ['var(--debt)', '−', 'down'], projected: ['var(--proj)', '~', null], neutral: ['var(--text)', f.neg ? '−' : '', null] };
  const [color, sign, ic] = map[kind] || map.expense;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: quiet ? 'var(--text)' : color, whiteSpace: 'nowrap', borderBottom: kind === 'projected' ? '1px dashed var(--proj)' : 'none', paddingBottom: kind === 'projected' ? 1 : 0 }}>
      {arrow && ic && <Icon name={ic} size={size * 0.8} stroke={2.3} />}
      <span className="tnum" style={{ fontFamily: 'var(--font-mono)', fontWeight: weight, fontSize: size, letterSpacing: '-0.02em' }}><span style={{ opacity: 0.85 }}>{sign}</span>{f.body}</span>
    </span>
  );
}

function Gauge({ pct, size = 96, value, sub, color = 'var(--saved)', thickness = 8 }) {
  const r = (size - thickness - 2) / 2, c = 2 * Math.PI * r, off = c * (1 - pct);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={thickness} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="tnum" style={{ fontSize: size * 0.21, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{value}</div>
        {sub && <div style={{ fontSize: 9, color: 'var(--text-3)' }}>{sub}</div>}
      </div>
    </div>
  );
}

function Confidence({ level = 'on', compact = false }) {
  const steps = [['off', 'Off track', 'var(--expense)'], ['at', 'At risk', 'var(--warn)'], ['on', 'On track', 'var(--income)']];
  const active = steps.find((s) => s[0] === level) || steps[2];
  if (compact) { const [, lbl, c] = active; return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: c, whiteSpace: 'nowrap' }}>{level === 'on' ? <Icon name="check" size={13} stroke={2.6} /> : level === 'at' ? <Icon name="alert" size={13} stroke={2.2} /> : <Icon name="down" size={13} stroke={2.4} />}{lbl}</span>; }
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {steps.map(([id, lbl, c]) => { const on = id === level; return <div key={id} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 700, padding: '6px 0', borderRadius: 'var(--radius-data)', whiteSpace: 'nowrap', background: on ? `color-mix(in oklch, ${c} 16%, transparent)` : 'transparent', color: on ? c : 'var(--text-3)', border: on ? `1px solid color-mix(in oklch, ${c} 32%, transparent)` : '1px solid var(--line)' }}>{on ? (id === 'on' ? '✓ ' : '• ') : ''}{lbl}</div>; })}
    </div>
  );
}

function Utilisation({ used, limit }) {
  const pct = Math.min(1, used / limit), c = pct > 0.8 ? 'var(--warn)' : pct > 0.5 ? 'var(--debt)' : 'var(--income)';
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>Utilisation</span><span className="tnum" style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', fontWeight: 700, color: c }}>{Math.round(pct * 100)}%</span></div>
      <div style={{ height: 6, borderRadius: 999, background: 'var(--surface-3)', overflow: 'hidden', position: 'relative' }}><div style={{ width: pct * 100 + '%', height: '100%', borderRadius: 999, background: c }} /><div style={{ position: 'absolute', top: -2, bottom: -2, left: '80%', width: 1.5, background: 'var(--text-3)', opacity: 0.55 }} /></div>
    </div>
  );
}

function Spark({ points, w = 160, h = 40, stroke = 'var(--coral)', fill, sw = 2, projFrom = null, band = null }) {
  const max = Math.max(...points), min = Math.min(...points), rng = max - min || 1;
  const X = (i) => (i / (points.length - 1)) * w, Y = (v) => h - ((v - min) / rng) * (h - 6) - 3;
  const seg = (a, b) => points.slice(a, b).map((p, i) => `${i ? 'L' : 'M'}${X(i + a).toFixed(1)} ${Y(p).toFixed(1)}`).join(' ');
  const pf = projFrom == null ? points.length - 1 : projFrom;
  const solid = seg(0, pf + 1), proj = pf < points.length - 1 ? seg(pf, points.length) : null;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ display: 'block', overflow: 'visible' }}>
      {band && (() => { const up = band.map((b, i) => `${i ? 'L' : 'M'}${X(i)} ${Y(points[i] + b)}`).join(' '); const dn = band.map((b, i) => `L${X(band.length - 1 - i)} ${Y(points[band.length - 1 - i] - band[band.length - 1 - i])}`).join(' '); return <path d={`${up} ${dn} Z`} fill={stroke} opacity="0.12" />; })()}
      {fill && <path d={`${solid} L${X(pf)} ${h} L0 ${h} Z`} fill={fill} />}
      <path d={solid} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      {proj && <path d={proj} stroke={stroke} strokeWidth={sw} strokeDasharray="3 3" opacity="0.75" strokeLinecap="round" />}
    </svg>
  );
}

Object.assign(window, { Icon, fmtm, Money, Gauge, Confidence, Utilisation, Spark });
