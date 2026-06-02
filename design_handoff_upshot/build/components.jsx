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
