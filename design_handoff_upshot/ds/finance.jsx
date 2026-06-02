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
