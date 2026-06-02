// screens.jsx — combined: shared tokens/icons + Vellum + Beacon + meta cards.
// (concatenated to avoid multi-file babel loader races)


// ============================================================
// screens/shared.jsx
// ============================================================
// shared.jsx — token sets for both directions + line-icon set + small helpers.
// Exports to window: UIcon, fmt, Spark, injects .vellum / .beacon token scopes.

(function injectTokens() {
  if (document.getElementById('upshot-tokens')) return;
  const s = document.createElement('style');
  s.id = 'upshot-tokens';
  s.textContent = `
  /* ============ DIRECTION A — VELLUM (warm, editorial, subtle) ============ */
  .vellum{
    --bg:        oklch(0.171 0.012 58);
    --surface:   oklch(0.214 0.014 58);
    --surface-2: oklch(0.252 0.016 58);
    --line:      oklch(0.34 0.016 58 / 0.7);
    --line-soft: oklch(0.34 0.016 58 / 0.4);
    --text:      oklch(0.935 0.012 75);
    --text-2:    oklch(0.745 0.013 72);
    --text-3:    oklch(0.585 0.012 70);
    --coral:     #ff705c;
    --coral-2:   oklch(0.70 0.17 30);
    --coral-dim: color-mix(in oklch, #ff705c 16%, transparent);
    --pos:       oklch(0.80 0.085 150);   /* income — whispered sage */
    --neg:       oklch(0.86 0.012 72);    /* expense — just text */
    --transfer:  oklch(0.66 0.018 72);    /* neutral */
    --saved:     #ff705c;                  /* saved leans brand-warm */
    --debt:      oklch(0.74 0.10 52);     /* quiet terracotta */
    --warn:      oklch(0.80 0.11 78);     /* amber, calm */
    --proj:      oklch(0.62 0.012 72);    /* faded */
    --font:      'Figtree', system-ui, sans-serif;
    --num:       'Figtree', system-ui, sans-serif;
    --r-card:    18px;
    --r-pill:    999px;
    --r-data:    8px;
  }
  /* ============ DIRECTION B — BEACON (cool, cockpit, loud) ============ */
  .beacon{
    --bg:        oklch(0.178 0.006 264);
    --surface:   oklch(0.221 0.008 264);
    --surface-2: oklch(0.268 0.010 264);
    --line:      oklch(0.36 0.010 264 / 0.8);
    --line-soft: oklch(0.36 0.010 264 / 0.45);
    --text:      oklch(0.945 0.006 264);
    --text-2:    oklch(0.745 0.012 264);
    --text-3:    oklch(0.605 0.014 264);
    --coral:     #ff705c;
    --coral-2:   oklch(0.70 0.17 30);
    --coral-dim: color-mix(in oklch, #ff705c 18%, transparent);
    --pos:       oklch(0.745 0.135 158);  /* income green */
    --neg:       oklch(0.665 0.145 18);   /* expense rose-red */
    --transfer:  oklch(0.70 0.085 250);   /* transfer blue-violet */
    --saved:     oklch(0.80 0.115 195);   /* saved teal */
    --debt:      oklch(0.77 0.135 70);    /* debt amber */
    --warn:      oklch(0.80 0.13 80);     /* warning amber */
    --proj:      oklch(0.62 0.014 264);   /* projected grey */
    --yellow:    #ffee52;
    --font:      'Hanken Grotesk', system-ui, sans-serif;
    --num:       'JetBrains Mono', ui-monospace, monospace;
    --r-card:    14px;
    --r-pill:    8px;
    --r-data:    6px;
  }
  .vellum, .beacon{ box-sizing:border-box; }
  .vellum *, .beacon *{ box-sizing:border-box; }
  .tnum{ font-variant-numeric: tabular-nums; font-feature-settings:'tnum' 1, 'cv01' 1; white-space:nowrap; }
  `;
  document.head.appendChild(s);
})();

// ── line-icon set ── simple geometric strokes, 24×24, currentColor
const ICON_PATHS = {
  today:   'M12 3.6v2M5 7l1.4 1.4M3.6 12h2M19 7l-1.4 1.4M20.4 12h-2M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM7.5 17.5h9',
  money:   'M3.5 7.5h17v10h-17zM3.5 11h17M7 14.5h3',
  plan:    'M5 4.5h14M5 9.5h14M5 14.5h9M5 19.5h6',
  look:    'M5 19V5M5 19h14M9 16v-4M13 16V9M17 16v-7',
  gear:    'M12 9.2a2.8 2.8 0 100 5.6 2.8 2.8 0 000-5.6zM12 3.5l1 2.2 2.4-.5.6 2.4 2.2 1-1 2.2 1.4 2-2 1.4.4 2.4-2.4.6-1 2.2H11l-1-2.2-2.4-.5-.4-2.4-2-1.4 1.4-2-1-2.2 2.2-1 .6-2.4 2.4.5z',
  search:  'M11 4.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM20 20l-4.4-4.4',
  plus:    'M12 5v14M5 12h14',
  up:      'M12 19V5M6 11l6-6 6 6',
  down:    'M12 5v14M6 13l6 6 6-6',
  swap:    'M7 8h12l-3-3M17 16H5l3 3',
  bell:    'M12 4a5 5 0 015 5c0 5 2 6 2 6H5s2-1 2-6a5 5 0 015-5zM10 19a2 2 0 004 0',
  sync:    'M19 8a7 7 0 10.5 6M19 4v4h-4',
  flame:   'M12 3.5c2 3 5 4.5 5 8.5a5 5 0 11-10 0c0-1.6.7-2.6 1.5-3.5.4 1 .9 1.5 1.7 1.8C9.5 8 10 5.5 12 3.5z',
  calendar:'M5 6.5h14v13H5zM5 10h14M9 4v3M15 4v3',
  card:    'M3.5 6.5h17v11h-17zM3.5 10.5h17M7 14.5h4',
  target:  'M12 4.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM12 11.6a.4.4 0 100 .8.4.4 0 000-.8z',
  check:   'M5 12.5l4.5 4.5L19 7',
  dot:     'M12 9a3 3 0 100 6 3 3 0 000-6z',
  arrowR:  'M5 12h13M13 6l6 6-6 6',
  filter:  'M4 6h16M7 12h10M10 18h4',
  wallet:  'M4 7.5h13a2 2 0 012 2V17a2 2 0 01-2 2H5a1.5 1.5 0 01-1.5-1.5V7.5zM4 7.5L15 4v3.5M17 12.5h.01',
  receipt: 'M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3V3.5zM9 8h6M9 11.5h6M9 15h3',
  pie:     'M12 4.5v7.5h7.5A7.5 7.5 0 1012 4.5zM13.5 3.2A7.5 7.5 0 0120.8 10.5h-7.3z',
  layers:  'M12 4l8 4-8 4-8-4 8-4zM4 12l8 4 8-4M4 16l8 4 8-4',
  shield:  'M12 3.5l7 2.5v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z',
  clock:   'M12 4.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM12 8.5V12l2.5 1.5',
  menu:    'M4 7h16M4 12h16M4 17h16',
  grid:    'M4 4.5h6v6H4zM14 4.5h6v6h-6zM4 14.5h6v6H4zM14 14.5h6v6h-6z',
};

function UIcon({ name, size = 18, stroke = 1.6, style, className }) {
  const d = ICON_PATHS[name] || ICON_PATHS.dot;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={style} className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

// format AUD with grouping; returns {sign, body} so callers can style the sign.
function fmt(n, { cents = true } = {}) {
  const neg = n < 0;
  const abs = Math.abs(n);
  const s = abs.toLocaleString('en-AU', {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
  return { sign: neg ? '−' : '+', neg, body: '$' + s };
}

// tiny inline sparkline / area path generator
function Spark({ points, w = 120, h = 34, stroke = 'currentColor', fill, sw = 1.6, projFrom = null, dashed = false }) {
  const max = Math.max(...points), min = Math.min(...points);
  const rng = max - min || 1;
  const X = (i) => (i / (points.length - 1)) * w;
  const Y = (v) => h - ((v - min) / rng) * (h - 4) - 2;
  const dPath = points.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p).toFixed(1)}`).join(' ');
  let solid = dPath, proj = null;
  if (projFrom != null && projFrom < points.length - 1) {
    solid = points.slice(0, projFrom + 1).map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p).toFixed(1)}`).join(' ');
    proj = points.slice(projFrom).map((p, i) => `${i ? 'L' : 'M'}${X(i + projFrom).toFixed(1)} ${Y(p).toFixed(1)}`).join(' ');
  }
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ display: 'block', overflow: 'visible' }}>
      {fill && <path d={`${dPath} L${w} ${h} L0 ${h} Z`} fill={fill} stroke="none" />}
      <path d={solid} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={dashed ? '3 3' : undefined} />
      {proj && <path d={proj} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="3 3" opacity="0.7" />}
    </svg>
  );
}

Object.assign(window, { UIcon, fmt, Spark });


// ============================================================
// screens/vellum.jsx
// ============================================================
// vellum.jsx — DIRECTION A: warm, editorial, subtle money signal, "rooms" IA.
// Exports: VellumCover, VellumDashboard, VellumLedger, VellumPhone

const VEL = {
  ink: 'var(--text)', dim: 'var(--text-2)', faint: 'var(--text-3)',
};

// ── subtle money atom: sign + weight carry meaning; colour only whispers ──
function VMoney({ n, kind = 'expense', size = 15, weight = 500, cents = true }) {
  const f = window.fmt(n, { cents });
  let color = 'var(--text)', sign = f.neg ? '−' : '', pre = null;
  if (kind === 'income') { color = 'var(--pos)'; sign = '+'; }
  else if (kind === 'expense') { color = 'var(--text)'; sign = '−'; }
  else if (kind === 'transfer') { color = 'var(--transfer)'; sign = ''; pre = '⇄ '; }
  else if (kind === 'saved') { color = 'var(--coral)'; sign = '+'; }
  else if (kind === 'debt') { color = 'var(--text)'; sign = '−'; }
  else if (kind === 'projected') { color = 'var(--proj)'; sign = '~'; }
  return (
    <span className="tnum" style={{ color, fontWeight: weight, fontSize: size, fontFamily: 'var(--num)', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
      {pre}<span style={{ opacity: 0.7, marginRight: 1 }}>{sign}</span>{f.body}
    </span>
  );
}

function VRail({ active = 'today' }) {
  const rooms = [
    ['today', 'today', 'Today'], ['money', 'money', 'Money'],
    ['plan', 'layers', 'Plan'], ['look', 'look', 'Look'],
  ];
  return (
    <div style={{ width: 80, flexShrink: 0, background: 'var(--bg)', borderRight: '1px solid var(--line-soft)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '22px 0 18px' }}>
      <div style={{ width: 30, height: 30, borderRadius: 10, background: 'radial-gradient(120% 120% at 30% 20%, #ffb199, var(--coral) 55%, #e8553f)',
        boxShadow: '0 4px 14px rgba(255,112,92,0.34)', marginBottom: 30 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        {rooms.map(([id, ic, label]) => {
          const on = id === active;
          return (
            <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 60 }}>
              <div style={{ width: 46, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: on ? 'var(--coral-dim)' : 'transparent', color: on ? 'var(--coral)' : 'var(--text-3)' }}>
                <window.UIcon name={ic} size={21} stroke={on ? 1.9 : 1.6} />
              </div>
              <span style={{ fontSize: 10.5, color: on ? 'var(--coral)' : 'var(--text-3)', fontWeight: on ? 600 : 500, fontFamily: 'var(--font)' }}>{label}</span>
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ color: 'var(--text-3)', marginBottom: 16 }}><window.UIcon name="gear" size={20} /></div>
      <div style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--surface-2)', border: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', fontWeight: 600, fontSize: 12, fontFamily: 'var(--font)' }}>SM</div>
    </div>
  );
}

function VCard({ children, style, pad = 22 }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-card)',
      padding: pad, boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset, 0 6px 22px rgba(0,0,0,0.22)', ...style }}>
      {children}
    </div>
  );
}

function VLabel({ children, style }) {
  return <div style={{ fontSize: 11.5, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, fontFamily: 'var(--font)', ...style }}>{children}</div>;
}

function VEnvelope({ name, bal, alloc, role }) {
  const pct = Math.max(0, Math.min(1, bal / alloc));
  const over = bal < 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500, fontFamily: 'var(--font)', whiteSpace: 'nowrap' }}>{name}
          {role && <span style={{ fontSize: 10.5, color: 'var(--text-3)', marginLeft: 8, padding: '2px 7px', borderRadius: 999, border: '1px solid var(--line)', fontWeight: 600 }}>{role}</span>}
        </span>
        <span className="tnum" style={{ fontSize: 13, fontFamily: 'var(--num)', color: over ? 'var(--warn)' : 'var(--text-2)', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 12 }}>
          <span style={{ color: over ? 'var(--warn)' : 'var(--text)', fontWeight: 600 }}>{over ? '−$' + Math.abs(bal).toFixed(0) : '$' + bal.toFixed(0)}</span>
          <span style={{ color: 'var(--text-3)' }}> / {alloc.toFixed(0)}</span>
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}>
        <div style={{ width: (over ? 1 : pct) * 100 + '%', height: '100%', borderRadius: 999,
          background: over ? 'var(--warn)' : 'linear-gradient(90deg, var(--coral-2), var(--coral))' }} />
      </div>
    </div>
  );
}

function VellumDashboard() {
  const spark = [22, 19, 24, 18, 23, 17, 21, 16, 20, 15, 18, 14];
  const bills = [
    ['calendar', 'Origin Energy', 'Electricity · in 3 days', -142.10, 'projected'],
    ['card', 'Afterpay · Cotton On', '3 of 4 · in 2 days', -48.75, 'projected'],
    ['receipt', 'Spotify', 'Subscription · in 5 days', -13.99, 'projected'],
  ];
  return (
    <div className="vellum" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)', fontFamily: 'var(--font)', color: 'var(--text)' }}>
      <VRail active="today" />
      <div style={{ flex: 1, padding: '34px 40px', display: 'flex', flexDirection: 'column', gap: 24, overflow: 'hidden' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 4 }}>SATURDAY, 2 JUNE</div>
            <div style={{ fontSize: 27, fontWeight: 600, letterSpacing: '-0.02em' }}>Evening, Sam.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 14px', borderRadius: 999, border: '1px solid var(--line)', color: 'var(--text-3)', fontSize: 13 }}>
              <window.UIcon name="search" size={15} /> Search
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 13px', borderRadius: 999, border: '1px solid var(--line)', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap' }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--pos)', boxShadow: '0 0 0 3px color-mix(in oklch, var(--pos) 22%, transparent)' }} /> Synced · 4m
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 999, border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}><window.UIcon name="bell" size={17} /></div>
          </div>
        </div>

        {/* hero */}
        <VCard pad={26} style={{ display: 'flex', alignItems: 'stretch', gap: 30 }}>
          <div style={{ flex: '1 1 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <VLabel>Safe to spend · through Sunday</VLabel>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--pos)', whiteSpace: 'nowrap' }}><span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--pos)' }} /> Steady</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: 10 }}>
              <span className="tnum" style={{ fontSize: 56, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 0.95, fontFamily: 'var(--num)' }}>$312<span style={{ fontSize: 30, color: 'var(--text-2)' }}>.40</span></span>
              <span style={{ marginBottom: 7, fontSize: 13.5, color: 'var(--text-2)' }}>after bills &amp; envelopes</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 16, color: 'var(--pos)' }}>
              <window.Spark points={spark} w={150} h={30} stroke="var(--pos)" sw={1.8} />
              <span style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 500 }}>Overdraft risk low · steady to payday</span>
            </div>
          </div>
          <div style={{ width: 1, background: 'var(--line-soft)' }} />
          <div style={{ flex: '0 0 214px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, whiteSpace: 'nowrap' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>In this week</span><VMoney n={2480} kind="income" size={15} weight={600} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Out this week</span><VMoney n={-1914.6} kind="expense" size={15} weight={600} />
            </div>
            <div style={{ height: 1, background: 'var(--line-soft)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Net</span><VMoney n={565.4} kind="income" size={16} weight={700} />
            </div>
          </div>
        </VCard>

        {/* card grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 20, flex: 1, minHeight: 0 }}>
          <VCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <VLabel>Envelopes</VLabel>
              <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>$4,500 set aside · <span style={{ color: 'var(--coral)', fontWeight: 600 }}>1 overspent</span></span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <VEnvelope name="Rent" bal={2100} alloc={2100} role="Bill" />
              <VEnvelope name="Groceries" bal={186} alloc={600} />
              <VEnvelope name="Transport" bal={92} alloc={180} />
              <VEnvelope name="Subscriptions" bal={31} alloc={64} />
              <VEnvelope name="Fun" bal={-22} alloc={150} />
              <VEnvelope name="Emergency" bal={4500} alloc={6000} role="Saver" />
            </div>
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--line-soft)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ color: 'var(--coral)', marginTop: 1, flexShrink: 0 }}><window.UIcon name="dot" size={15} stroke={2.4} /></span>
              <span style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45 }}>Groceries are tracking 12% under last month — you could move <span style={{ color: 'var(--text)', fontWeight: 600 }}>$40</span> to Emergency Fund and still stay safe.</span>
            </div>
          </VCard>

          <div style={{ display: 'grid', gridTemplateRows: '1fr auto', gap: 20, minHeight: 0 }}>
            <VCard>
              <VLabel style={{ marginBottom: 14 }}>Coming up</VLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {bills.map(([ic, name, sub, amt, kind]) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', flexShrink: 0 }}><window.UIcon name={ic} size={17} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{sub}</div>
                    </div>
                    <VMoney n={amt} kind={kind} size={13.5} />
                  </div>
                ))}
              </div>
            </VCard>
            <VCard pad={18} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <VLabel style={{ marginBottom: 7 }}>Debt remaining</VLabel>
                <span className="tnum" style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--num)', letterSpacing: '-0.02em' }}>$8,240</span>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>Snowball · clear by Mar ’27</div>
              </div>
              <window.Spark points={[40, 38, 35, 33, 30, 27, 25, 22, 18, 15, 12, 8]} w={92} h={42} stroke="var(--debt)" sw={1.8} fill="color-mix(in oklch, var(--debt) 12%, transparent)" />
            </VCard>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Ledger ──
function VLedgerRow({ icon, name, cat, sub, amt, kind, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 8px', borderBottom: last ? 'none' : '1px solid var(--line-soft)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', flexShrink: 0 }}>
        <window.UIcon name={icon} size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{sub}</div>
      </div>
      {cat && <span style={{ fontSize: 12, color: 'var(--text-2)', padding: '4px 11px', borderRadius: 999, border: '1px solid var(--line)', flexShrink: 0 }}>{cat}</span>}
      <div style={{ width: 116, textAlign: 'right', flexShrink: 0 }}><VMoney n={amt} kind={kind} size={15} weight={kind === 'income' ? 600 : 500} /></div>
    </div>
  );
}

function VellumLedger() {
  return (
    <div className="vellum" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)', fontFamily: 'var(--font)', color: 'var(--text)' }}>
      <VRail active="money" />
      <div style={{ flex: 1, padding: '34px 40px', display: 'flex', flexDirection: 'column', gap: 20, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 27, fontWeight: 600, letterSpacing: '-0.02em' }}>Money</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-3)', marginTop: 3 }}>Spending account · <span className="tnum">$1,043.18</span> available</div>
          </div>
          <div style={{ display: 'flex', gap: 9 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 14px', borderRadius: 999, border: '1px solid var(--line)', color: 'var(--text-3)', fontSize: 13 }}><window.UIcon name="search" size={15} /> Search</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 999, border: '1px solid var(--line)', color: 'var(--text-2)', fontSize: 13, whiteSpace: 'nowrap' }}><window.UIcon name="filter" size={15} /> All categories</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 16px', borderRadius: 999, background: 'var(--coral)', color: '#2a1410', fontSize: 13, fontWeight: 600 }}><window.UIcon name="plus" size={15} /> Add</div>
          </div>
        </div>

        <VCard pad={10} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0 }}>
            <span style={{ fontSize: 11.5, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, whiteSpace: 'nowrap' }}>Today · Saturday</span>
            <span className="tnum" style={{ fontSize: 12.5, color: 'var(--text-3)' }}>−$94.80</span>
          </div>
          <VLedgerRow icon="receipt" name="Woolworths Metro" sub="2:14 pm" cat="Groceries" amt={-23.40} kind="expense" />
          <VLedgerRow icon="card" name="Industry Beans" sub="8:52 am · linked to wishlist" cat="Fun" amt={-4.80} kind="expense" />
          <VLedgerRow icon="swap" name="To Emergency Fund" sub="Auto-transfer · own account" amt={-200} kind="transfer" last />

          <div style={{ padding: '14px 8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line-soft)', marginTop: 4 }}>
            <span style={{ fontSize: 11.5, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, whiteSpace: 'nowrap' }}>Yesterday · Friday</span>
            <span className="tnum" style={{ fontSize: 12.5, color: 'var(--pos)' }}>+$2,431.45</span>
          </div>
          <VLedgerRow icon="up" name="Salary — Atlassian" sub="Marked as income" amt={2480} kind="income" />
          <VLedgerRow icon="receipt" name="Afterpay · Cotton On" sub="Instalment 3 of 4" cat="Shopping" amt={-48.75} kind="expense" />
          <VLedgerRow icon="down" name="Refund — Uber" sub="Trip adjustment" amt={14.20} kind="income" last />

          <div style={{ marginTop: 'auto', padding: '12px 8px 4px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-3)', fontSize: 12.5 }}>
            <span style={{ display: 'inline-flex', width: 22, height: 22, borderRadius: 7, border: '1px dashed var(--proj)', alignItems: 'center', justifyContent: 'center' }}><window.UIcon name="clock" size={13} /></span>
            Upcoming · <span style={{ color: 'var(--proj)' }}>Origin Energy</span> <VMoney n={-142.10} kind="projected" size={12.5} /> <span style={{ color: 'var(--text-3)' }}>· not posted yet</span>
          </div>
        </VCard>
      </div>
    </div>
  );
}

// ── Phone (rooms IA → bottom bar) ──
function VellumPhone() {
  const tabs = [['today', 'Today', true], ['money', 'Money', false], ['layers', 'Plan', false], ['look', 'Look', false]];
  return (
    <div className="vellum" style={{ width: '100%', height: '100%', background: 'var(--bg)', fontFamily: 'var(--font)', color: 'var(--text)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ height: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>
        <span>9:41</span><span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><window.UIcon name="sync" size={13} /></span>
      </div>
      <div style={{ flex: 1, padding: '8px 18px 0', overflow: 'hidden' }}>
        <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.04em' }}>SATURDAY EVENING</div>
        <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 2, marginBottom: 16 }}>You're okay this week.</div>
        <VCard pad={18}>
          <VLabel>Safe to spend</VLabel>
          <div className="tnum" style={{ fontSize: 40, fontWeight: 600, letterSpacing: '-0.03em', marginTop: 6, fontFamily: 'var(--num)' }}>$312<span style={{ fontSize: 22, color: 'var(--text-2)' }}>.40</span></div>
          <div style={{ marginTop: 8 }}><window.Spark points={[22, 19, 24, 18, 23, 17, 21, 16, 20, 15, 18, 14]} w={280} h={26} stroke="var(--pos)" sw={1.8} /></div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 8 }}>Overdraft risk low · steady to payday</div>
        </VCard>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <VCard pad={15} style={{ flex: 1 }}>
            <VLabel style={{ fontSize: 10.5 }}>Envelopes</VLabel>
            <div className="tnum" style={{ fontSize: 19, fontWeight: 600, marginTop: 5, fontFamily: 'var(--num)' }}>$4,500</div>
            <div style={{ fontSize: 11, color: 'var(--coral)', marginTop: 2, fontWeight: 600 }}>1 overspent</div>
          </VCard>
          <VCard pad={15} style={{ flex: 1 }}>
            <VLabel style={{ fontSize: 10.5 }}>Debt left</VLabel>
            <div className="tnum" style={{ fontSize: 19, fontWeight: 600, marginTop: 5, fontFamily: 'var(--num)' }}>$8,240</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Clear Mar ’27</div>
          </VCard>
        </div>
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>Next bill · Origin Energy</span>
          <VMoney n={-142.10} kind="projected" size={13.5} />
        </div>
        <div style={{ marginTop: 18 }}>
          <VLabel style={{ marginBottom: 10 }}>Recent</VLabel>
          {[['receipt', 'Woolworths Metro', 'Groceries', -23.40, 'expense'], ['up', 'Salary — Atlassian', 'Income', 2480, 'income'], ['swap', 'To Emergency Fund', 'Transfer', -200, 'transfer']].map(([ic, name, sub, amt, kind]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', borderBottom: '1px solid var(--line-soft)' }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', flexShrink: 0 }}><window.UIcon name={ic} size={15} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{sub}</div>
              </div>
              <VMoney n={amt} kind={kind} size={13} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 72, borderTop: '1px solid var(--line-soft)', background: 'var(--bg)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around', padding: '10px 8px 0' }}>
        {tabs.map(([ic, label, on]) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: on ? 'var(--coral)' : 'var(--text-3)' }}>
            <window.UIcon name={ic} size={22} stroke={on ? 1.9 : 1.6} />
            <span style={{ fontSize: 10.5, fontWeight: on ? 600 : 500 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Cover ──
function VellumCover() {
  const swatch = (c, label) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: c, border: '1px solid var(--line)' }} />
      <span style={{ fontSize: 9.5, color: 'var(--text-3)' }}>{label}</span>
    </div>
  );
  return (
    <div className="vellum" style={{ width: '100%', height: '100%', background: 'var(--bg)', fontFamily: 'var(--font)', color: 'var(--text)', padding: 34, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 11, background: 'radial-gradient(120% 120% at 30% 20%, #ffb199, var(--coral) 55%, #e8553f)', boxShadow: '0 4px 14px rgba(255,112,92,0.34)' }} />
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em' }}>DIRECTION A</div>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>Vellum</div>
        </div>
      </div>
      <p style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--text-2)', marginTop: 22, marginBottom: 0 }}>
        Warm paper in the dark. A calm, editorial ledger that reads like a thoughtful private journal — quiet by default, the coral reserved for what matters.
      </p>
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <VLabel style={{ marginBottom: 9 }}>Money signal · subtle</VLabel>
          <div style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.45 }}>Sign &amp; weight carry meaning first; colour only whispers. Calm to read for the daily glance.</div>
          <div style={{ display: 'flex', gap: 18, marginTop: 12 }}>
            <VMoney n={2480} kind="income" size={16} weight={600} />
            <VMoney n={-48.75} kind="expense" size={16} />
            <VMoney n={-200} kind="transfer" size={16} />
            <VMoney n={-142.1} kind="projected" size={16} />
          </div>
        </div>
        <div style={{ height: 1, background: 'var(--line-soft)' }} />
        <div>
          <VLabel style={{ marginBottom: 9 }}>IA · four rooms + command-K</VLabel>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {['Today', 'Money', 'Plan', 'Look'].map((r, i) => (
              <span key={r} style={{ fontSize: 12.5, padding: '6px 13px', borderRadius: 999, fontWeight: 600,
                background: i === 0 ? 'var(--coral-dim)' : 'var(--surface)', color: i === 0 ? 'var(--coral)' : 'var(--text-2)', border: '1px solid var(--line)' }}>{r}</span>
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 10, lineHeight: 1.45 }}>14 V1 routes consolidated into 4 calm rooms; everything else lives one layer in, reached by ⌘K.</div>
        </div>
        <div style={{ height: 1, background: 'var(--line-soft)' }} />
        <div>
          <VLabel style={{ marginBottom: 11 }}>Palette &amp; type</VLabel>
          <div style={{ display: 'flex', gap: 14 }}>
            {swatch('var(--coral)', 'coral')}
            {swatch('var(--bg)', 'bg')}
            {swatch('var(--surface)', 'surface')}
            {swatch('var(--pos)', 'income')}
            {swatch('var(--warn)', 'warn')}
            {swatch('var(--debt)', 'debt')}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 14 }}>Figtree · warm humanist · <span className="tnum" style={{ fontFamily: 'var(--num)' }}>tabular 0123456789</span></div>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 11.5, color: 'var(--text-3)', borderTop: '1px solid var(--line-soft)', paddingTop: 14 }}>Best when the daily feeling should be “calm &amp; in control.” Soft containers, crisp tables, signature coral.</div>
    </div>
  );
}

Object.assign(window, { VellumCover, VellumDashboard, VellumLedger, VellumPhone });


// ============================================================
// screens/beacon.jsx
// ============================================================
// beacon.jsx — DIRECTION B: cool cockpit, loud colour-coded money, "hub + spaces" IA.
// Exports: BeaconCover, BeaconDashboard, BeaconLedger, BeaconPhone

// ── loud money atom: colour + sign + direction-arrow + (optional) pill ──
function BMoney({ n, kind = 'expense', size = 14, weight = 600, cents = true, arrow = true }) {
  const f = window.fmt(n, { cents });
  const map = {
    income:    ['var(--pos)', '+', 'up'],
    expense:   ['var(--neg)', '−', 'down'],
    transfer:  ['var(--transfer)', '', 'swap'],
    saved:     ['var(--saved)', '+', 'up'],
    debt:      ['var(--debt)', '−', 'down'],
    projected: ['var(--proj)', '~', null],
  };
  const [color, sign, ic] = map[kind] || map.expense;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color, whiteSpace: 'nowrap',
      borderBottom: kind === 'projected' ? '1px dashed var(--proj)' : 'none', paddingBottom: kind === 'projected' ? 1 : 0 }}>
      {arrow && ic && <window.UIcon name={ic} size={size * 0.82} stroke={2.2} />}
      <span className="tnum" style={{ fontFamily: 'var(--num)', fontWeight: weight, fontSize: size, letterSpacing: '-0.02em' }}>
        <span style={{ opacity: 0.85 }}>{sign}</span>{f.body}
      </span>
    </span>
  );
}

function BPill({ kind }) {
  const map = {
    income: ['Income', 'var(--pos)'], expense: ['Expense', 'var(--neg)'],
    transfer: ['Transfer', 'var(--transfer)'], saved: ['Saved', 'var(--saved)'],
    debt: ['Debt', 'var(--debt)'],
  };
  const [label, c] = map[kind] || map.expense;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font)',
      color: c, padding: '3px 9px 3px 7px', borderRadius: 'var(--r-pill)', background: `color-mix(in oklch, ${c} 15%, transparent)`,
      border: `1px solid color-mix(in oklch, ${c} 30%, transparent)` }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: c }} />{label}
    </span>
  );
}

function BRail({ active = 'overview' }) {
  const items = [
    ['overview', 'grid'], ['spend', 'money'], ['save', 'wallet'],
    ['owe', 'flame'], ['bills', 'calendar'], ['reports', 'look'],
  ];
  return (
    <div style={{ width: 60, flexShrink: 0, background: 'var(--bg)', borderRight: '1px solid var(--line-soft)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 0 16px', gap: 4 }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: 'radial-gradient(120% 120% at 30% 20%, #ffb199, var(--coral) 55%, #e8553f)',
        boxShadow: '0 0 0 1px rgba(255,112,92,0.3), 0 4px 12px rgba(255,112,92,0.3)', marginBottom: 14 }} />
      {items.map(([id, ic]) => {
        const on = id === active;
        return (
          <div key={id} title={id} style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: on ? 'var(--coral-dim)' : 'transparent', color: on ? 'var(--coral)' : 'var(--text-3)',
            boxShadow: on ? 'inset 2px 0 0 var(--coral)' : 'none', position: 'relative' }}>
            <window.UIcon name={ic} size={20} stroke={on ? 2 : 1.7} />
          </div>
        );
      })}
      <div style={{ flex: 1 }} />
      <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}><window.UIcon name="gear" size={20} /></div>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font)' }}>SM</div>
    </div>
  );
}

function BCard({ children, style, pad = 18 }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-card)', padding: pad,
      boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 16px rgba(0,0,0,0.25)', ...style }}>{children}</div>
  );
}

function BLabel({ children, style }) {
  return <div style={{ fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, fontFamily: 'var(--font)', ...style }}>{children}</div>;
}

function BTile({ label, value, kind, trend, icon }) {
  const cmap = { income: 'var(--pos)', expense: 'var(--neg)', saved: 'var(--saved)', debt: 'var(--debt)' };
  const c = cmap[kind];
  return (
    <BCard pad={16} style={{ display: 'flex', flexDirection: 'column', gap: 9, borderTop: `2px solid ${c}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BLabel>{label}</BLabel>
        <span style={{ color: c }}><window.UIcon name={icon} size={16} /></span>
      </div>
      <BMoney n={value} kind={kind} size={22} weight={700} arrow={false} />
      <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font)' }}>{trend}</div>
    </BCard>
  );
}

function BGauge({ pct, size = 116, label, value, sub, color = 'var(--saved)' }) {
  const r = (size - 14) / 2, c = 2 * Math.PI * r, off = c * (1 - pct);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={9} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="tnum" style={{ fontSize: size * 0.2, fontWeight: 700, fontFamily: 'var(--num)', color: 'var(--text)' }}>{value}</div>
        {sub && <div style={{ fontSize: 9.5, color: 'var(--text-3)', fontFamily: 'var(--font)' }}>{sub}</div>}
      </div>
    </div>
  );
}

function BeaconDashboard() {
  const flow = [12, 14, 13, 16, 15, 18, 17, 20, 19, 22, 21, 24];
  const bills = [
    ['Origin Energy', 'Electricity', 3, -142.10],
    ['Cotton On', 'Afterpay 3/4', 2, -48.75],
    ['Spotify', 'Subscription', 5, -13.99],
  ];
  const envs = [['Groceries', 186, 600, 'var(--neg)'], ['Transport', 92, 180, 'var(--debt)'], ['Fun', -22, 150, 'var(--neg)'], ['Savers', 4500, 6000, 'var(--saved)']];
  return (
    <div className="beacon" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)', fontFamily: 'var(--font)', color: 'var(--text)' }}>
      <BRail active="overview" />
      <div style={{ flex: 1, padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em' }}>Overview</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-2)', padding: '5px 11px', borderRadius: 8, border: '1px solid var(--line)', whiteSpace: 'nowrap' }}>Up · Spending <window.UIcon name="down" size={13} /></span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--saved)', padding: '5px 11px', borderRadius: 8, background: 'color-mix(in oklch, var(--saved) 13%, transparent)', border: '1px solid color-mix(in oklch, var(--saved) 26%, transparent)', whiteSpace: 'nowrap' }}><window.UIcon name="shield" size={13} /> Healthy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: 'var(--pos)', padding: '6px 12px', borderRadius: 8, background: 'color-mix(in oklch, var(--pos) 14%, transparent)', border: '1px solid color-mix(in oklch, var(--pos) 28%, transparent)', whiteSpace: 'nowrap' }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--pos)' }} /> Synced 4m ago</span>
            <span style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}><window.UIcon name="bell" size={16} /></span>
          </div>
        </div>

        {/* stat tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          <BTile label="Income" value={4960} kind="income" icon="up" trend="+6.4% vs May" />
          <BTile label="Spending" value={-3829} kind="expense" icon="down" trend="68% of budget used" />
          <BTile label="Saved" value={4500} kind="saved" icon="wallet" trend="75% to emergency goal" />
          <BTile label="Debt" value={-8240} kind="debt" icon="flame" trend="−$612 this month" />
        </div>

        {/* chart + gauge */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 12, flex: 1, minHeight: 0 }}>
          <BCard style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <BLabel>Cashflow · 30 / 60 / 90 day forecast</BLabel>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginTop: 7 }}>
                  <BMoney n={1043} kind="income" size={22} weight={700} arrow={false} />
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>projected balance · 30 days</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 14, height: 2, background: 'var(--coral)' }} /> Actual</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 14, height: 0, borderTop: '2px dashed var(--proj)' }} /> Projected</span>
              </div>
            </div>
            <div style={{ flex: 1, marginTop: 14, position: 'relative', minHeight: 0 }}>
              <div style={{ position: 'absolute', inset: 0 }}>
                <BFlowChart points={flow} projFrom={7} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--num)', marginTop: 6 }}>
              <span>Jun 2</span><span>Jun 16</span><span style={{ color: 'var(--coral)' }}>Today</span><span>Jul 14</span><span>Aug 30</span>
            </div>
          </BCard>

          <BCard style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <BLabel style={{ alignSelf: 'flex-start' }}>Emergency-fund readiness</BLabel>
            <BGauge pct={0.75} value="75%" sub="of goal" color="var(--saved)" size={130} />
            <div style={{ textAlign: 'center' }}>
              <span className="tnum" style={{ fontFamily: 'var(--num)', fontSize: 15, fontWeight: 700, color: 'var(--saved)' }}>$4,500</span>
              <span style={{ fontSize: 13, color: 'var(--text-3)' }}> / $6,000 · 2.4 mo runway</span>
            </div>
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[['Off track', false], ['At risk', false], ['On track', true]].map(([s, on]) => (
                  <div key={s} style={{ flex: 1, textAlign: 'center', fontSize: 10.5, fontWeight: 700, padding: '7px 0', borderRadius: 8, whiteSpace: 'nowrap',
                    background: on ? 'color-mix(in oklch, var(--saved) 16%, transparent)' : 'transparent',
                    color: on ? 'var(--saved)' : 'var(--text-3)',
                    border: on ? '1px solid color-mix(in oklch, var(--saved) 32%, transparent)' : '1px solid var(--line)' }}>{on ? '✓ ' : ''}{s}</div>
                ))}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 10, textAlign: 'center' }}>Saving <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>$250/mo</span> — fully funded by October.</div>
            </div>
          </BCard>
        </div>

        {/* envelopes + bills */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 12 }}>
          <BCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <BLabel>Envelopes</BLabel><span style={{ fontSize: 11.5, color: 'var(--neg)', fontWeight: 600 }}>Fun overspent −$22</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
              {envs.map(([n, b, a, c]) => {
                const over = b < 0; const pct = Math.max(0, Math.min(1, b / a));
                return (
                  <div key={n}>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, marginBottom: 6 }}>{n}</div>
                    <div className="tnum" style={{ fontSize: 14, fontFamily: 'var(--num)', fontWeight: 700, color: over ? 'var(--neg)' : 'var(--text)' }}>{over ? '−$' + Math.abs(b) : '$' + b.toLocaleString()}</div>
                    <div style={{ height: 5, borderRadius: 999, background: 'var(--surface-2)', marginTop: 7, overflow: 'hidden' }}>
                      <div style={{ width: (over ? 100 : pct * 100) + '%', height: '100%', background: c, borderRadius: 999 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </BCard>
          <BCard>
            <BLabel style={{ marginBottom: 10 }}>Upcoming bills</BLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {bills.map(([n, s, days, amt]) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="tnum" style={{ width: 34, height: 26, borderRadius: 7, background: days <= 2 ? 'color-mix(in oklch, var(--warn) 16%, transparent)' : 'var(--surface-2)', color: days <= 2 ? 'var(--warn)' : 'var(--text-2)', fontFamily: 'var(--num)', fontSize: 11, fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{days}d</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{s}</div>
                  </div>
                  <BMoney n={amt} kind="projected" size={12.5} arrow={false} />
                </div>
              ))}
            </div>
          </BCard>
        </div>
      </div>
    </div>
  );
}

function BFlowChart({ points, projFrom }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 320 130" preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="bflow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--coral)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--coral)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => <line key={g} x1="0" x2="320" y1={130 * g} y2={130 * g} stroke="var(--line-soft)" strokeWidth="1" />)}
      <FlowPaths points={points} projFrom={projFrom} />
    </svg>
  );
}
function FlowPaths({ points, projFrom }) {
  const w = 320, h = 130, max = Math.max(...points), min = Math.min(...points), rng = max - min || 1;
  const X = (i) => (i / (points.length - 1)) * w, Y = (v) => h - ((v - min) / rng) * (h - 18) - 10;
  const seg = (a, b) => points.slice(a, b).map((p, i) => `${i ? 'L' : 'M'}${X(i + a).toFixed(1)} ${Y(p).toFixed(1)}`).join(' ');
  const solid = seg(0, projFrom + 1), proj = seg(projFrom, points.length);
  const area = `${seg(0, projFrom + 1)} L${X(projFrom).toFixed(1)} ${h} L0 ${h} Z`;
  return (
    <>
      <path d={area} fill="url(#bflow)" />
      <path d={solid} fill="none" stroke="var(--coral)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d={proj} fill="none" stroke="var(--proj)" strokeWidth="2.4" strokeDasharray="4 4" strokeLinecap="round" />
      <line x1={X(projFrom)} y1="6" x2={X(projFrom)} y2={h} stroke="var(--coral)" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
      <circle cx={X(projFrom)} cy={Y(points[projFrom])} r="3.5" fill="var(--coral)" stroke="var(--bg)" strokeWidth="2" />
    </>
  );
}

// ── Ledger ──
function BLedgerRow({ name, sub, cat, catColor, kind, amt, bal, selected }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2.1fr 0.85fr 0.9fr 1fr 0.95fr', alignItems: 'center', gap: 12,
      padding: '11px 14px', borderBottom: '1px solid var(--line-soft)', background: selected ? 'var(--coral-dim)' : 'transparent',
      boxShadow: selected ? 'inset 2px 0 0 var(--coral)' : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: catColor, flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</div>
        </div>
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{cat}</span>
      <span><BPill kind={kind} /></span>
      <div style={{ textAlign: 'right' }}><BMoney n={amt} kind={kind} size={14} /></div>
      <div className="tnum" style={{ textAlign: 'right', fontFamily: 'var(--num)', fontSize: 12.5, color: 'var(--text-3)' }}>${bal.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</div>
    </div>
  );
}

function BeaconLedger() {
  const chips = ['All', 'Income', 'Expenses', 'Transfers', 'Uncategorised'];
  return (
    <div className="beacon" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)', fontFamily: 'var(--font)', color: 'var(--text)' }}>
      <BRail active="spend" />
      <div style={{ flex: 1, padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em' }}>Transactions</span>
            <span style={{ fontSize: 13, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>342 this period</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line)', color: 'var(--text-3)', fontSize: 12.5 }}><window.UIcon name="search" size={14} /> Search</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 34, padding: '0 14px', borderRadius: 8, background: 'var(--coral)', color: '#2a1410', fontSize: 12.5, fontWeight: 700 }}><window.UIcon name="plus" size={14} /> Rule</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 7 }}>
          {chips.map((c, i) => (
            <span key={c} style={{ fontSize: 12.5, fontWeight: 600, padding: '6px 13px', borderRadius: 8,
              background: i === 0 ? 'var(--surface-2)' : 'transparent', color: i === 0 ? 'var(--text)' : 'var(--text-3)',
              border: i === 0 ? '1px solid var(--line)' : '1px solid transparent' }}>{c}</span>
          ))}
        </div>

        <BCard pad={0} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2.1fr 0.85fr 0.9fr 1fr 0.95fr', gap: 12, padding: '11px 14px', borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}>
            {['Merchant', 'Category', 'Type', 'Amount', 'Balance'].map((h, i) => (
              <span key={h} style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, textAlign: i >= 3 ? 'right' : 'left' }}>{h}</span>
            ))}
          </div>
          <div style={{ padding: '7px 14px 4px' }}><span style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>Today</span></div>
          <BLedgerRow name="Woolworths Metro" sub="2:14 pm" cat="Groceries" catColor="var(--neg)" kind="expense" amt={-23.40} bal={1043.18} />
          <BLedgerRow name="To Emergency Fund" sub="Auto · own account" cat="Transfer" catColor="var(--transfer)" kind="transfer" amt={-200} bal={1066.58} selected />
          <BLedgerRow name="Industry Beans" sub="8:52 am" cat="Fun" catColor="var(--neg)" kind="expense" amt={-4.80} bal={1266.58} />
          <div style={{ padding: '9px 14px 4px', borderTop: '1px solid var(--line-soft)' }}><span style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>Yesterday</span></div>
          <BLedgerRow name="Salary — Atlassian" sub="Marked salary" cat="Income" catColor="var(--pos)" kind="income" amt={2480} bal={1271.38} />
          <BLedgerRow name="Afterpay · Cotton On" sub="Instalment 3 of 4" cat="Shopping" catColor="var(--debt)" kind="expense" amt={-48.75} bal={-1208.62} />
          <BLedgerRow name="Refund — Uber" sub="Trip adjustment" cat="Transport" catColor="var(--transfer)" kind="income" amt={14.20} bal={-1159.87} />
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderTop: '1px solid var(--line)', background: 'var(--surface-2)', fontSize: 11.5, color: 'var(--text-3)' }}>
            <window.UIcon name="clock" size={14} /> Projected · <span style={{ color: 'var(--text-2)' }}>Origin Energy</span> <BMoney n={-142.10} kind="projected" size={12} arrow={false} /> in 3 days
          </div>
        </BCard>
      </div>
    </div>
  );
}

// ── Phone (hub + bottom bar) ──
function BeaconPhone() {
  const tabs = [['grid', 'Hub', true], ['money', 'Spend', false], ['wallet', 'Save', false], ['flame', 'Owe', false], ['look', 'Reports', false]];
  return (
    <div className="beacon" style={{ width: '100%', height: '100%', background: 'var(--bg)', fontFamily: 'var(--font)', color: 'var(--text)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', fontSize: 12, color: 'var(--text-2)', fontWeight: 700 }}>
        <span className="tnum">9:41</span><window.UIcon name="sync" size={13} />
      </div>
      <div style={{ flex: 1, padding: '6px 16px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em' }}>Overview</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--pos)', padding: '4px 9px', borderRadius: 8, background: 'color-mix(in oklch, var(--pos) 14%, transparent)' }}><span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--pos)' }} /> Synced</span>
        </div>
        <BCard pad={14} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <BGauge pct={0.75} value="75%" sub="ready" size={84} color="var(--saved)" />
          <div>
            <BLabel>Safe to spend</BLabel>
            <div style={{ marginTop: 5 }}><BMoney n={312.40} kind="income" size={24} weight={700} arrow={false} /></div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>through Sunday</div>
          </div>
        </BCard>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <BCard pad={13} style={{ borderTop: '2px solid var(--pos)' }}>
            <BLabel>In · Jun</BLabel><div style={{ marginTop: 6 }}><BMoney n={4960} kind="income" size={16} weight={700} arrow={false} /></div>
          </BCard>
          <BCard pad={13} style={{ borderTop: '2px solid var(--neg)' }}>
            <BLabel>Out · Jun</BLabel><div style={{ marginTop: 6 }}><BMoney n={-3829} kind="expense" size={16} weight={700} arrow={false} /></div>
          </BCard>
        </div>
        <div style={{ marginTop: 12 }}>
          <BLabel style={{ marginBottom: 8 }}>Recent</BLabel>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--neg)' }} /><span style={{ fontSize: 13, fontWeight: 600 }}>Woolworths</span></div>
            <BMoney n={-23.40} kind="expense" size={13} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--transfer)' }} /><span style={{ fontSize: 13, fontWeight: 600 }}>To Emergency Fund</span></div>
            <BMoney n={-200} kind="transfer" size={13} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--pos)' }} /><span style={{ fontSize: 13, fontWeight: 600 }}>Salary — Atlassian</span></div>
            <BMoney n={2480} kind="income" size={13} />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <BLabel style={{ marginBottom: 8 }}>Upcoming</BLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 0' }}>
            <span className="tnum" style={{ width: 32, height: 26, borderRadius: 7, background: 'color-mix(in oklch, var(--warn) 16%, transparent)', color: 'var(--warn)', fontFamily: 'var(--num)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3d</span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>Origin Energy</div><div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>Electricity</div></div>
            <BMoney n={-142.10} kind="projected" size={12.5} arrow={false} />
          </div>
        </div>
      </div>
      <div style={{ height: 66, borderTop: '1px solid var(--line-soft)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around', padding: '9px 4px 0' }}>
        {tabs.map(([ic, label, on]) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: on ? 'var(--coral)' : 'var(--text-3)' }}>
            <window.UIcon name={ic} size={20} stroke={on ? 2 : 1.7} /><span style={{ fontSize: 9.5, fontWeight: on ? 700 : 500 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Cover ──
function BeaconCover() {
  const swatch = (c, label) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: 9, background: c, border: '1px solid var(--line)' }} />
      <span style={{ fontSize: 9.5, color: 'var(--text-3)' }}>{label}</span>
    </div>
  );
  return (
    <div className="beacon" style={{ width: '100%', height: '100%', background: 'var(--bg)', fontFamily: 'var(--font)', color: 'var(--text)', padding: 30, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'radial-gradient(120% 120% at 30% 20%, #ffb199, var(--coral) 55%, #e8553f)', boxShadow: '0 0 0 1px rgba(255,112,92,0.3), 0 4px 12px rgba(255,112,92,0.3)' }} />
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.08em' }}>DIRECTION B</div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>Beacon</div>
        </div>
      </div>
      <p style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--text-2)', marginTop: 20, marginBottom: 0 }}>
        A calm cockpit. Confident colour-coded semantics, status-forward tiles and gauges — every meaning legible at a glance, never alarmist.
      </p>
      <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 15 }}>
        <div>
          <BLabel style={{ marginBottom: 9 }}>Money signal · loud (colourblind-safe)</BLabel>
          <div style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.45 }}>Colour + sign + a direction arrow + label — meaning survives greyscale and red-green deficiency.</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <BMoney n={2480} kind="income" size={15} />
            <BMoney n={-48.75} kind="expense" size={15} />
            <BMoney n={-200} kind="transfer" size={15} />
            <BMoney n={-142.1} kind="projected" size={15} arrow={false} />
          </div>
          <div style={{ display: 'flex', gap: 7, marginTop: 11, flexWrap: 'wrap' }}>
            <BPill kind="income" /><BPill kind="expense" /><BPill kind="transfer" /><BPill kind="saved" /><BPill kind="debt" />
          </div>
        </div>
        <div style={{ height: 1, background: 'var(--line-soft)' }} />
        <div>
          <BLabel style={{ marginBottom: 9 }}>IA · hub + spaces (two-pane)</BLabel>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.45 }}>A persistent icon rail of spaces — Overview, Spend, Save, Owe, Bills, Reports — beside a dense working pane. More surfaces in reach; built for the desktop power session.</div>
        </div>
        <div style={{ height: 1, background: 'var(--line-soft)' }} />
        <div>
          <BLabel style={{ marginBottom: 11 }}>Palette &amp; type</BLabel>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {swatch('var(--coral)', 'coral')}
            {swatch('var(--pos)', 'income')}
            {swatch('var(--neg)', 'expense')}
            {swatch('var(--transfer)', 'transfer')}
            {swatch('var(--saved)', 'saved')}
            {swatch('var(--debt)', 'debt')}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 14 }}>Hanken Grotesk · <span className="tnum" style={{ fontFamily: 'var(--num)' }}>JetBrains Mono 0123456789</span></div>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 11.5, color: 'var(--text-3)', borderTop: '1px solid var(--line-soft)', paddingTop: 14 }}>Best when scanning meaning fast matters most. Crisp tables, colour-coded everything, signature coral for brand &amp; action.</div>
    </div>
  );
}

Object.assign(window, { BeaconCover, BeaconDashboard, BeaconLedger, BeaconPhone });


// ============================================================
// screens/meta.jsx
// ============================================================
// meta.jsx — framing cards: how to read this, and the trade-off comparison.
// Exports: IntroCard, CompareCard

function IntroCard() {
  const fixed = ['Up coral #ff705c as the anchor accent', 'WCAG AA · colourblind-safe · dark-first', 'Tabular figures on all aligned money', 'The capabilities & data (§5) and jobs (§6)'];
  const open = ['Information architecture & navigation model', 'Neutrals, ramps & finance-semantic values', 'Type scale & family · spacing · radius · motion', 'How loud money meaning reads'];
  return (
    <div className="vellum" style={{ width: '100%', height: '100%', background: 'var(--bg)', fontFamily: 'var(--font)', color: 'var(--text)', padding: 40, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: 'radial-gradient(120% 120% at 30% 20%, #ffb199, var(--coral) 55%, #e8553f)', boxShadow: '0 4px 16px rgba(255,112,92,0.35)' }} />
        <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.1em' }}>UPSHOT V2 · DESIGN DIRECTIONS · ROUND 1</div>
      </div>
      <div style={{ fontSize: 38, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 24, lineHeight: 1.05 }}>Two ways the redesign<br />could feel.</div>
      <p style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--text-2)', marginTop: 18, maxWidth: 600 }}>
        Both are warm, humanist, dark-first and built on the same Up coral — but they answer the two big questions differently:
        <b style={{ color: 'var(--text)' }}> how loud should money meaning be</b>, and <b style={{ color: 'var(--text)' }}>how should the app be organised</b>.
        Each is shown on the two hardest screens — the daily glance and the dense ledger — plus a phone.
      </p>

      <div style={{ display: 'flex', gap: 18, marginTop: 26 }}>
        <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-card)', padding: 20 }}>
          <div style={{ fontSize: 11.5, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--coral)', fontWeight: 700, marginBottom: 13 }}>A · Vellum</div>
          <div style={{ fontSize: 14.5, color: 'var(--text-2)', lineHeight: 1.5 }}>Subtle money signal · four-room IA · editorial calm. Reads like a private journal.</div>
        </div>
        <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-card)', padding: 20 }}>
          <div style={{ fontSize: 11.5, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--coral)', fontWeight: 700, marginBottom: 13 }}>B · Beacon</div>
          <div style={{ fontSize: 14.5, color: 'var(--text-2)', lineHeight: 1.5 }}>Loud colour-coded money · hub + spaces IA · cockpit clarity. Reads like an instrument panel.</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 18, marginTop: 22 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11.5, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, marginBottom: 11 }}>Fixed — the holdover</div>
          {fixed.map((t) => (
            <div key={t} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 8, fontSize: 13, color: 'var(--text-2)' }}>
              <span style={{ color: 'var(--coral)', marginTop: 1 }}><window.UIcon name="check" size={15} stroke={2.2} /></span>{t}
            </div>
          ))}
        </div>
        <div style={{ width: 1, background: 'var(--line-soft)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11.5, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, marginBottom: 11 }}>Open — these directions explore</div>
          {open.map((t) => (
            <div key={t} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 8, fontSize: 13, color: 'var(--text-2)' }}>
              <span style={{ color: 'var(--text-3)', marginTop: 1 }}><window.UIcon name="arrowR" size={15} stroke={2} /></span>{t}
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 12.5, color: 'var(--text-3)', borderTop: '1px solid var(--line-soft)', paddingTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <window.UIcon name="grid" size={15} /> Drag to pan · scroll to zoom · click any frame's ⤢ to view full-size. Pick one — or tell me what to blend.
      </div>
    </div>
  );
}

function CompareCard() {
  const rows = [
    ['Feeling', 'Editorial, calm, private', 'Confident, structured, status-forward'],
    ['Money signal', 'Sign + weight first; colour whispers', 'Colour + sign + arrow + label; loud'],
    ['Navigation', '4 rooms + ⌘K — radical consolidation', 'Icon rail of 6 spaces — two-pane'],
    ['Best on', 'The 2-second glance; night reading', 'Dense desktop sessions; scanning fast'],
    ['Colourblind path', 'Inherent — barely uses colour', 'Engineered — arrows & labels back colour'],
    ['Risk to watch', 'Power users may want more on screen', 'More colour = more discipline to keep calm'],
  ];
  return (
    <div className="vellum" style={{ width: '100%', height: '100%', background: 'var(--bg)', fontFamily: 'var(--font)', color: 'var(--text)', padding: 40, display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 6 }}>HOW THEY DIFFER</div>
      <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 24 }}>Trade-offs at a glance</div>
      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr', gap: 0, border: '1px solid var(--line)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }} />
        <div style={{ padding: '14px 18px', background: 'var(--surface-2)', borderBottom: '1px solid var(--line)', borderLeft: '1px solid var(--line)', fontWeight: 700, fontSize: 15, color: 'var(--coral)' }}>A · Vellum</div>
        <div style={{ padding: '14px 18px', background: 'var(--surface-2)', borderBottom: '1px solid var(--line)', borderLeft: '1px solid var(--line)', fontWeight: 700, fontSize: 15, color: 'var(--coral)' }}>B · Beacon</div>
        {rows.map(([dim, a, b], i) => (
          <React.Fragment key={dim}>
            <div style={{ padding: '15px 16px', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)', background: 'var(--surface)', borderBottom: i < rows.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>{dim}</div>
            <div style={{ padding: '15px 18px', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.4, borderLeft: '1px solid var(--line)', borderBottom: i < rows.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>{a}</div>
            <div style={{ padding: '15px 18px', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.4, borderLeft: '1px solid var(--line)', borderBottom: i < rows.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>{b}</div>
          </React.Fragment>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: 'var(--coral-dim)', border: '1px solid color-mix(in oklch, var(--coral) 30%, transparent)', borderRadius: 'var(--r-card)', padding: 18, marginTop: 24 }}>
        <span style={{ color: 'var(--coral)', flexShrink: 0, marginTop: 1 }}><window.UIcon name="target" size={20} /></span>
        <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>
          <b>These aren't mutually exclusive.</b> A common landing spot is Vellum's calm shell with Beacon's louder money rendering reserved for the ledger and reports — or Beacon's gauges on a Vellum dashboard. Tell me which pieces of each to keep and I'll converge on one system, then deliver the full token set + component specs.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { IntroCard, CompareCard });


function IdeasCard() {
  const rows = [
    ['Command palette (\u2318K)', 'Navigate / search / act \u2014 desktop', 'now'],
    ['Trend indicators & sparklines', 'Key stats, cashflow', 'now'],
    ['Goal / saver confidence', 'Readiness gauge \u2014 on track / at risk', 'now'],
    ['Named health states', 'A calm spectrum, not a bare score', 'now'],
    ['Insight cards', 'Short, plain-language, never nagging', 'now'],
    ['Configurable dashboard', 'Widgets + a strong default glance', 'next'],
    ['Money-flow diagram', 'income \u2192 categories \u2192 saved, on reports', 'next'],
    ['Spending heatmap calendar', 'Analytics \u2014 paydays, zero-spend days', 'next'],
    ['No-spend streaks', 'Quiet encouragement, not a dopamine loop', 'next'],
    ['Recurring-spend view', 'Bills \u2014 \u201cprice went up\u201d, overlaps', 'next'],
    ['Net-worth over time', 'A restrained, trustworthy trend', 'next'],
  ];
  return (
    <div className="vellum" style={{ width: '100%', height: '100%', background: 'var(--bg)', fontFamily: 'var(--font)', color: 'var(--text)', padding: 36, display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 6 }}>APPENDIX A · COMPETITOR-SCAN MENU</div>
      <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>Ideas to layer in</div>
      <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-2)', marginTop: 10, marginBottom: 22, maxWidth: 600 }}>
        A menu, not a checklist — each mapped to the job it does and where it lives. Five already show in these directions; the rest slot in cleanly once a direction is picked, all kept calm and never gamified.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--line)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
        {rows.map(([idea, where, status], i) => (
          <div key={idea} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '13px 18px', borderBottom: i < rows.length - 1 ? '1px solid var(--line-soft)' : 'none', background: i % 2 ? 'transparent' : 'var(--surface)' }}>
            <div style={{ flex: '0 0 230px', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{idea}</div>
            <div style={{ flex: 1, fontSize: 13, color: 'var(--text-3)' }}>{where}</div>
            <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.03em', padding: '4px 11px', borderRadius: 999, whiteSpace: 'nowrap',
              color: status === 'now' ? 'var(--coral)' : 'var(--text-3)',
              background: status === 'now' ? 'var(--coral-dim)' : 'transparent',
              border: status === 'now' ? '1px solid color-mix(in oklch, var(--coral) 30%, transparent)' : '1px solid var(--line)' }}>
              {status === 'now' ? 'SHOWN NOW' : 'LAYER IN'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { IdeasCard });

window.__SCREENS_READY = true;
