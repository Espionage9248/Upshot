// surfaces.jsx — Net worth · Recurring intelligence · Analytics · Tax time.

function AssetRow({ icon, name, type, value, delta, manual, util }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--line-soft)' }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', flexShrink: 0 }}><UIcon name={icon} size={19} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>{name}</span>
          {manual && <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-3)', padding: '2px 6px', borderRadius: 5, border: '1px solid var(--line)' }}>MANUAL</span>}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>{type}</div>
        {util && <div style={{ marginTop: 8, maxWidth: 230 }}><Utilisation used={util[0]} limit={util[1]} /></div>}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="tnum" style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>${value.toLocaleString()}</div>
        {delta != null && <div style={{ marginTop: 2 }}><Money n={delta} kind={delta >= 0 ? 'income' : 'debt'} size={11.5} arrow weight={600} /></div>}
      </div>
    </div>
  );
}

function NetWorth() {
  return (
    <div className="up" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)' }}>
      <UpRail active="plan" />
      <div style={{ flex: 1, padding: '34px 40px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
        <TopBar title="Net worth" sub="ASSETS − DEBTS · UPDATED TODAY" />
        <Card pad={22} style={{ display: 'flex', gap: 28 }}>
          <div style={{ flex: '0 0 230px' }}>
            <Label>Total net worth</Label>
            <div className="tnum" style={{ fontSize: 44, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em', margin: '8px 0 6px' }}>$46,760</div>
            <Money n={1240} kind="income" size={14} arrow weight={700} /><span style={{ fontSize: 12.5, color: 'var(--text-3)', marginLeft: 8 }}>+2.7% this month</span>
            <div style={{ display: 'flex', gap: 7, marginTop: 18 }}>
              {['3M', '6M', '1Y', 'All'].map((t, i) => <span key={t} style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, background: i === 2 ? 'var(--coral-dim)' : 'transparent', color: i === 2 ? 'var(--coral)' : 'var(--text-3)', border: i === 2 ? '1px solid color-mix(in oklch, var(--coral) 30%, transparent)' : '1px solid var(--line)' }}>{t}</span>)}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
              {[['Assets', 'var(--saved)', '$55.0k'], ['Debts', 'var(--debt)', '$8.2k'], ['Net', 'var(--coral)', '$46.8k']].map(([l, c, v]) => (
                <div key={l}><div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}</div><div className="tnum" style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: 3 }}>{v}</div></div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}><NetWorthTrend w={620} h={210} /></div>
        </Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>
          <Card pad={0}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 12px' }}>
              <Label>Assets · $55,000</Label>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--coral-text)' }}><UIcon name="plus" size={14} /> Add asset</span>
            </div>
            <AssetRow icon="wallet" name="Up Savers" type="Bank · auto-synced" value={4500} delta={200} />
            <AssetRow icon="trend" name="Superannuation" type="AustralianSuper" value={28200} delta={640} manual />
            <AssetRow icon="scale" name="Investments" type="Stake · CommSec" value={9800} delta={-180} manual />
            <AssetRow icon="building" name="Car" type="2019 Mazda 3 · est." value={12500} delta={-120} manual />
          </Card>
          <Card pad={0}>
            <div style={{ padding: '16px 16px 12px' }}><Label>Debts · $8,240</Label></div>
            <AssetRow icon="flame" name="Car loan" type="3.1% · clear Mar ’27" value={6240} delta={-450} />
            <AssetRow icon="card" name="Visa credit card" type="18.9% · $612 due" value={2000} delta={-162} util={[1240, 2000]} />
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Recurring intelligence ──
function SubRow({ name, cat, monthly, next, perUse, drift, overlap, paused }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr 0.9fr 0.9fr', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: '1px solid var(--line-soft)', opacity: paused ? 0.55 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{name[0]}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>{name}</span>
            {drift && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: 'var(--warn)', padding: '2px 6px', borderRadius: 6, background: 'color-mix(in oklch, var(--warn) 14%, transparent)' }}><UIcon name="up" size={10} stroke={2.6} />+${drift}</span>}
            {overlap && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--transfer)', padding: '2px 6px', borderRadius: 6, background: 'color-mix(in oklch, var(--transfer) 14%, transparent)' }}>OVERLAP</span>}
            {paused && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', padding: '2px 6px', borderRadius: 6, border: '1px solid var(--line)' }}>PAUSED</span>}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>{cat} · next {next}</div>
        </div>
      </div>
      <div className="tnum" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700 }}>${monthly.toFixed(2)}<span style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 400 }}>/mo</span></div>
      <div className="tnum" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-2)' }}>${(monthly * 12).toFixed(0)}<span style={{ fontSize: 10, color: 'var(--text-3)' }}>/yr</span></div>
      <div style={{ textAlign: 'right', fontSize: 12, color: perUse.warn ? 'var(--warn)' : 'var(--text-2)' }}><span className="tnum" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>${perUse.v}</span><div style={{ fontSize: 10, color: 'var(--text-3)' }}>{perUse.label}</div></div>
    </div>
  );
}

function Recurring() {
  return (
    <div className="up" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)' }}>
      <UpRail active="plan" />
      <div style={{ flex: 1, padding: '34px 40px', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        <TopBar title="Recurring" sub="BILLS & SUBSCRIPTIONS" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <Card pad={16}><Label>Monthly commitment</Label><div className="tnum" style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: 6 }}>$486.40</div><div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>11 active · 2 paused · $5,837/yr</div></Card>
          <Card pad={16} style={{ borderLeft: '2px solid var(--warn)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--warn)', marginBottom: 7 }}><UIcon name="up" size={16} stroke={2.4} /><Label style={{ color: 'var(--warn)' }}>Price drift</Label></div><div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.4 }}><b style={{ color: 'var(--text)' }}>Spotify +$2.00</b> and <b style={{ color: 'var(--text)' }}>Netflix +$3.00</b> rose since March.</div></Card>
          <Card pad={16} style={{ borderLeft: '2px solid var(--transfer)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--transfer)', marginBottom: 7 }}><UIcon name="merge" size={16} /><Label style={{ color: 'var(--transfer)' }}>Overlap</Label></div><div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.4 }}>Two <b style={{ color: 'var(--text)' }}>music</b> services active — $16.98/mo combined.</div></Card>
        </div>
        <Card pad={0} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr 0.9fr 0.9fr', gap: 12, padding: '11px 16px', borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}>
            {['Service', 'Monthly', 'Annual', 'Cost / use'].map((h, i) => <span key={h} style={{ fontSize: 10.5, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, textAlign: i ? 'right' : 'left' }}>{h}</span>)}
          </div>
          <SubRow name="Spotify" cat="Music" monthly={13.99} next="5 Jun" drift={2} overlap perUse={{ v: '0.47', label: '30×/mo', warn: false }} />
          <SubRow name="Apple Music" cat="Music" monthly={12.99} next="12 Jun" overlap perUse={{ v: '6.50', label: '2×/mo', warn: true }} />
          <SubRow name="Netflix" cat="Streaming" monthly={22.99} next="8 Jun" drift={3} perUse={{ v: '2.87', label: '8×/mo', warn: false }} />
          <SubRow name="Adobe CC" cat="Software" monthly={21.99} next="20 Jun" perUse={{ v: '1.10', label: '20×/mo', warn: false }} />
          <SubRow name="Gym — Anytime" cat="Health" monthly={64.00} next="1 Jul" perUse={{ v: '32.00', label: '2×/mo', warn: true }} />
          <SubRow name="iCloud 2TB" cat="Storage" monthly={12.49} next="14 Jun" perUse={{ v: '0.42', label: 'daily', warn: false }} />
          <SubRow name="Disney+" cat="Streaming" monthly={13.99} next="—" paused perUse={{ v: '—', label: 'paused', warn: false }} />
        </Card>
      </div>
    </div>
  );
}

// ── Analytics ──
function Analytics() {
  return (
    <div className="up" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)' }}>
      <UpRail active="look" />
      <div style={{ flex: 1, padding: '34px 40px', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        <TopBar title="Analytics" sub="MAY · MONTH TO DATE" />
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>
          <Card style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Label>Spending heatmap · May</Label>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: 'var(--income)' }}><UIcon name="flame" size={15} /> 6-day no-spend streak</span>
            </div>
            <div style={{ display: 'flex', gap: 22 }}>
              <Heatmap cell={34} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }}>
                <div><div className="tnum" style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>11</div><div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>no-spend days this month</div></div>
                <div><div className="tnum" style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>$124</div><div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>avg / spending day</div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--text-3)' }}><span style={{ width: 14, height: 14, borderRadius: 4, border: '1px dashed var(--line)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ width: 3, height: 3, borderRadius: 999, background: 'var(--text-3)' }} /></span> no-spend day</div>
              </div>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Label>Auto-insights</Label>
              <InsightCard icon="trend" text="Your biggest spend day was Friday 24th ($480) — mostly the quarterly car service." />
              <InsightCard icon="zero" accent="var(--income)" text="Weekends now average 28% less than January — the no-spend habit is sticking." />
            </div>
          </Card>
          <Card style={{ display: 'flex', flexDirection: 'column' }}>
            <Label style={{ marginBottom: 14 }}>Where it went · May</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ position: 'relative' }}><Donut size={130} /><div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><span className="tnum" style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>$3.8k</span><span style={{ fontSize: 9.5, color: 'var(--text-3)' }}>spent</span></div></div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[['Housing', 42, 'var(--viz-1)'], ['Food', 18, 'var(--viz-2)'], ['Lifestyle', 16, 'var(--viz-4)'], ['Transport', 12, 'var(--viz-3)'], ['Bills', 12, 'var(--viz-5)']].map(([n, v, c]) => (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: c, flexShrink: 0 }} /><span style={{ fontSize: 12.5, flex: 1 }}>{n}</span><span className="tnum" style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-2)', fontWeight: 600 }}>{v}%</span></div>
                ))}
              </div>
            </div>
            <div style={{ height: 1, background: 'var(--line-soft)', margin: '18px 0' }} />
            <Label style={{ marginBottom: 12 }}>Month over month</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[['Total spend', -3829, -212, 'expense'], ['Income', 4960, 300, 'income'], ['Saved', 770, 120, 'saved']].map(([l, v, d, k]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{l}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Money n={v} kind={k} size={13.5} weight={700} /><span style={{ fontSize: 11, color: 'var(--text-3)', width: 70, textAlign: 'right' }} className="tnum">{d >= 0 ? '▲' : '▼'} ${Math.abs(d)} MoM</span></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Tax time ──
function TaxTime() {
  const rows = [['Home office', 'WFH running costs', 1240, 12], ['Vehicle', 'Logbook 18%', 980, 7], ['Tools & equipment', 'Depreciation', 640, 4], ['Professional dev', 'Courses, books', 420, 3], ['Donations', 'DGR receipts', 180, 2]];
  return (
    <div className="up" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)' }}>
      <UpRail active="look" />
      <div style={{ flex: 1, padding: '34px 40px', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>ANALYZE · FY 2025–26 · 27 DAYS TO EOFY</div>
            <div style={{ fontSize: 27, fontWeight: 600, letterSpacing: '-0.02em' }}>Tax time</div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 15px', borderRadius: 999, border: '1px solid var(--line)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600 }}><UIcon name="flag" size={15} /> Flag a transaction</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <Card pad={18} style={{ borderTop: '2px solid var(--coral)' }}><Label>Deductible total</Label><div className="tnum" style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: 6 }}>$3,460</div><div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>28 flagged transactions</div></Card>
          <Card pad={18} style={{ borderTop: '2px solid var(--income)' }}><Label>Est. deduction benefit</Label><div style={{ marginTop: 6 }}><Money n={1142} kind="income" size={28} weight={700} arrow={false} /></div><div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>at 32.5% marginal rate</div></Card>
          <Card pad={18}><Label>Est. refund position</Label><div className="tnum" style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: 6, color: 'var(--income)' }}>+$2,310</div><div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>estimate · not advice</div></Card>
        </div>
        <Card pad={0} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <Label>Deductible by category</Label>
            <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Estimate only · confirm with your accountant</span>
          </div>
          {rows.map(([n, s, v, c]) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--line-soft)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--coral-text)', flexShrink: 0 }}><UIcon name="flag" size={17} /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>{n}</div><div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{s} · {c} transactions</div></div>
              <div className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700 }}>${v.toLocaleString()}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { NetWorth, Recurring, Analytics, TaxTime });
