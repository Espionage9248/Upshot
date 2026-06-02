// ds/app.jsx — Design System page shell: header, theme toggle, TOC, sections.

const TOC = [
  ['overview', 'Overview'], ['color', 'Colour'], ['dataviz', 'Data-viz'], ['type', 'Typography'], ['scales', 'Spacing & motion'],
  ['primitives', 'Primitives'], ['finance', 'Finance components'], ['deliver', 'Delivery'],
];

function ThemeToggle({ theme, setTheme }) {
  return (
    <div style={{ display: 'flex', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 999, padding: 3 }}>
      {[['light', 'sun', 'Light'], ['dark', 'moon', 'Dark']].map(([id, ic, label]) => {
        const on = theme === id;
        return <button key={id} onClick={() => setTheme(id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, background: on ? 'var(--coral)' : 'transparent', color: on ? 'var(--on-coral)' : 'var(--text-3)' }}><Icon name={ic} size={15} />{label}</button>;
      })}
    </div>
  );
}

function Intro() {
  return (
    <section id="overview" style={{ scrollMarginTop: 80, marginBottom: 56 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--coral-text)', fontWeight: 700, marginBottom: 12 }}>Upshot V2 · Design System</div>
      <h1 style={{ fontSize: 38, fontWeight: 600, letterSpacing: '-0.025em', margin: '0 0 16px', lineHeight: 1.05, maxWidth: 720 }}>The converged system — warm shell, confident money, light &amp; dark as peers.</h1>
      <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--text-2)', maxWidth: 700, margin: 0 }}>
        The resting point of Rounds 1–2: Vellum’s warm, editorial calm carrying Beacon’s confident, colourblind-safe money rendering. Figtree for voice, JetBrains Mono for tabular money, Up Sunset Orange as the only accent. Everything below is tokenised for Tailwind v4 <Mono>@theme</Mono> and maps to Radix + CVA. Flip the toggle — both modes are designed, not inverted.
      </p>
      <div style={{ display: 'flex', gap: 12, marginTop: 22, flexWrap: 'wrap' }}>
        {[['Up #ff705c anchor', 'var(--coral)'], ['WCAG AA · both modes', 'var(--income)'], ['Colourblind-safe', 'var(--transfer)'], ['Tabular money', 'var(--text-2)']].map(([t, c]) => <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', padding: '6px 13px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--line)' }}><span style={{ width: 8, height: 8, borderRadius: 999, background: c }} />{t}</span>)}
      </div>
    </section>
  );
}

function CompGrid({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>{children}</div>;
}

function Deliver() {
  return (
    <DSSection id="deliver" kicker="Handoff" title="What ships" lead="The contract is values + visual decisions, not feature logic. Three artefacts drop into packages/ui:">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {[['tokens.css', 'Tailwind v4 @theme — full light (:root) + dark (.dark) variable sets, OKLCH, Up-orange anchored.', 'ds/tokens.css'], ['Component specs', 'Anatomy, token mapping & every state, mapped to Radix + CVA variants/sizes.', 'Upshot Component Specs.md'], ['This page', 'The living reference — tokens & component states rendered, light + dark.', 'Upshot Design System.html']].map(([t, d, f]) => (
          <Panel key={t}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{t}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 12 }}>{d}</div>
            <Mono>{f}</Mono>
          </Panel>
        ))}
      </div>
    </DSSection>
  );
}

function DSApp() {
  const [theme, setTheme] = React.useState(() => { try { return localStorage.getItem('upshot-ds-theme') || 'dark'; } catch { return 'dark'; } });
  React.useEffect(() => {
    const r = document.documentElement;
    r.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem('upshot-ds-theme', theme); } catch {}
    // Paint body/html with the RESOLVED literal colour. key={theme} remounts the
    // app subtree (fresh nodes pick up the new vars); this covers the static
    // body/html, which some engines won't repaint on a custom-property flip.
    requestAnimationFrame(() => {
      const cs = getComputedStyle(r);
      const bg = cs.getPropertyValue('--bg').trim();
      const fg = cs.getPropertyValue('--text').trim();
      if (bg) { document.body.style.background = bg; r.style.background = bg; }
      if (fg) document.body.style.color = fg;
    });
  }, [theme]);
  return (
    <div key={theme} style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'color-mix(in oklch, var(--bg) 86%, transparent)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: 10, background: 'radial-gradient(120% 120% at 30% 20%, #ffb199, var(--coral) 55%, #e8553f)', boxShadow: '0 3px 12px rgba(255,112,92,0.34)' }} />
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>Upshot <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>· Design System</span></div>
          </div>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </header>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 32px 80px', display: 'flex', gap: 40 }}>
        <nav style={{ width: 170, flexShrink: 0, position: 'sticky', top: 88, alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TOC.map(([id, label]) => <a key={id} href={'#' + id} style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none', padding: '7px 11px', borderRadius: 8, fontWeight: 500 }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)'; }}>{label}</a>)}
        </nav>
        <main style={{ flex: 1, minWidth: 0 }}>
          <Intro />
          <FoundationColor />
          <FoundationViz />
          <FoundationType />
          <FoundationScales />
          <DSSection id="primitives" kicker="Library" title="Primitives" lead="The Radix + CVA base layer. Anatomy, token mapping and every interactive state — default, hover, focus-visible (always the coral ring), active, disabled, selected, error.">
            <CompGrid>
              <PrimButtons />
              <PrimInputs />
              <PrimControls />
              <PrimTabsBadge />
              <PrimFeedback />
              <PrimOverlays />
            </CompGrid>
          </DSSection>
          <DSSection id="finance" kicker="Library" title="Finance components" lead="The domain layer, where the system earns its keep. Money is the atom everything else composes from; every figure is sign-, meaning- and tabular-aware.">
            <CompGrid>
              <FinMoney />
              <FinEnvelopeDebt />
              <FinLedger />
              <FinSignals />
              <FinReadinessSync />
              <FinCharts />
              <FinCardsInsight />
            </CompGrid>
          </DSSection>
          <Deliver />
        </main>
      </div>
    </div>
  );
}

Object.assign(window, { DSApp });
