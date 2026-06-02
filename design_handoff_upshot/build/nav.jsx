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
