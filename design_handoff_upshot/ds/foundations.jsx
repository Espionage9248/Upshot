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
