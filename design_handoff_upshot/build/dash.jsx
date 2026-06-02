// dash.jsx — Dashboard, two directions + edit mode.
// DashCalm (opinionated default) · DashGrid (configurable bento) · DashEdit (arrange)

// named health state — calm spectrum, current highlighted (not a bare score)
function HealthSpectrum({ current = 2 }) {
  const states = ['Stretched', 'Tight', 'Steady', 'Comfortable', 'Ahead'];
  return (
    <div>
      <div style={{ display: 'flex', gap: 6 }}>
        {states.map((s, i) => {
          const on = i === current;
          return (
            <div key={s} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: 9, whiteSpace: 'nowrap',
              background: on ? 'var(--coral-dim)' : 'var(--surface-2)', border: on ? '1px solid color-mix(in oklch, var(--coral) 32%, transparent)' : '1px solid var(--line)',
              fontSize: 11.5, fontWeight: on ? 700 : 500, color: on ? 'var(--coral)' : 'var(--text-3)' }}>{s}</div>
          );
        })}
      </div>
    </div>
  );
}

function NetWorthMini() {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Label>Net worth</Label>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>Assets <UIcon name="arrowR" size={13} /></span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span className="tnum" style={{ fontSize: 30, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em' }}>$46,760</span>
        <Money n={1240} kind="income" size={13} arrow weight={700} />
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>+2.7% this month</div>
      <div style={{ marginTop: 'auto', paddingTop: 14 }}><Spark points={[40, 41, 40.5, 42, 43, 44, 44.5, 45.5, 46, 46.7]} w={300} h={40} stroke="var(--coral)" fill="color-mix(in oklch, var(--coral) 10%, transparent)" /></div>
    </Card>
  );
}

function ForecastCard() {
  const pts = [10.4, 9.8, 9.2, 10.1, 9.6, 8.9, 9.4, 10.2, 11.1, 10.6, 11.4, 12.2];
  const band = pts.map((_, i) => i < 7 ? 0 : (i - 6) * 0.35);
  return (
    <Card style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Label>Cashflow forecast · 90 days</Label>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--text-3)' }}><span style={{ width: 12, height: 0, borderTop: '2px dashed var(--proj)' }} /> projected band</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '8px 0 4px' }}>
        <Money n={1043} kind="neutral" size={22} weight={700} />
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>balance, 30 days</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', minHeight: 70 }}><Spark points={pts} w={320} h={74} stroke="var(--coral)" sw={2.2} projFrom={7} band={band} fill="color-mix(in oklch, var(--coral) 9%, transparent)" /></div>
      <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 8 }}>90-day low <span className="tnum" style={{ fontFamily: 'var(--font-mono)', color: 'var(--warn)', fontWeight: 700 }}>$210</span> · stays positive</div>
    </Card>
  );
}

function ReadinessCard() {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Label>Emergency-fund readiness</Label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Gauge pct={0.75} value="75%" sub="of goal" color="var(--saved)" size={104} />
        <div style={{ flex: 1 }}>
          <div className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--saved)' }}>$4,500 <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>/ $6,000</span></div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', margin: '3px 0 10px' }}>2.4 months runway</div>
          <Confidence level="on" compact />
        </div>
      </div>
    </Card>
  );
}

function InsightCard({ icon, text, accent = 'var(--coral)' }) {
  return (
    <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '13px 14px', background: 'var(--surface-2)', borderRadius: 'var(--radius-data)', border: '1px solid var(--line-soft)' }}>
      <span style={{ color: accent, flexShrink: 0, marginTop: 1 }}><UIcon name={icon} size={16} /></span>
      <span style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45 }}>{text}</span>
    </div>
  );
}

function EnvGlance() {
  const envs = [['Groceries', 186, 600], ['Transport', 92, 180], ['Fun', -22, 150], ['Bills', 410, 410]];
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <Label>Envelopes</Label><span style={{ fontSize: 11.5, color: 'var(--expense)', fontWeight: 600 }}>Fun overspent</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        {envs.map(([n, b, a]) => { const over = b < 0; const pct = Math.max(0, Math.min(1, b / a)); return (
          <div key={n}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{n}</span>
              <span className="tnum" style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: over ? 'var(--expense)' : 'var(--text-2)', fontWeight: 600 }}>{over ? '−$' + Math.abs(b) : '$' + b}<span style={{ color: 'var(--text-3)', fontWeight: 400 }}> / {a}</span></span>
            </div>
            <div style={{ height: 5, borderRadius: 999, background: 'var(--surface-3)', overflow: 'hidden' }}><div style={{ width: (over ? 100 : pct * 100) + '%', height: '100%', borderRadius: 999, background: over ? 'var(--expense)' : 'linear-gradient(90deg, var(--coral-2), var(--coral))' }} /></div>
          </div>
        ); })}
      </div>
    </Card>
  );
}

function UpcomingCard() {
  const bills = [['Origin Energy', 'Electricity', 3, -142.10], ['Cotton On', 'Afterpay 3/4', 2, -48.75], ['Spotify', 'Subscription', 5, -13.99]];
  return (
    <Card>
      <Label style={{ marginBottom: 12 }}>Coming up</Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {bills.map(([n, s, d, amt]) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span className="tnum" style={{ width: 32, height: 26, borderRadius: 7, background: d <= 2 ? 'color-mix(in oklch, var(--warn) 16%, transparent)' : 'var(--surface-2)', color: d <= 2 ? 'var(--warn)' : 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{d}d</span>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n}</div><div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{s}</div></div>
            <Money n={amt} kind="projected" size={12.5} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function DashCalm() {
  return (
    <div className="up" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)' }}>
      <UpRail active="today" />
      <div style={{ flex: 1, padding: '34px 40px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
        <TopBar title="Evening, Sam." sub="SATURDAY, 2 JUNE" />
        {/* hero: named health state + safe to spend */}
        <Card pad={24} style={{ display: 'flex', gap: 28, alignItems: 'stretch' }}>
          <div style={{ flex: '1 1 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Label style={{ margin: 0 }}>This week</Label>
              <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>spending is in line with a normal week</span>
            </div>
            <HealthSpectrum current={2} />
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: 18 }}>
              <div>
                <Label style={{ marginBottom: 6 }}>Safe to spend · through Sunday</Label>
                <span className="tnum" style={{ fontSize: 46, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em', lineHeight: 0.95 }}>$312<span style={{ fontSize: 26, color: 'var(--text-2)' }}>.40</span></span>
              </div>
            </div>
          </div>
          <div style={{ width: 1, background: 'var(--line-soft)' }} />
          <div style={{ flex: '0 0 196px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, whiteSpace: 'nowrap' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={{ fontSize: 13, color: 'var(--text-2)' }}>In this week</span><Money n={2480} kind="income" size={14} weight={700} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={{ fontSize: 13, color: 'var(--text-2)' }}>Out this week</span><Money n={-1914.6} kind="expense" size={14} weight={700} /></div>
            <div style={{ height: 1, background: 'var(--line-soft)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={{ fontSize: 13, color: 'var(--text-2)' }}>Net</span><Money n={565.4} kind="income" size={16} weight={700} /></div>
          </div>
        </Card>
        {/* row: net worth · forecast · readiness */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>
          <NetWorthMini />
          <ForecastCard />
          <ReadinessCard />
        </div>
        {/* row: envelopes · upcoming · insights */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr 1.1fr', gap: 16, flex: 1, minHeight: 0 }}>
          <EnvGlance />
          <UpcomingCard />
          <Card style={{ display: 'flex', flexDirection: 'column' }}>
            <Label style={{ marginBottom: 12 }}>For you</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <InsightCard icon="trend" text="Groceries are tracking 12% under last month — moving $40 to Emergency Fund keeps you on track." />
              <InsightCard icon="repeat" accent="var(--warn)" text="Your Spotify charge rose $2 in May. Two music subscriptions are active." />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Direction 2: configurable bento ──
function Widget({ title, children, span = 1, rows = 1, editing, onAdd }) {
  return (
    <div style={{ gridColumn: `span ${span}`, gridRow: `span ${rows}`, background: 'var(--surface)', border: editing ? '1px dashed color-mix(in oklch, var(--coral) 45%, transparent)' : '1px solid var(--line)', borderRadius: 'var(--radius-card)', padding: 16, position: 'relative', boxShadow: '0 6px 22px rgba(0,0,0,0.18)' }}>
      {editing && (
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
          <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--surface-3)', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab' }}><UIcon name="drag" size={13} /></span>
          <span style={{ width: 22, height: 22, borderRadius: 6, background: 'color-mix(in oklch, var(--expense) 18%, transparent)', color: 'var(--expense)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>×</span>
        </div>
      )}
      {title && <Label style={{ marginBottom: 10 }}>{title}</Label>}
      {children}
    </div>
  );
}

function DashGrid({ editing = false }) {
  return (
    <div className="up" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)' }}>
      <UpRail active="today" />
      <div style={{ flex: 1, padding: '34px 40px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div><div style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>SATURDAY, 2 JUNE</div><div style={{ fontSize: 27, fontWeight: 600, letterSpacing: '-0.02em' }}>Evening, Sam.</div></div>
          <div style={{ display: 'flex', gap: 10 }}>
            {editing ? (
              <React.Fragment>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 999, border: '1px solid var(--line)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600 }}>Reset to default</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 18px', borderRadius: 999, background: 'var(--coral)', color: '#2a1410', fontSize: 13, fontWeight: 700 }}><UIcon name="check" size={15} /> Done</span>
              </React.Fragment>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 15px', borderRadius: 999, border: '1px solid var(--line)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600 }}><UIcon name="sliders" size={15} /> Arrange</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: '1fr', gap: 14, minHeight: 0, opacity: editing ? 0.96 : 1 }}>
            <Widget span={2} title="Safe to spend · through Sunday" editing={editing}>
              <div className="tnum" style={{ fontSize: 38, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em', marginTop: 2 }}>$312<span style={{ fontSize: 22, color: 'var(--text-2)' }}>.40</span></div>
              <div style={{ marginTop: 10 }}><HealthSpectrum current={2} /></div>
            </Widget>
            <Widget title="Net worth" editing={editing}>
              <div className="tnum" style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>$46.8k</div>
              <div style={{ marginTop: 2 }}><Money n={1240} kind="income" size={11.5} arrow weight={700} /></div>
            </Widget>
            <Widget title="Readiness" editing={editing}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Gauge pct={0.75} value="75%" size={56} thickness={7} color="var(--saved)" /><Confidence level="on" compact /></div>
            </Widget>
            <Widget span={2} title="Cashflow forecast" editing={editing}>
              <div style={{ marginTop: 4 }}><Spark points={[10.4, 9.8, 9.2, 10.1, 9.6, 8.9, 9.4, 10.2, 11.1, 10.6, 11.4, 12.2]} w={300} h={56} stroke="var(--coral)" projFrom={7} band={[0, 0, 0, 0, 0, 0, 0, 0.4, 0.8, 1.1, 1.5, 1.8]} fill="color-mix(in oklch, var(--coral) 9%, transparent)" /></div>
            </Widget>
            <Widget title="Streak" editing={editing}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}><span style={{ color: 'var(--income)' }}><UIcon name="flame" size={20} /></span><span className="tnum" style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>6</span></div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>no-spend days</div>
            </Widget>
            <Widget title="Upcoming" editing={editing}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}><span>Origin</span><Money n={-142.1} kind="projected" size={12} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}><span>Afterpay</span><Money n={-48.75} kind="projected" size={12} /></div>
            </Widget>
            <Widget span={2} title="For you" editing={editing}>
              <InsightCard icon="repeat" accent="var(--warn)" text="Spotify rose $2 in May — and two music subscriptions are active." />
            </Widget>
          </div>
          {editing && (
            <div style={{ width: 232, flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-card)', padding: 16, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Add a widget</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 14 }}>Drag onto the grid</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['pie', 'Category breakdown'], ['merge', 'Money-flow'], ['scale', 'Net-worth trend'], ['calendar', 'Spending heatmap'], ['card', 'Card utilisation'], ['gift', 'Wishlist progress']].map(([ic, t]) => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--line)', cursor: 'grab' }}>
                    <span style={{ color: 'var(--text-3)' }}><UIcon name={ic} size={16} /></span>
                    <span style={{ fontSize: 12.5, fontWeight: 500, flex: 1 }}>{t}</span>
                    <span style={{ color: 'var(--coral-text)' }}><UIcon name="plus" size={15} /></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DashEdit() { return <DashGrid editing />; }

Object.assign(window, { DashCalm, DashGrid, DashEdit, HealthSpectrum, NetWorthMini, ForecastCard, ReadinessCard, InsightCard, EnvGlance, UpcomingCard });
