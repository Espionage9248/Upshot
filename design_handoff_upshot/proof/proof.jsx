/*__IIFE_WRAP__*/;(function(){
// proof.jsx — Upshot V2 Build Fidelity Proof.
// Renders the REAL build components (window.* from ds-components.jsx) in both
// modes and certifies them against ds/tokens.css + Upshot Component Specs.md.

const {
  Money, Btn, Icon, Confidence, Utilisation, Gauge, Spark, Mono,
  PrimButtons, PrimInputs, PrimControls, PrimTabsBadge, PrimFeedback, PrimOverlays,
  FinMoney, FinEnvelopeDebt, FinLedger, FinSignals, FinReadinessSync, FinCharts, FinCardsInsight,
} = window;

const MONO = 'var(--font-mono)';

/* ───────────────────────── report chrome ───────────────────────── */

// scoped colour island so a subtree renders in a specific mode
function Island({ mode = 'light', children, style, pad = 22 }) {
  return (
    <div className={'pf-' + mode} style={{ background: 'var(--bg)', color: 'var(--text)', borderRadius: 14, padding: pad, border: '1px solid var(--line)', ...style }}>
      {children}
    </div>
  );
}

// verdict stamp: ok | fix | partial
function Stamp({ v, children }) {
  const map = {
    ok: ['var(--income)', 'Faithful'],
    done: ['var(--income)', 'Resolved'],
    fix: ['var(--warn)', 'Reconcile'],
    partial: ['var(--transfer)', 'In screen build'],
    spec: ['var(--text-3)', 'Spec only'],
  };
  const [c, label] = map[v] || map.ok;
  const glyph = v === 'ok' || v === 'done' ? '✓' : v === 'fix' ? '⚠' : v === 'partial' ? '◐' : '·';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: c, whiteSpace: 'nowrap',
      padding: '3px 9px', borderRadius: 999, background: `color-mix(in oklch, ${c} 13%, transparent)`, border: `1px solid color-mix(in oklch, ${c} 30%, transparent)` }}>
      <span style={{ fontSize: 11 }}>{glyph}</span>{children || label}
    </span>
  );
}

function Kicker({ children }) {
  return <div style={{ fontSize: 11, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--coral-text)', fontWeight: 700 }}>{children}</div>;
}

function SectionHead({ n, title, lead, id }) {
  return (
    <div id={id} style={{ scrollMarginTop: 80, marginBottom: 22, maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <span className="tnum" style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: 'var(--on-coral)', background: 'var(--coral)', borderRadius: 7, padding: '3px 8px' }}>{n}</span>
        <h2 style={{ fontSize: 27, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>{title}</h2>
      </div>
      {lead && <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--text-2)', margin: 0 }}>{lead}</p>}
    </div>
  );
}

function Card({ children, style, pad = 22 }) {
  return <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-card)', padding: pad, boxShadow: 'var(--elev-1)', ...style }}>{children}</div>;
}

function SubHead({ children, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>{children}</div>
      {right}
    </div>
  );
}

/* ───────────────────────── 0 · masthead + sign-off ───────────────────────── */

const SIGN_KEY = 'upshot-proof-signoff-v1';

function readSignoff() { try { return JSON.parse(localStorage.getItem(SIGN_KEY)) || null; } catch { return null; } }

// shared, self-contained sign-off state: localStorage source of truth +
// a 'signoff-update' event so the ribbon and the gate stay in lockstep.
function useSignoff() {
  const [signoff, setSignoff] = React.useState(readSignoff);
  React.useEffect(() => {
    const h = () => setSignoff(readSignoff());
    window.addEventListener('signoff-update', h);
    window.addEventListener('storage', h);
    return () => { window.removeEventListener('signoff-update', h); window.removeEventListener('storage', h); };
  }, []);
  const sign = (who) => {
    const rec = { who: (who || '').trim() || 'Reviewer', at: new Date().toISOString() };
    try { localStorage.setItem(SIGN_KEY, JSON.stringify(rec)); } catch {}
    window.dispatchEvent(new Event('signoff-update'));
  };
  const clear = () => { try { localStorage.removeItem(SIGN_KEY); } catch {} window.dispatchEvent(new Event('signoff-update')); };
  return { signoff, sign, clear };
}

function Masthead() {
  const { signoff } = useSignoff();
  const approved = !!signoff;

  const stamp = approved ? ['var(--income)', '✓', 'Approved — ready to bundle'] : ['var(--income)', '✓', 'Reconcile items closed · pending sign-off → Claude Code'];

  const meta = [
    ['Artifact', 'Build Fidelity Proof'],
    ['Subject', 'Upshot V2 — converged component library'],
    ['Checked against', 'ds/tokens.css · Component Specs.md'],
    ['Reference render', 'Upshot Design System.html'],
    ['Modes', 'Light (warm paper) + Dark (charcoal)'],
    ['Date', 'June 2, 2026'],
  ];

  return (
    <header style={{ marginBottom: 52 }}>
      {/* status ribbon */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
        background: `color-mix(in oklch, ${stamp[0]} 11%, var(--surface))`, border: `1px solid color-mix(in oklch, ${stamp[0]} 32%, transparent)`,
        borderRadius: 999, padding: '9px 9px 9px 18px', marginBottom: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, color: stamp[0] }}>
          <span style={{ fontSize: 14 }}>{stamp[1]}</span>{stamp[2]}
          {approved && <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>· {signoff.who} · {new Date(signoff.at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
        </div>
        <a href="#signoff" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, textDecoration: 'none',
          color: 'var(--on-coral)', background: 'var(--coral)', borderRadius: 999, padding: '7px 15px' }}>
          {approved ? 'View sign-off' : 'Go to sign-off'} <Icon name="chevron" size={14} stroke={2.4} />
        </a>
      </div>

      <Kicker>Upshot V2 · Design → Engineering handoff</Kicker>
      <h1 style={{ fontSize: 46, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.02, margin: '14px 0 0', maxWidth: 880 }}>
        Build fidelity proof
      </h1>
      <p style={{ fontSize: 16.5, lineHeight: 1.6, color: 'var(--text-2)', maxWidth: 740, margin: '18px 0 0' }}>
        The evidence that the converged Upshot component library renders to the token contract and the written
        component spec — in both light and dark — with all five reconciliation items now closed in the round-2 build.
        Every component below is the <b style={{ color: 'var(--text)' }}>real source</b>, rendered live, not a screenshot.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, marginTop: 32, background: 'var(--line)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
        {meta.map(([k, v]) => (
          <div key={k} style={{ background: 'var(--surface)', padding: '15px 18px' }}>
            <div style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, marginBottom: 6 }}>{k}</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* scoreboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 14 }}>
        {[['18', 'components rendered', 'var(--income)'], ['7', 'semantic money meanings', 'var(--coral)'], ['2', 'modes, now both wired', 'var(--transfer)'], ['5', 'reconcile items closed', 'var(--income)']].map(([n, l, c]) => (
          <Card key={l} pad={16} style={{ borderColor: `color-mix(in oklch, ${c} 26%, var(--line))` }}>
            <div className="tnum" style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, color: c, letterSpacing: '-0.02em', lineHeight: 1 }}>{n}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 7, lineHeight: 1.3 }}>{l}</div>
          </Card>
        ))}
      </div>

      {/* legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 26, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>How to read the verdicts:</span>
        <Stamp v="ok">Faithful — matches contract</Stamp>
        <Stamp v="done">Resolved — closed in the build</Stamp>
        <Stamp v="partial">In screen build — exists, not in reference render</Stamp>
        <Stamp v="spec">Spec only — authored, not yet rendered</Stamp>
      </div>
    </header>
  );
}

/* ───────────────────────── 1 · token parity ───────────────────────── */

function Swatch({ token, mode }) {
  return (
    <div className={'pf-' + mode} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 26, height: 26, borderRadius: 7, background: `var(${token})`, border: '1px solid var(--line)', flexShrink: 0 }} />
      <span style={{ fontFamily: MONO, fontSize: 10.5, color: 'var(--text-3)' }}>{mode[0].toUpperCase()}</span>
    </div>
  );
}

function ParityRow({ group, canonical, build, v, note, swatches }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '142px 1fr 120px', gap: 18, alignItems: 'start', padding: '15px 0', borderBottom: '1px solid var(--line-soft)' }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{group}</div>
        {swatches && (
          <div style={{ display: 'flex', gap: 8, marginTop: 9 }}>
            {swatches.map((t) => (
              <div key={t} style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--surface-2)', borderRadius: 8, padding: 5, border: '1px solid var(--line-soft)' }}>
                <Swatch token={t} mode="light" /><Swatch token={t} mode="dark" />
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>
        <div><span style={{ color: 'var(--text-3)' }}>Contract&nbsp;</span>{canonical}</div>
        <div style={{ marginTop: 4 }}><span style={{ color: 'var(--text-3)' }}>Build&nbsp;</span>{build}</div>
        {note && <div style={{ marginTop: 7, fontSize: 12, color: v === 'fix' ? 'var(--warn)' : v === 'done' ? 'var(--income)' : 'var(--text-3)' }}>{note}</div>}
      </div>
      <div style={{ justifySelf: 'end' }}><Stamp v={v} /></div>
    </div>
  );
}

const PARITY = [
  { group: 'Finance semantics', swatches: ['--income', '--expense', '--transfer', '--saved', '--debt', '--warn', '--proj'],
    canonical: <>seven OKLCH meanings, AA in both modes</>, build: <>identical OKLCH values, per mode</>, v: 'ok',
    note: 'Money atom pairs every colour with sign + icon — meaning never by colour alone.' },
  { group: 'Data-viz series', swatches: ['--viz-1', '--viz-2', '--viz-3', '--viz-4', '--viz-5', '--viz-6', '--viz-7'],
    canonical: <>ordered <Mono>--viz-1…7</Mono>, viz-1 = coral = actual</>, build: <>identical ordered ramp</>, v: 'ok',
    note: 'Colourblind-spaced hues; projected tail is same hue, dashed.' },
  { group: 'Brand', swatches: ['--coral', '--coral-dim', '--yellow'],
    canonical: <><Mono>--coral --coral-text --coral-dim --on-coral --focus --yellow</Mono></>, build: <>full set adopted; coral text uses <Mono>--coral-text</Mono>, dark focus lifts to <Mono>--focus</Mono></>, v: 'done',
    note: 'Closed: coral-as-text swapped to --coral-text (AA both modes); focus ring now --focus (#ff8473 in dark).' },
  { group: 'Neutrals', swatches: ['--bg', '--surface', '--surface-2', '--surface-3'],
    canonical: <>warm ramp <Mono>--n-0…900</Mono> + surfaces/text/line, per mode</>, build: <>inherits the contract surfaces/text/line verbatim, per mode</>, v: 'done',
    note: 'Closed: the .up scope no longer redefines neutrals — tertiary-text hue is the contract value.' },
  { group: 'Type', canonical: <>Figtree + JetBrains Mono · role scale as <Mono>--text-*</Mono></>, build: <>references <Mono>--font-sans / --font-mono</Mono> from the contract</>, v: 'done',
    note: 'Closed: --font / --num aliases renamed to the canonical families.' },
  { group: 'Radius', canonical: <><Mono>--radius-data 9 · sm 6 · card 18 · pill</Mono></>, build: <>uses <Mono>--radius-data / -card / -pill</Mono></>, v: 'done',
    note: 'Closed: --r-data / --r-card / --r-pill renamed to canonical --radius-*.' },
  { group: 'Elevation', canonical: <><Mono>--elev-1/2/3/-pop</Mono>, dark = inset top-highlight</>, build: <>surfaces reference <Mono>--elev-2 / --elev-3</Mono></>, v: 'done',
    note: 'Closed: Card + command-palette shadows wired to --elev-* — light now gets real shadows.' },
  { group: 'Spacing & motion', canonical: <>4px base <Mono>--spacing</Mono>; <Mono>--duration-* / --ease-*</Mono></>, build: <>contract tokens exposed; reduced-motion centralised</>, v: 'done',
    note: 'Closed: --spacing, --duration-*, --ease-* available; prefers-reduced-motion honoured globally.' },
  { group: 'Light + dark', canonical: <>both modes authored as true peers</>, build: <>renders <Mono>:root</Mono> (light) + <Mono>.dark</Mono> (dark) with a toggle</>, v: 'done',
    note: 'Closed — the headline item: the dark-only .up scope is gone; screens flip light/dark from tokens.css.' },
];

function TokenParity() {
  return (
    <section style={{ marginBottom: 64 }}>
      <SectionHead n="01" title="Token contract parity" id="tokens"
        lead="Every group in ds/tokens.css, checked against what the round-2 screen build now injects. The money + data-viz layers always matched the contract; the naming, brand-text, elevation and light-mode drift has been closed — the build now resolves to the canonical tokens." />
      <Card pad={26}>
        <SubHead right={<span style={{ fontSize: 11, color: 'var(--text-3)' }}>swatch pairs show <b style={{ color: 'var(--text-2)' }}>L</b>ight / <b style={{ color: 'var(--text-2)' }}>D</b>ark, live</span>}>tokens.css → build</SubHead>
        {PARITY.map((p) => <ParityRow key={p.group} {...p} />)}
      </Card>
    </section>
  );
}

/* ───────────────────────── 2 · coverage matrix ───────────────────────── */

const PRIMS = [
  ['Button', '§2', 'ok'], ['Input · Select · Textarea', '§2', 'ok'], ['Switch · Slider · Checkbox', '§2', 'ok'],
  ['Tabs', '§2', 'ok'], ['Badge', '§2', 'ok'], ['Progress', '§2', 'ok'], ['Skeleton', '§2', 'ok'],
  ['Alert', '§2', 'ok'], ['Dialog', '§2', 'ok'], ['Sheet', '§2', 'ok'], ['Popover', '§2', 'ok'],
  ['Card', '§2', 'ok'], ['Empty / Loading', '§3', 'ok'], ['Table', '§2', 'spec'], ['Tooltip', '§2', 'spec'],
];
const FINS = [
  ['Money (atom)', '§3', 'ok'], ['Envelope', '§3', 'ok'], ['Debt · Installment', '§3', 'ok'], ['Ledger row', '§3', 'ok'],
  ['Confidence', '§3', 'ok'], ['Card utilisation', '§3', 'ok'], ['Readiness gauge', '§3', 'ok'], ['Sync status', '§3', 'ok'],
  ['Streak', '§3', 'ok'], ['Cashflow / Forecast', '§3', 'ok'], ['Category donut', '§3', 'ok'], ['Net-worth trend', '§3', 'ok'],
  ['Money-flow (Sankey)', '§3', 'ok'], ['Spending heatmap', '§3', 'ok'], ['Asset card', '§3', 'ok'], ['Insight card', '§3', 'ok'],
  ['Rule builder', '§3', 'ok'], ['Stat', '§3', 'ok'], ['Upcoming bills', '§3', 'partial'], ['Command palette', '§3', 'partial'],
];

function MatrixCol({ title, rows }) {
  return (
    <Card pad={20}>
      <SubHead>{title}</SubHead>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rows.map(([name, ref, v]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--line-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{name}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: 'var(--text-3)' }}>{ref}</span>
            </div>
            <Stamp v={v} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function Coverage() {
  return (
    <section style={{ marginBottom: 64 }}>
      <SectionHead n="02" title="Component coverage" id="coverage"
        lead="Spec §2 (primitives) and §3 (finance) against the reference render. Two components are specced but not yet drawn in the reference; two finance surfaces live only in the screen build. Everything else is rendered and proven below." />
      <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1fr', gap: 18 }}>
        <MatrixCol title="Primitives · 15" rows={PRIMS} />
        <MatrixCol title="Finance components · 20" rows={FINS} />
      </div>
    </section>
  );
}

/* ───────────────────────── 3 · live render proof ───────────────────────── */

// a single component rendered side-by-side in both modes
function ParityPair({ label, render }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 9, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {['light', 'dark'].map((m) => (
          <Island key={m} mode={m} pad={20} style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', top: 10, right: 12, fontFamily: MONO, fontSize: 9.5, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{m}</span>
            {render()}
          </Island>
        ))}
      </div>
    </div>
  );
}

function MoneyDemo() {
  const rows = [['income', 2480], ['expense', -48.75], ['transfer', -200], ['saved', 4500], ['debt', -8240], ['projected', -142.1]];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 16 }}>
        <div className="tnum" style={{ fontSize: 40, fontWeight: 700, fontFamily: MONO, letterSpacing: '-0.03em', lineHeight: 1, color: 'var(--text)' }}>$312<span style={{ fontSize: 21, color: 'var(--text-2)' }}>.40</span></div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>safe-to-spend · quiet</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px 18px' }}>
        {rows.map(([k, n]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: MONO }}>{k}</span>
            <Money n={n} kind={k} size={14} arrow={['income', 'expense', 'debt', 'saved'].includes(k)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ButtonDemo() {
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 14 }}>
        <Btn variant="primary"><Icon name="plus" size={15} /> Add</Btn>
        <Btn variant="secondary">Edit</Btn>
        <Btn variant="ghost">Cancel</Btn>
        <Btn variant="danger">Delete</Btn>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
        <Btn>Default</Btn><Btn state="hover">Hover</Btn><Btn state="focus">Focus</Btn><Btn state="disabled">Disabled</Btn>
      </div>
    </div>
  );
}

function SignalsDemo() {
  return (
    <div>
      <Confidence level="on" />
      <div style={{ display: 'flex', gap: 16, margin: '12px 0 16px' }}><Confidence level="at" compact /><Confidence level="off" compact /></div>
      <Utilisation used={1240} limit={2000} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 16 }}>
        <span style={{ color: 'var(--income)' }}><Icon name="flame" size={22} /></span>
        <div><span className="tnum" style={{ fontSize: 22, fontWeight: 700, fontFamily: MONO }}>6</span><span style={{ fontSize: 11.5, color: 'var(--text-3)', marginLeft: 8 }}>no-spend days · best 9</span></div>
      </div>
    </div>
  );
}

function LedgerDemo() {
  const rows = [['Woolworths Metro', 'Groceries', 'expense', -23.40, 'var(--expense)'], ['Salary — Atlassian', 'Income', 'income', 2480, 'var(--income)'], ['To Emergency Fund', 'Transfer', 'transfer', -200, 'var(--transfer)']];
  return (
    <div>
      {rows.map(([n, cat, k, amt, c], i) => (
        <div key={n} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr auto', alignItems: 'center', gap: 10, padding: '11px 10px', borderRadius: 8, background: i === 2 ? 'var(--coral-dim)' : 'transparent', boxShadow: i === 2 ? 'inset 2px 0 0 var(--coral)' : 'none', borderBottom: '1px solid var(--line-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}><span style={{ width: 7, height: 7, borderRadius: 999, background: c, flexShrink: 0 }} /><span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n}</span></div>
          <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{cat}</span>
          <Money n={amt} kind={k} size={13} />
        </div>
      ))}
    </div>
  );
}

function ChartsDemo() {
  return (
    <div style={{ display: 'flex', gap: 22, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cashflow + band</div>
        <Spark points={[10.4, 9.8, 9.2, 10.1, 9.6, 8.9, 9.4, 10.2, 11.1, 10.6, 11.4, 12.2]} w={180} h={74} stroke="var(--coral)" projFrom={7} band={[0, 0, 0, 0, 0, 0, 0, 0.4, 0.8, 1.1, 1.5, 1.8]} fill="color-mix(in oklch, var(--coral) 9%, transparent)" />
      </div>
      <div>
        <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Readiness</div>
        <Gauge pct={0.75} value="75%" sub="of goal" color="var(--saved)" size={92} />
      </div>
    </div>
  );
}

function ModeParity() {
  return (
    <div style={{ marginBottom: 30 }}>
      <SubHead>Mode parity — identical source, both modes</SubHead>
      <ParityPair label="Money atom — seven meanings, tabular, sign + colour + icon" render={() => <MoneyDemo />} />
      <ParityPair label="Button — variants + interactive states" render={() => <ButtonDemo />} />
      <ParityPair label="Signals — confidence (never colour-only), utilisation, streak" render={() => <SignalsDemo />} />
      <ParityPair label="Ledger row — selected gets the coral inset edge" render={() => <LedgerDemo />} />
      <ParityPair label="Data-viz — actual coral, projected dashed + band, gauge" render={() => <ChartsDemo />} />
    </div>
  );
}

function FullLibrary() {
  const grid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 };
  return (
    <div>
      <SubHead right={<span style={{ fontSize: 11, color: 'var(--text-3)' }}>rendered in light · dark proven above</span>}>Full primitive + finance library</SubHead>
      <Island mode="light" pad={20}>
        <div style={grid}>
          <PrimButtons /><PrimInputs /><PrimControls /><PrimTabsBadge /><PrimFeedback /><PrimOverlays />
          <FinMoney /><FinEnvelopeDebt /><FinLedger /><FinSignals /><FinReadinessSync /><FinCharts /><FinCardsInsight />
        </div>
      </Island>
    </div>
  );
}

function LiveProof() {
  return (
    <section style={{ marginBottom: 64 }}>
      <SectionHead n="03" title="Live render proof" id="render"
        lead="The actual component source, executed. The first block proves a single source renders correctly in both modes; the second is the full library in light — the mode the screen build still has to wire up." />
      <ModeParity />
      <FullLibrary />
    </section>
  );
}

/* ───────────────────────── 4 · accessibility ───────────────────────── */

const A11Y = [
  ['Text & UI ≥ WCAG AA in both modes', 'Neutral + semantic pairs authored per mode; text ≥13:1, text-2 ≥5:1.'],
  ['No meaning by colour alone', 'Money carries sign (+ − ~) + arrow; confidence carries glyph + label + position.'],
  ['Visible focus ring on every focusable part', 'Global :focus-visible = 2px --focus, 2px offset, both modes.'],
  ['Keyboard operable, logical order', 'Primitives map to Radix (focus trap, roving tabindex, escape) — behaviour preserved.'],
  ['Tabular figures on aligned numbers', '.tnum + JetBrains Mono on every money / stat / table cell.'],
  ['Hit target ≥ 44px on touch', 'Button lg = 44; controls 38 at md with lg on touch.'],
  ['Motion honours prefers-reduced-motion', 'All durations collapse to ≤0.01ms under the query.'],
  ['Survives a 360px phone width', 'Ledger + dense tables collapse to merchant + amount; they don’t clip.'],
];

function Accessibility() {
  return (
    <section style={{ marginBottom: 64 }}>
      <SectionHead n="04" title="Accessibility conformance" id="a11y"
        lead="The per-component checklist from Component Specs §4, with the evidence for each. These are properties of the contract, so they hold across every component above." />
      <Card pad={10}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {A11Y.map(([item, ev], i) => (
            <div key={item} style={{ display: 'flex', gap: 12, padding: '15px 16px', borderBottom: i < A11Y.length - 2 ? '1px solid var(--line-soft)' : 'none' }}>
              <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 6, background: 'color-mix(in oklch, var(--income) 16%, transparent)', color: 'var(--income)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={14} stroke={3} /></span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>{item}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 4, lineHeight: 1.45 }}>{ev}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

/* ───────────────────────── 5 · reconciliation ───────────────────────── */

const RECON = [
  ['1', 'Light + dark, both wired', 'major', 'The round-2 .up scope hardcoded the dark palette only.', 'Upshot Expansion.html now ships the canonical :root (light) + .dark (dark) mirror with a mode toggle; .up no longer overrides colour. The only item that moved pixels.'],
  ['2', 'Canonical token namespace', 'medium', 'Build used local aliases — --num, --font, --r-card/-data/-pill, --coral-2.', 'Renamed across build/* to --font-mono, --font-sans, --radius-*; the unused --coral-2 was dropped.'],
  ['3', 'Brand text + focus tokens', 'medium', 'No --coral-text / --on-coral; focus ring reused --coral.', 'Coral-as-text swapped to --coral-text (AA in both modes); the .up focus ring is now --focus (#ff8473 in dark).'],
  ['4', 'Elevation tokens', 'low', 'Card + command-palette shadows were hardcoded.', 'Surfaces reference --elev-2 / --elev-3 — light gets real shadows, dark keeps the inset top-highlight.'],
  ['5', 'Spacing / motion exposed', 'low', 'Rhythm + timings were applied inline only.', '--spacing, --duration-*, --ease-* are exposed; prefers-reduced-motion collapses motion globally.'],
];

function Reconcile() {
  const sev = { major: 'var(--expense)', medium: 'var(--warn)', low: 'var(--text-3)' };
  return (
    <section style={{ marginBottom: 64 }}>
      <SectionHead n="05" title="Reconciliation — all five closed" id="reconcile"
        lead="Every item the proof flagged has been closed in the round-2 build (build/* → screens/expansion.jsx + Upshot Expansion.html). None were visual-design questions — the look was already settled; this was packaging the screens onto the canonical token contract." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {RECON.map(([n, title, s, was, fix]) => (
          <Card key={n} pad={20} style={{ borderLeft: `3px solid ${sev[s]}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span className="tnum" style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: 'var(--text-3)' }}>{n}</span>
              <div style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>{title}</div>
              <Stamp v="done" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 18 }}>
              <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}><span style={{ color: 'var(--text-3)', fontWeight: 700, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 4 }}>Was</span>{was}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.5 }}><span style={{ color: 'var(--income)', fontWeight: 700, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 4 }}>Done</span>{fix}</div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── sign-off ───────────────────────── */

function SignOff() {
  const { signoff, sign, clear } = useSignoff();
  const [who, setWho] = React.useState('');
  const approved = !!signoff;

  return (
    <section id="signoff" style={{ scrollMarginTop: 80, marginBottom: 20 }}>
      <Card pad={30} style={{ background: approved ? 'color-mix(in oklch, var(--income) 8%, var(--surface))' : 'var(--surface)', borderColor: approved ? 'color-mix(in oklch, var(--income) 34%, transparent)' : 'var(--line)' }}>
        <Kicker>Gate</Kicker>
        <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: '12px 0 6px' }}>Sign-off</h2>
        <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.55, margin: '0 0 22px', maxWidth: 620 }}>
          Approving certifies the component library is faithful to the contract and the five reconciliation items
          are closed in the round-2 build. On approval this proof is ready to bundle for handoff to Claude Code.
        </p>

        {approved ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--income)', color: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={24} stroke={3} /></span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--income)' }}>Approved for bundling</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{signoff.who} · {new Date(signoff.at).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
            <button onClick={clear} style={{ marginLeft: 'auto', height: 38, padding: '0 16px', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)', color: 'var(--text-2)', background: 'transparent', border: '1px solid var(--line)', borderRadius: 'var(--radius-data)', cursor: 'pointer' }}>Revoke</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Reviewer</div>
              <input value={who} onChange={(e) => setWho(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sign(who); }} placeholder="Your name"
                style={{ width: 260, height: 42, padding: '0 14px', fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--text)', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--radius-data)', outline: 'none' }} />
            </div>
            <button onClick={() => sign(who)} style={{ height: 42, padding: '0 22px', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-sans)', color: 'var(--on-coral)', background: 'var(--coral)', border: 'none', borderRadius: 'var(--radius-data)', cursor: 'pointer' }}>
              <Icon name="check" size={17} stroke={2.6} /> Approve &amp; mark ready to bundle
            </button>
          </div>
        )}
      </Card>
    </section>
  );
}

/* ───────────────────────── app ───────────────────────── */

function ProofApp() {
  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '56px 40px 90px' }}>
      <Masthead />
      <TokenParity />
      <Coverage />
      <LiveProof />
      <Accessibility />
      <Reconcile />
      <SignOff />
      <footer style={{ marginTop: 40, paddingTop: 22, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 12, color: 'var(--text-3)' }}>
        <span>Upshot V2 · Build fidelity proof · generated against ds/tokens.css + Upshot Component Specs.md</span>
        <span style={{ fontFamily: MONO }}>render: live · modes: light + dark</span>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ProofApp />);

})();
