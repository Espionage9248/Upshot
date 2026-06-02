/*__IIFE_WRAP__*/;(function(){
// proof/lib/ds-components.jsx — REAL Upshot DS component source, concatenated
// (atoms + foundations + primitives + finance from ds/*, no app shell, no auto-render).
// Shared scope so internal cross-references resolve; exports land on window.


// ##### ds/atoms.jsx #####
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


// ##### ds/foundations.jsx #####
// ds/foundations.jsx — shared layout helpers + Foundations sections.

function DSSection({ id, kicker, title, lead, children }) {
  return (
    <section id={id} style={{ scrollMarginTop: 80, marginBottom: 64 }}>
      <div style={{ marginBottom: 24 }}>
        {kicker && <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--coral-text)', fontWeight: 700, marginBottom: 8 }}>{kicker}</div>}
        <h2 style={{ fontSize: 27, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>{title}</h2>
        {lead && <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--text-2)', margin: '10px 0 0', maxWidth: 720 }}>{lead}</p>}
      </div>
      {children}
    </section>
  );
}

function Panel({ children, style, pad = 22 }) {
  return <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-card)', padding: pad, boxShadow: 'var(--elev-1)', ...style }}>{children}</div>;
}
function Mono({ children }) {
  return <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-2)', background: 'var(--surface-2)', padding: '1px 6px', borderRadius: 5, border: '1px solid var(--line-soft)', whiteSpace: 'nowrap' }}>{children}</code>;
}
function SubHead({ children }) {
  return <div style={{ fontSize: 11, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, marginBottom: 14 }}>{children}</div>;
}

function Ramp() {
  const steps = ['0', '25', '50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
  return (
    <div style={{ display: 'flex', borderRadius: 'var(--radius-data)', overflow: 'hidden', border: '1px solid var(--line)' }}>
      {steps.map((s) => (
        <div key={s} style={{ flex: 1, background: `var(--n-${s})`, height: 64, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 5 }}>
          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: ['0', '25', '50', '100', '200'].includes(s) ? 'var(--n-700)' : 'var(--n-100)' }}>{s}</span>
        </div>
      ))}
    </div>
  );
}

function SemRow({ token, kind, sample, use }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '150px 130px 1fr', alignItems: 'center', gap: 16, padding: '13px 0', borderBottom: '1px solid var(--line-soft)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 18, height: 18, borderRadius: 5, background: `var(--${token})`, flexShrink: 0 }} /><Mono>--{token}</Mono></div>
      <div>{sample}</div>
      <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.4 }}>{use}</div>
    </div>
  );
}

function VizSwatch({ v, label }) {
  return (
    <div style={{ flex: 1, minWidth: 70 }}>
      <div style={{ height: 48, borderRadius: 'var(--radius-data)', background: `var(--viz-${v})`, marginBottom: 7 }} />
      <Mono>--viz-{v}</Mono>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function FoundationColor() {
  return (
    <DSSection id="color" kicker="Foundations" title="Colour" lead="A warm neutral ramp, Up Sunset Orange as the only brand accent, a seven-meaning finance layer, and an ordered data-viz palette. Every value is authored per mode — light is warm paper, dark is warm charcoal — and meets WCAG AA. Toggle the theme to see both.">
      <Panel style={{ marginBottom: 18 }}>
        <SubHead>Neutral ramp · warm (hue ≈ 62)</SubHead>
        <Ramp />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 18 }}>
          {[['--bg', 'app background'], ['--surface', 'cards, sheets'], ['--surface-2', 'insets, headers'], ['--surface-3', 'tracks, wells'], ['--text', 'primary · AA ≥ 13:1'], ['--text-2', 'secondary · AA ≥ 5:1'], ['--text-3', 'tertiary / non-text'], ['--line', 'hairline borders'], ['--line-soft', 'inner dividers']].map(([t, u]) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 20, height: 20, borderRadius: 5, background: `var(${t})`, border: '1px solid var(--line)', flexShrink: 0 }} /><div><Mono>{t}</Mono><div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{u}</div></div></div>
          ))}
        </div>
      </Panel>

      <Panel style={{ marginBottom: 18 }}>
        <SubHead>Brand · Up Sunset Orange anchor</SubHead>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 150px' }}><div style={{ height: 60, borderRadius: 'var(--radius-data)', background: 'var(--coral)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-coral)', fontWeight: 700, fontSize: 13 }}>Aa fill</div><div style={{ marginTop: 7 }}><Mono>--coral #ff705c</Mono></div><div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>CTAs, active nav, brand mark, viz-1</div></div>
          <div style={{ flex: '1 1 150px' }}><div style={{ height: 60, borderRadius: 'var(--radius-data)', background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--coral-text)', fontWeight: 700, fontSize: 13 }}>Aa text</div><div style={{ marginTop: 7 }}><Mono>--coral-text</Mono></div><div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>coral as text — AA per mode</div></div>
          <div style={{ flex: '1 1 150px' }}><div style={{ height: 60, borderRadius: 'var(--radius-data)', background: 'var(--coral-dim)', border: '1px solid color-mix(in oklch, var(--coral) 30%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--coral-text)', fontWeight: 600, fontSize: 12 }}>tint</div><div style={{ marginTop: 7 }}><Mono>--coral-dim</Mono></div><div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>active/selected wash, focus halo</div></div>
          <div style={{ flex: '1 1 150px' }}><div style={{ height: 60, borderRadius: 'var(--radius-data)', background: 'var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a3300', fontWeight: 700, fontSize: 13 }}>Aa</div><div style={{ marginTop: 7 }}><Mono>--yellow</Mono></div><div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>sparingly — celebratory only</div></div>
        </div>
      </Panel>

      <Panel style={{ marginBottom: 18 }}>
        <SubHead>Finance semantics · meaning never by colour alone</SubHead>
        <SemRow token="income" sample={<Money n={2480} kind="income" size={14} arrow />} use="Money in — salary, refunds. Paired with + and ▲." />
        <SemRow token="expense" sample={<Money n={-48.75} kind="expense" size={14} arrow />} use="Money out. Red weight reserved for real spend, not transfers." />
        <SemRow token="transfer" sample={<Money n={-200} kind="transfer" size={14} />} use="Neutral by intent — moving your own money must not read as spend." />
        <SemRow token="saved" sample={<Money n={4500} kind="saved" size={14} arrow />} use="Set aside — savers, emergency fund, funded envelopes." />
        <SemRow token="debt" sample={<Money n={-8240} kind="debt" size={14} arrow />} use="Owed balances and paydown — amber, steady, not alarming." />
        <SemRow token="warn" sample={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--warn)', fontSize: 12.5, fontWeight: 600 }}><Icon name="alert" size={14} /> Due soon</span>} use="Concern — bill due, high utilisation, overspent. Not panic." />
        <SemRow token="proj" sample={<Money n={-142.1} kind="projected" size={14} />} use="Not real yet — dashed + ~ prefix. Always lower-emphasis than actuals." />
      </Panel>
    </DSSection>
  );
}

function FoundationViz() {
  return (
    <DSSection id="dataviz" kicker="Foundations" title="Data-viz palette" lead="An ordered series palette assigned --viz-1 … --viz-7. Hues are spaced for colourblind separability and always carry a label or legend. Past seven series, group the tail as “Other” rather than recycling hues.">
      <Panel>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
          <VizSwatch v={1} label="coral · primary / actual" />
          <VizSwatch v={2} label="teal" />
          <VizSwatch v={3} label="amber" />
          <VizSwatch v={4} label="indigo" />
          <VizSwatch v={5} label="green" />
          <VizSwatch v={6} label="magenta" />
          <VizSwatch v={7} label="sand" />
        </div>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center', borderTop: '1px solid var(--line-soft)', paddingTop: 20 }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 90 }}>
            {[['1', 70], ['2', 52], ['3', 40], ['4', 30], ['5', 22], ['6', 16], ['7', 11]].map(([v, h]) => <div key={v} style={{ width: 30, height: h + 'px', borderRadius: '5px 5px 0 0', background: `var(--viz-${v})` }} />)}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55, maxWidth: 380 }}>
            Usage: assign in order of magnitude or salience. The actual line in a forecast is always <Mono>--viz-1</Mono> (coral); the <Mono>projected</Mono> tail is the same hue, dashed. Category breakdowns read top-down through the ramp.
          </div>
        </div>
      </Panel>
    </DSSection>
  );
}

function FoundationType() {
  const rows = [
    ['Display', 'text-display', '56 / 0.95 · 700', '$46,760', true],
    ['H1', 'text-h1', '38 / 1.05 · 600', 'Two ways the redesign could feel', false],
    ['H2 · screen title', 'text-h2', '27 / 1.1 · 600', 'Net worth', false],
    ['H3', 'text-h3', '21 / 1.2 · 600', 'Emergency-fund readiness', false],
    ['Title · card', 'text-title', '16 / 1.3 · 600', 'Cashflow forecast', false],
    ['Body', 'text-body', '14 / 1.5 · 400–500', 'Groceries are tracking 12% under last month.', false],
    ['Body small', 'text-bodysm', '13 / 1.45 · 400', 'Subscription · next 5 Jun', false],
    ['Label · eyebrow', 'text-label', '11 / 1.2 · 700 · 0.09em caps', 'SAFE TO SPEND', false],
    ['Money · tabular', 'text-money', '15 / 1.2 · 600 · mono', '−$1,914.60', true],
  ];
  return (
    <DSSection id="type" kicker="Foundations" title="Typography" lead="Figtree carries the warm, humanist voice; JetBrains Mono gives money its tabular, unambiguous alignment. Tabular figures are mandatory anywhere numbers stack.">
      <Panel>
        {rows.map(([role, token, spec, sample, mono]) => (
          <div key={token} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 20, alignItems: 'baseline', padding: '16px 0', borderBottom: '1px solid var(--line-soft)' }}>
            <div><div style={{ fontSize: 13, fontWeight: 600 }}>{role}</div><div style={{ marginTop: 4 }}><Mono>{token}</Mono></div><div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 5, fontFamily: 'var(--font-mono)' }}>{spec}</div></div>
            <div className={mono ? 'tnum' : ''} style={{ fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)', fontSize: `var(--${token})`, lineHeight: `var(--${token}--line-height, 1.2)`, fontWeight: role === 'Body' ? 450 : (mono || ['Display', 'H1', 'H2', 'H3', 'Title · card'].includes(role) ? (mono ? 600 : 600) : 400), letterSpacing: role.includes('Label') ? '0.09em' : (['Display', 'H1', 'H2'].includes(role) ? '-0.02em' : '0'), textTransform: role.includes('Label') ? 'uppercase' : 'none', color: 'var(--text)' }}>{sample}</div>
          </div>
        ))}
      </Panel>
    </DSSection>
  );
}

function FoundationScales() {
  const sp = [['1', 4], ['2', 8], ['3', 12], ['4', 16], ['5', 20], ['6', 24], ['8', 32], ['10', 40], ['12', 48], ['16', 64]];
  const rad = [['data', 9, 'rows, chips, inputs'], ['sm', 6, 'small controls'], ['card', 18, 'cards, sheets'], ['pill', 999, 'pills, avatars']];
  return (
    <DSSection id="scales" kicker="Foundations" title="Spacing · radius · elevation · motion" lead="A 4px spacing base, a two-tier radius stance (soft containers, crisp data), an elevation set that works in dark, and one motion language.">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <Panel>
          <SubHead>Spacing · 4px base</SubHead>
          {sp.map(([s, px]) => <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 9 }}><span style={{ width: 28, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>{s}</span><div style={{ height: 12, width: px, background: 'var(--coral)', borderRadius: 3 }} /><span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{px}px</span></div>)}
        </Panel>
        <Panel>
          <SubHead>Radius</SubHead>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {rad.map(([r, px, u]) => <div key={r} style={{ textAlign: 'center' }}><div style={{ width: 72, height: 56, background: 'var(--surface-2)', border: '1.5px solid var(--coral)', borderRadius: px > 100 ? 28 : px, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }} /><div style={{ marginTop: 8 }}><Mono>{r}</Mono></div><div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4, maxWidth: 78 }}>{u}</div></div>)}
          </div>
        </Panel>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <Panel>
          <SubHead>Elevation</SubHead>
          <div style={{ display: 'flex', gap: 16 }}>
            {['1', '2', '3'].map((e) => <div key={e} style={{ flex: 1, height: 76, borderRadius: 'var(--radius-card)', background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: `var(--elev-${e})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>elev-{e}</div>)}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, marginTop: 16, marginBottom: 0 }}>In dark, depth is a <b style={{ color: 'var(--text-2)' }}>lighter surface + a 1px inset top-highlight</b> baked into each elevation — shadow is a faint secondary cue only.</p>
        </Panel>
        <Panel>
          <SubHead>Motion</SubHead>
          {[['--duration-fast', '120ms', 'hovers, toggles, taps'], ['--duration-base', '180ms', 'most transitions, popovers'], ['--duration-slow', '280ms', 'sheets, dialogs, number/chart tweens']].map(([t, v, u]) => <div key={t} style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 9 }}><Mono>{t}</Mono><span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{v}</span><span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{u}</span></div>)}
          <div style={{ borderTop: '1px solid var(--line-soft)', marginTop: 10, paddingTop: 12 }}>
            <div style={{ marginBottom: 6 }}><Mono>--ease-out</Mono> <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>default — enters & moves</span></div>
            <div><Mono>--ease-spring</Mono> <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>toggles, confidence ticks</span></div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, marginTop: 12, marginBottom: 0 }}>All motion collapses to ≤0.01ms under <Mono>prefers-reduced-motion</Mono>.</p>
          </div>
        </Panel>
      </div>
    </DSSection>
  );
}

Object.assign(window, { DSSection, Panel, Mono, SubHead, FoundationColor, FoundationViz, FoundationType, FoundationScales });


// ##### ds/primitives.jsx #####
// ds/primitives.jsx — primitive library, rendered with states + Radix/CVA notes.

function Comp({ title, radix, children, notes, span = 1 }) {
  return (
    <div style={{ gridColumn: `span ${span}`, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-card)', padding: 20, boxShadow: 'var(--elev-1)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
        {radix && <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>{radix}</span>}
      </div>
      {children}
      {notes && <div style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.45, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--line-soft)' }}>{notes}</div>}
    </div>
  );
}
function StateLabel({ children }) { return <div style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, marginBottom: 9, marginTop: 4 }}>{children}</div>; }

function Btn({ variant = 'primary', size = 'md', state, children }) {
  const sz = { sm: ['0 12px', 32, 12.5], md: ['0 16px', 38, 13.5], lg: ['0 20px', 44, 14.5] }[size];
  const base = { display: 'inline-flex', alignItems: 'center', gap: 7, height: sz[1], padding: sz[0], fontSize: sz[2], fontWeight: 600, fontFamily: 'var(--font-sans)', borderRadius: 'var(--radius-data)', border: '1px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all var(--duration-fast) var(--ease-out)' };
  const variants = {
    primary: { background: 'var(--coral)', color: 'var(--on-coral)' },
    secondary: { background: 'var(--surface-2)', color: 'var(--text)', borderColor: 'var(--line)' },
    ghost: { background: 'transparent', color: 'var(--text-2)' },
    danger: { background: 'color-mix(in oklch, var(--expense) 14%, transparent)', color: 'var(--expense)', borderColor: 'color-mix(in oklch, var(--expense) 30%, transparent)' },
  };
  let s = { ...base, ...variants[variant] };
  if (state === 'hover') s.filter = 'brightness(1.08)';
  if (state === 'active') s.transform = 'translateY(1px)';
  if (state === 'focus') { s.outline = '2px solid var(--focus)'; s.outlineOffset = '2px'; }
  if (state === 'disabled') { s.opacity = 0.42; s.cursor = 'not-allowed'; }
  return <button style={s}>{children}</button>;
}

function PrimButtons() {
  return (
    <Comp title="Button" radix="<button> + cva({variant,size})" span={2}
      notes="Variants: primary · secondary · ghost · danger. Sizes: sm 32 / md 38 / lg 44 (≥44 hit-target on touch). States: default · hover (brightness) · active (1px nudge) · focus-visible (coral ring) · disabled (0.42, no pointer). Loading swaps the leading icon for a spinner and disables.">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <StateLabel>Variants · md</StateLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Btn variant="primary"><Icon name="plus" size={15} /> Add</Btn>
            <Btn variant="secondary">Edit</Btn>
            <Btn variant="ghost">Cancel</Btn>
            <Btn variant="danger">Delete</Btn>
          </div>
          <StateLabel>Sizes</StateLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Btn size="sm">Small</Btn><Btn size="md">Medium</Btn><Btn size="lg">Large</Btn>
          </div>
        </div>
        <div>
          <StateLabel>States · primary</StateLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Btn>Default</Btn><Btn state="hover">Hover</Btn><Btn state="active">Active</Btn><Btn state="focus">Focus</Btn><Btn state="disabled">Disabled</Btn>
          </div>
        </div>
      </div>
    </Comp>
  );
}

function Field({ state, value, placeholder, label }) {
  const s = { width: '100%', height: 38, padding: '0 12px', fontSize: 13.5, fontFamily: 'var(--font-sans)', color: value ? 'var(--text)' : 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--radius-data)', outline: 'none' };
  if (state === 'focus') { s.borderColor = 'var(--focus)'; s.boxShadow = '0 0 0 3px color-mix(in oklch, var(--coral) 22%, transparent)'; }
  if (state === 'error') { s.borderColor = 'var(--expense)'; }
  if (state === 'disabled') { s.opacity = 0.5; }
  return (
    <div>
      {label && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>{label}</div>}
      <div style={{ ...s, display: 'flex', alignItems: 'center' }}>{value || placeholder}{state === 'focus' && <span style={{ width: 1.5, height: 16, background: 'var(--coral)', marginLeft: 1 }} />}</div>
      {state === 'error' && <div style={{ fontSize: 11.5, color: 'var(--expense)', marginTop: 5 }}>Enter a valid amount.</div>}
    </div>
  );
}

function PrimInputs() {
  return (
    <Comp title="Input · Select · Textarea" radix="Label + control + cva(state)" notes="States: default · focus (coral ring) · error (expense border + message) · disabled. Selects use Radix Select; the trigger matches input metrics. Money inputs render mono + right-align.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Default" placeholder="Search merchants…" />
        <Field label="Focus" value="Woolworths" state="focus" />
        <Field label="Error" value="—" state="error" />
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Select</div>
          <div style={{ height: 38, padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--radius-data)', fontSize: 13.5 }}>Groceries <Icon name="chevron" size={14} style={{ transform: 'rotate(90deg)', color: 'var(--text-3)' }} /></div>
        </div>
      </div>
    </Comp>
  );
}

function Toggle({ on }) {
  return <div style={{ width: 38, height: 22, borderRadius: 999, background: on ? 'var(--coral)' : 'var(--surface-3)', padding: 2, display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start', transition: 'all var(--duration-fast) var(--ease-out)' }}><div style={{ width: 18, height: 18, borderRadius: 999, background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }} /></div>;
}
function PrimControls() {
  return (
    <Comp title="Switch · Slider · Checkbox" radix="Radix Switch / Slider / Checkbox">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Toggle on /><span style={{ fontSize: 13 }}>On</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Toggle /><span style={{ fontSize: 13, color: 'var(--text-2)' }}>Off</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.45 }}><Toggle on /><span style={{ fontSize: 13 }}>Disabled</span></div>
        </div>
        <div>
          <div style={{ height: 5, borderRadius: 999, background: 'var(--surface-3)', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '62%', background: 'var(--coral)', borderRadius: 999 }} />
            <div style={{ position: 'absolute', left: '62%', top: '50%', transform: 'translate(-50%,-50%)', width: 16, height: 16, borderRadius: 999, background: '#fff', border: '2px solid var(--coral)', boxShadow: 'var(--elev-1)' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>Extra payment · $620/mo</div>
        </div>
        <div style={{ display: 'flex', gap: 18 }}>
          {[['check', true], ['', false]].map(([c, on], i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ width: 18, height: 18, borderRadius: 5, background: on ? 'var(--coral)' : 'transparent', border: on ? 'none' : '1.5px solid var(--line)', color: 'var(--on-coral)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{on && <Icon name="check" size={12} stroke={3} />}</span><span style={{ fontSize: 13 }}>{on ? 'Deductible' : 'Not flagged'}</span></div>)}
        </div>
      </div>
    </Comp>
  );
}

function PrimTabsBadge() {
  return (
    <Comp title="Tabs · Badge · Progress" radix="Radix Tabs · cva(badge)">
      <StateLabel>Tabs</StateLabel>
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line)', marginBottom: 18 }}>
        {['Overview', 'Assets', 'Debts'].map((t, i) => <div key={t} style={{ padding: '8px 14px', fontSize: 13, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? 'var(--text)' : 'var(--text-3)', borderBottom: i === 0 ? '2px solid var(--coral)' : '2px solid transparent', marginBottom: -1 }}>{t}</div>)}
      </div>
      <StateLabel>Badges</StateLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
        {[['Bill', 'var(--text-2)'], ['Saver', 'var(--saved)'], ['Overspent', 'var(--expense)'], ['Manual', 'var(--text-3)'], ['NEW', 'var(--coral-text)']].map(([t, c]) => <span key={t} style={{ fontSize: 11, fontWeight: 700, color: c, padding: '3px 10px', borderRadius: 'var(--radius-data)', background: `color-mix(in oklch, ${c} 13%, transparent)`, border: `1px solid color-mix(in oklch, ${c} 26%, transparent)` }}>{t}</span>)}
      </div>
      <StateLabel>Progress</StateLabel>
      <div style={{ height: 6, borderRadius: 999, background: 'var(--surface-3)', overflow: 'hidden' }}><div style={{ width: '68%', height: '100%', background: 'linear-gradient(90deg, color-mix(in oklch, var(--coral) 80%, #fff), var(--coral))', borderRadius: 999 }} /></div>
    </Comp>
  );
}

function PrimFeedback() {
  return (
    <Comp title="Alert · Skeleton · Empty" radix="Radix-free cards + cva(tone)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 'var(--radius-data)', background: 'color-mix(in oklch, var(--warn) 12%, transparent)', border: '1px solid color-mix(in oklch, var(--warn) 28%, transparent)' }}><span style={{ color: 'var(--warn)' }}><Icon name="alert" size={16} /></span><span style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.4 }}>Origin Energy is due in 3 days — $142.10.</span></div>
        <div>
          <StateLabel>Skeleton (loading)</StateLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['70%', '90%', '50%'].map((w, i) => <div key={i} style={{ height: 12, width: w, borderRadius: 6, background: 'linear-gradient(90deg, var(--surface-2), var(--surface-3), var(--surface-2))', backgroundSize: '200% 100%' }} />)}
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '14px 0', border: '1px dashed var(--line)', borderRadius: 'var(--radius-data)' }}>
          <div style={{ color: 'var(--text-3)', marginBottom: 6, display: 'flex', justifyContent: 'center' }}><Icon name="ledger" size={22} /></div>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 600 }}>No transactions yet</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>They’ll appear here after your next sync.</div>
        </div>
      </div>
    </Comp>
  );
}

function PrimOverlays() {
  return (
    <Comp title="Dialog · Sheet · Popover" radix="Radix Dialog / Popover" span={2}
      notes="Overlays animate with --ease-out: dialog scales 0.96→1 + fade (slow); sheet slides from edge (slow); popover fades + 4px rise (base). Scrim is a low-alpha warm black with a 2px backdrop blur. All trap focus and restore it on close (Radix).">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div>
          <StateLabel>Dialog</StateLabel>
          <div style={{ borderRadius: 'var(--radius-card)', background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: 'var(--elev-3)', padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Delete rule?</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.45, marginBottom: 14 }}>This match rule won’t be applied to future transactions.</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><Btn variant="ghost" size="sm">Cancel</Btn><Btn variant="danger" size="sm">Delete</Btn></div>
          </div>
        </div>
        <div>
          <StateLabel>Sheet (mobile edit)</StateLabel>
          <div style={{ borderRadius: '16px 16px 0 0', background: 'var(--surface)', border: '1px solid var(--line)', borderBottom: 'none', boxShadow: 'var(--elev-3)', padding: 16, height: 132 }}>
            <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--surface-3)', margin: '0 auto 14px' }} />
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Categorise</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{['Groceries', 'Transport', 'Fun'].map((t) => <span key={t} style={{ fontSize: 12, padding: '5px 11px', borderRadius: 999, border: '1px solid var(--line)', color: 'var(--text-2)' }}>{t}</span>)}</div>
          </div>
        </div>
        <div>
          <StateLabel>Popover</StateLabel>
          <div style={{ borderRadius: 'var(--radius-card)', background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: 'var(--elev-pop)', padding: 14, width: 'fit-content' }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, marginBottom: 8 }}>QUICK ACTIONS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{[['flag', 'Flag deductible'], ['swap', 'Mark transfer'], ['repeat', 'Make recurring']].map(([ic, t]) => <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px', borderRadius: 7, fontSize: 12.5, color: 'var(--text-2)' }}><Icon name={ic} size={14} />{t}</div>)}</div>
          </div>
        </div>
      </div>
    </Comp>
  );
}

Object.assign(window, { Comp, StateLabel, Btn, PrimButtons, PrimInputs, PrimControls, PrimTabsBadge, PrimFeedback, PrimOverlays });


// ##### ds/finance.jsx #####
// ds/finance.jsx — finance/domain components rendered with states.

// mini charts local to the DS page
function MiniDonut({ size = 96 }) {
  const segs = [[42, 'var(--viz-1)'], [18, 'var(--viz-2)'], [16, 'var(--viz-4)'], [12, 'var(--viz-3)'], [12, 'var(--viz-5)']];
  const r = (size - 14) / 2, c = 2 * Math.PI * r; let acc = 0;
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>{segs.map(([v, col], i) => { const len = (v / 100) * c; const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={14} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc} />; acc += len; return el; })}</svg>;
}
function MiniHeat() {
  const data = [0, 18, 42, 0, 88, 64, 120, 0, 0, 34, 210, 22, 48, 90, 0, 12, 0, 0, 156, 38, 72, 0, 28, 480, 14, 0, 0, 62, 41, 19, 0, 0, 33, 142, 7];
  const max = Math.max(...data);
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 18px)', gap: 4 }}>{data.map((v, i) => <div key={i} style={{ width: 18, height: 18, borderRadius: 5, background: v === 0 ? 'var(--surface-3)' : `color-mix(in oklch, var(--coral) ${18 + (v / max) * 72}%, var(--surface-2))`, border: v === 0 ? '1px dashed var(--line)' : 'none' }} />)}</div>;
}
function MiniSankey() {
  return (
    <svg width="100%" viewBox="0 0 300 130" style={{ display: 'block' }}>
      <path d="M13 12 C90 12, 90 8, 150 8 L150 70 C90 70, 90 60, 13 60 Z" fill="var(--income)" opacity="0.2" />
      {[[8, 30, 'var(--expense)'], [42, 28, 'var(--expense)'], [74, 22, 'var(--expense)'], [100, 20, 'var(--saved)']].map(([y, h, c], i) => <path key={i} d={`M163 8 C220 8, 220 ${y}, 287 ${y} L287 ${y + h} C220 ${y + h}, 220 ${8 + 90}, 163 70 Z`} fill={c} opacity="0.18" />)}
      <rect x="6" y="12" width="7" height="48" rx="3" fill="var(--income)" />
      <rect x="150" y="8" width="7" height="62" rx="3" fill="var(--coral)" />
      {[[8, 28, 'var(--expense)'], [40, 26, 'var(--expense)'], [70, 20, 'var(--expense)'], [94, 18, 'var(--saved)']].map(([y, h, c], i) => <rect key={i} x="287" y={y} width="7" height={h} rx="3" fill={c} />)}
      <text x="20" y="38" fontSize="9" fill="var(--text-2)" fontFamily="var(--font-mono)">IN</text>
    </svg>
  );
}
function MiniTrend({ w = 280, h = 96 }) {
  const A = [40, 41, 40.5, 42, 43, 44, 44.5, 45.5, 46, 46.7], D = [14, 13.6, 13, 12.2, 11.5, 10.8, 10.1, 9.6, 9.1, 8.24];
  const net = A.map((a, i) => a - D[i]); const X = (i) => (i / (A.length - 1)) * w; const mid = h * 0.6;
  const aY = (v) => mid - (v / 50) * (mid - 8), dY = (v) => mid + (v / 50) * (h - mid - 8);
  const nmax = Math.max(...net), nmin = Math.min(...net), nY = (v) => mid - ((v - nmin) / (nmax - nmin)) * (mid - 10) - 4;
  const pa = (p, f) => p.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${f(v).toFixed(1)}`).join(' ');
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}><line x1="0" x2={w} y1={mid} y2={mid} stroke="var(--line)" /><path d={`${pa(A, aY)} L${w} ${mid} L0 ${mid} Z`} fill="var(--saved)" opacity="0.16" /><path d={pa(A, aY)} fill="none" stroke="var(--saved)" strokeWidth="2" /><path d={pa(D, dY)} fill="none" stroke="var(--debt)" strokeWidth="2" /><path d={pa(net, nY)} fill="none" stroke="var(--coral)" strokeWidth="2.5" /></svg>;
}

function FinMoney() {
  return (
    <Comp title="Money — the atom" radix="<Money n kind size arrow quiet/>" span={2}
      notes="Everything downstream depends on this. Tabular mono, sign always present, colour + icon reinforce meaning (colourblind-safe). quiet renders neutral text for calm glances; projected is dashed + ~. The same atom scales from a ledger cell to the safe-to-spend hero.">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <StateLabel>Seven meanings</StateLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['income', 2480], ['expense', -48.75], ['transfer', -200], ['saved', 4500], ['debt', -8240], ['projected', -142.1]].map(([k, n]) => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{k}</span><Money n={n} kind={k} size={15} arrow={['income', 'expense', 'debt', 'saved'].includes(k)} /></div>)}
          </div>
        </div>
        <div>
          <StateLabel>Hierarchy & quiet mode</StateLabel>
          <div className="tnum" style={{ fontSize: 46, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em', lineHeight: 1 }}>$312<span style={{ fontSize: 24, color: 'var(--text-2)' }}>.40</span></div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', margin: '4px 0 16px' }}>safe-to-spend hero · quiet (neutral)</div>
          <div style={{ display: 'flex', gap: 16 }}><Money n={2480} kind="income" size={20} weight={700} /><Money n={-1914} kind="expense" size={20} weight={700} /></div>
        </div>
      </div>
    </Comp>
  );
}

function FinEnvelopeDebt() {
  return (
    <Comp title="Envelope · Debt · Installment" radix="cva(state: funded|over)">
      <StateLabel>Envelope — funded vs overspent</StateLabel>
      {[['Groceries', 186, 600], ['Fun', -22, 150]].map(([n, b, a]) => { const over = b < 0, pct = Math.max(0, Math.min(1, b / a)); return <div key={n} style={{ marginBottom: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span style={{ fontSize: 13, fontWeight: 500 }}>{n}</span><span className="tnum" style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: over ? 'var(--expense)' : 'var(--text-2)', fontWeight: 600 }}>{over ? '−$' + Math.abs(b) : '$' + b}<span style={{ color: 'var(--text-3)', fontWeight: 400 }}> / {a}</span></span></div><div style={{ height: 5, borderRadius: 999, background: 'var(--surface-3)', overflow: 'hidden' }}><div style={{ width: (over ? 100 : pct * 100) + '%', height: '100%', borderRadius: 999, background: over ? 'var(--expense)' : 'linear-gradient(90deg, color-mix(in oklch,var(--coral) 75%,#fff), var(--coral))' }} /></div></div>; })}
      <StateLabel>Debt paydown + installment</StateLabel>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><span style={{ fontSize: 13, fontWeight: 600 }}>Car loan</span><Money n={-6240} kind="debt" size={13} /></div>
      <div style={{ display: 'flex', height: 6, borderRadius: 999, overflow: 'hidden', background: 'var(--surface-3)', marginBottom: 12 }}><div style={{ width: '64%', background: 'var(--saved)' }} /><div style={{ width: '36%', background: 'var(--debt)' }} /></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><div style={{ display: 'flex', gap: 4 }}>{[1, 1, 1, 0].map((f, i) => <div key={i} style={{ width: 22, height: 6, borderRadius: 999, background: f ? 'var(--coral)' : 'var(--surface-3)' }} />)}</div><span style={{ fontSize: 12, color: 'var(--text-2)' }}>Afterpay · 3 of 4 · next 2 Jun</span></div>
    </Comp>
  );
}

function FinLedger() {
  const rows = [['Woolworths Metro', 'Groceries', 'expense', -23.40, 'var(--expense)'], ['Salary — Atlassian', 'Income', 'income', 2480, 'var(--income)'], ['To Emergency Fund', 'Transfer', 'transfer', -200, 'var(--transfer)']];
  return (
    <Comp title="Ledger row — the workhorse" radix="<LedgerRow/> · responsive" span={2}
      notes="Desktop: merchant · category · type pill · amount · running balance. On phone it collapses to merchant + amount with category as a colour dot; type & balance move to an expand. Selected row gets a coral inset edge; hover lifts the surface.">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <StateLabel>Desktop</StateLabel>
          {rows.map(([n, cat, k, amt, c], i) => <div key={n} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr auto', alignItems: 'center', gap: 10, padding: '10px 10px', borderRadius: 8, background: i === 2 ? 'var(--coral-dim)' : 'transparent', boxShadow: i === 2 ? 'inset 2px 0 0 var(--coral)' : 'none', borderBottom: '1px solid var(--line-soft)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}><span style={{ width: 7, height: 7, borderRadius: 999, background: c, flexShrink: 0 }} /><span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n}</span></div><span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{cat}</span><Money n={amt} kind={k} size={13} /></div>)}
        </div>
        <div>
          <StateLabel>Phone (condensed)</StateLabel>
          <div style={{ maxWidth: 230 }}>
            {rows.map(([n, cat, k, amt, c]) => <div key={n} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--line-soft)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}><span style={{ width: 7, height: 7, borderRadius: 999, background: c, flexShrink: 0 }} /><span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n}</span></div><Money n={amt} kind={k} size={12.5} /></div>)}
          </div>
        </div>
      </div>
    </Comp>
  );
}

function FinSignals() {
  return (
    <Comp title="Confidence · Utilisation · Streak">
      <StateLabel>Goal confidence — never colour-only</StateLabel>
      <Confidence level="on" />
      <div style={{ display: 'flex', gap: 18, margin: '12px 0 18px' }}><Confidence level="at" compact /><Confidence level="off" compact /></div>
      <StateLabel>Card utilisation</StateLabel>
      <div style={{ marginBottom: 18 }}><Utilisation used={1240} limit={2000} /></div>
      <StateLabel>No-spend streak</StateLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}><span style={{ color: 'var(--income)' }}><Icon name="flame" size={24} /></span><div><span className="tnum" style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>6</span><span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 8 }}>no-spend days · best 9</span></div></div>
    </Comp>
  );
}

function FinReadinessSync() {
  const sync = [['Synced · 4m', 'var(--income)', 'healthy'], ['Syncing…', 'var(--text-3)', 'syncing'], ['Sync failed', 'var(--expense)', 'failed'], ['Reconnect bank', 'var(--warn)', 'token']];
  return (
    <Comp title="Readiness gauge · Sync status">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
        <Gauge pct={0.75} value="75%" sub="of goal" color="var(--saved)" size={92} />
        <div><div className="tnum" style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--saved)' }}>$4,500 <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>/ $6,000</span></div><div style={{ fontSize: 11, color: 'var(--text-3)', margin: '3px 0 8px' }}>2.4 mo runway</div><Confidence level="on" compact /></div>
      </div>
      <StateLabel>Sync status — four states</StateLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sync.map(([t, c, id]) => <div key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600, color: c, width: 'fit-content', padding: '5px 11px', borderRadius: 999, background: `color-mix(in oklch, ${c} 12%, transparent)`, border: `1px solid color-mix(in oklch, ${c} 24%, transparent)` }}><span style={{ width: 7, height: 7, borderRadius: 999, background: c }} />{t}</div>)}
      </div>
    </Comp>
  );
}

function FinCharts() {
  return (
    <Comp title="Cashflow · Category · Net worth · Money-flow · Heatmap" radix="SVG · data-viz tokens" span={2}
      notes="Actual is always --viz-1 (coral); the projected tail is the same hue, dashed, with a widening confidence band. Category reads top-down through the ordered palette. Net-worth splits assets (up) and debts (down) from a baseline with the net line in coral.">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 18, alignItems: 'start' }}>
        <div><StateLabel>Cashflow + band</StateLabel><Spark points={[10.4, 9.8, 9.2, 10.1, 9.6, 8.9, 9.4, 10.2, 11.1, 10.6, 11.4, 12.2]} w={150} h={70} stroke="var(--coral)" projFrom={7} band={[0, 0, 0, 0, 0, 0, 0, 0.4, 0.8, 1.1, 1.5, 1.8]} fill="color-mix(in oklch, var(--coral) 9%, transparent)" /></div>
        <div><StateLabel>Category</StateLabel><MiniDonut /></div>
        <div><StateLabel>Net worth</StateLabel><MiniTrend w={150} h={80} /></div>
        <div><StateLabel>Money-flow</StateLabel><MiniSankey /></div>
        <div><StateLabel>Heatmap</StateLabel><MiniHeat /></div>
      </div>
    </Comp>
  );
}

function FinCardsInsight() {
  return (
    <Comp title="Asset card · Insight card · Rule row">
      <StateLabel>Asset</StateLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}><div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}><Icon name="trend" size={18} /></div><div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>Superannuation</div><div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>Manual</div></div><div style={{ textAlign: 'right' }}><div className="tnum" style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>$28,200</div><Money n={640} kind="income" size={10.5} arrow weight={600} /></div></div>
      <StateLabel>Insight</StateLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '11px 13px', background: 'var(--surface-2)', borderRadius: 'var(--radius-data)', border: '1px solid var(--line-soft)', marginBottom: 16 }}><span style={{ color: 'var(--warn)', flexShrink: 0 }}><Icon name="repeat" size={15} /></span><span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>Spotify rose $2 in May — two music subscriptions are active.</span></div>
      <StateLabel>Rule builder row</StateLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', fontSize: 12 }}>
        <span style={{ color: 'var(--text-3)' }}>IF</span>
        <span style={{ padding: '4px 9px', borderRadius: 7, background: 'var(--surface-2)', border: '1px solid var(--line)' }}>merchant</span>
        <span style={{ padding: '4px 9px', borderRadius: 7, background: 'var(--surface-2)', border: '1px solid var(--line)' }}>contains</span>
        <span style={{ padding: '4px 9px', borderRadius: 7, background: 'var(--surface-2)', border: '1px solid var(--line)', fontFamily: 'var(--font-mono)' }}>woolworths</span>
        <span style={{ color: 'var(--text-3)' }}>→</span>
        <span style={{ padding: '4px 9px', borderRadius: 7, background: 'var(--coral-dim)', color: 'var(--coral-text)', fontWeight: 600 }}>Groceries</span>
      </div>
    </Comp>
  );
}

Object.assign(window, { FinMoney, FinEnvelopeDebt, FinLedger, FinSignals, FinReadinessSync, FinCharts, FinCardsInsight });


})();
