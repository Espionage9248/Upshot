// round3.jsx — Round 3 IA gaps, in the approved Upshot language.
// Settings (gear surface) · Sync & activity · 2Up (Analyze sub-surface).
// Reuses the converged components exported by screens/expansion.jsx.
/*__IIFE_WRAP__*/;(function(){

const { UIcon, Money, Card, Label, Pill, Confidence, Utilisation, Gauge, Spark, Donut, NetWorthTrend } = window;

const MONO = 'var(--font-mono)';
const SAM = 'var(--viz-2)';   // teal — contributor identity
const ALEX = 'var(--viz-4)';  // indigo — contributor identity

/* ───────────────────────── shared chrome ───────────────────────── */

const R3_ROOMS = [['today', 'Today'], ['ledger', 'Money'], ['wallet', 'Budget'], ['plan', 'Plan'], ['look', 'Analyze']];

// Rail with the GEAR active (Settings is reached here, not via a 6th room).
function RailGear({ room = null, gearActive = true }) {
  return (
    <div style={{ width: 84, flexShrink: 0, background: 'var(--bg)', borderRight: '1px solid var(--line-soft)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '22px 0 18px' }}>
      <div style={{ width: 32, height: 32, borderRadius: 11, background: 'radial-gradient(120% 120% at 30% 20%, #ffb199, var(--coral) 55%, #e8553f)', boxShadow: '0 4px 14px rgba(255,112,92,0.34)', marginBottom: 26 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        {R3_ROOMS.map(([id, label]) => {
          const on = id === room;
          return (
            <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 64 }}>
              <div style={{ width: 48, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? 'var(--coral-dim)' : 'transparent', color: on ? 'var(--coral)' : 'var(--text-3)' }}>
                <UIcon name={id} size={21} stroke={on ? 1.9 : 1.6} />
              </div>
              <span style={{ fontSize: 10.5, color: on ? 'var(--coral)' : 'var(--text-3)', fontWeight: on ? 600 : 500 }}>{label}</span>
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 9px', borderRadius: 8, border: '1px solid var(--line)', color: 'var(--text-3)', fontSize: 10.5, marginBottom: 14, fontFamily: MONO }}>⌘K</div>
      <div title="Settings" style={{ width: 48, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, background: gearActive ? 'var(--coral-dim)' : 'transparent', color: gearActive ? 'var(--coral)' : 'var(--text-3)' }}>
        <UIcon name="gear" size={20} stroke={gearActive ? 1.9 : 1.6} />
      </div>
      <div style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', fontWeight: 600, fontSize: 12 }}>SM</div>
    </div>
  );
}

function Crumb({ children }) {
  return <div style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 4 }}>{children}</div>;
}
function H2({ children, style }) {
  return <div style={{ fontSize: 27, fontWeight: 600, letterSpacing: '-0.02em', ...style }}>{children}</div>;
}
function Tag({ children, tone = 'var(--text-3)' }) {
  return <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: tone, padding: '3px 9px', borderRadius: 999, background: `color-mix(in oklch, ${tone} 13%, transparent)`, border: `1px solid color-mix(in oklch, ${tone} 28%, transparent)` }}>{children}</span>;
}
function Toggle({ on }) {
  return <div style={{ width: 38, height: 22, borderRadius: 999, background: on ? 'var(--coral)' : 'var(--surface-3)', padding: 2, display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start', flexShrink: 0 }}><div style={{ width: 18, height: 18, borderRadius: 999, background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }} /></div>;
}
function ToggleRow({ label, sub, on, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: last ? 'none' : '1px solid var(--line-soft)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{sub}</div>}
      </div>
      <Toggle on={on} />
    </div>
  );
}
function Segmented({ options, active }) {
  return (
    <div style={{ display: 'inline-flex', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 999, padding: 3, gap: 2 }}>
      {options.map((o) => { const on = o === active; return <span key={o} style={{ fontSize: 12.5, fontWeight: 600, padding: '6px 14px', borderRadius: 999, color: on ? 'var(--on-coral)' : 'var(--text-3)', background: on ? 'var(--coral)' : 'transparent' }}>{o}</span>; })}
    </div>
  );
}
function GhostBtn({ icon, children }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 36, padding: '0 14px', borderRadius: 'var(--radius-data)', border: '1px solid var(--line)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{icon && <UIcon name={icon} size={15} />}{children}</span>;
}
function PrimaryBtn({ icon, children }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 36, padding: '0 16px', borderRadius: 'var(--radius-data)', background: 'var(--coral)', color: 'var(--on-coral)', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{icon && <UIcon name={icon} size={15} stroke={2.2} />}{children}</span>;
}
function StatusPill({ kind }) {
  const map = { healthy: ['Healthy', 'var(--income)'], syncing: ['Syncing…', 'var(--text-3)'], failed: ['Failed', 'var(--expense)'], token: ['Reconnect', 'var(--warn)'] };
  const [lbl, c] = map[kind] || map.healthy;
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: c, padding: '5px 11px', borderRadius: 999, background: `color-mix(in oklch, ${c} 12%, transparent)`, border: `1px solid color-mix(in oklch, ${c} 26%, transparent)` }}><span style={{ width: 7, height: 7, borderRadius: 999, background: c }} />{lbl}</span>;
}

const SETTINGS_NAV = [
  ['account', 'home', 'Account & profile'],
  ['sync', 'sync', 'Connections & sync'],
  ['budget', 'wallet', 'Budgeting & goals'],
  ['debt', 'card', 'Debts & purchases'],
  ['tax', 'percent', 'Tax'],
  ['data', 'link', 'Data & export'],
  ['activity', 'clock', 'Sync & activity'],
];
function SettingsNav({ active }) {
  return (
    <div style={{ width: 230, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {SETTINGS_NAV.map(([id, ic, label]) => {
        const on = id === active;
        return (
          <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', borderRadius: 10, background: on ? 'var(--coral-dim)' : 'transparent', color: on ? 'var(--coral-text)' : 'var(--text-2)', fontWeight: on ? 600 : 500, boxShadow: on ? 'inset 2px 0 0 var(--coral)' : 'none' }}>
            <UIcon name={ic} size={17} stroke={on ? 1.9 : 1.6} />
            <span style={{ fontSize: 13.5 }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────────────── B1 · Settings surface ───────────────────────── */

function SettingsSurface() {
  return (
    <div className="up" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)' }}>
      <RailGear />
      <div style={{ flex: 1, padding: '34px 40px', display: 'flex', flexDirection: 'column', gap: 22, overflow: 'hidden' }}>
        <div>
          <Crumb>SETTINGS · REACHED VIA ⚙ / ⌘K</Crumb>
          <H2>Settings</H2>
        </div>
        <div style={{ display: 'flex', gap: 28, flex: 1, minHeight: 0 }}>
          <SettingsNav active="sync" />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Connections &amp; sync</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 3 }}>How Upshot pulls your data, how often, and the health of each connection.</div>
            </div>
            {/* bank connection */}
            <Card pad={0}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: 'radial-gradient(120% 120% at 30% 20%, #ffb199, var(--coral) 55%, #e8553f)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ fontSize: 15, fontWeight: 700 }}>Up</span><StatusPill kind="healthy" /></div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>Open Banking · last synced 4m ago · token valid, renews 28 Jun</div>
                </div>
                <GhostBtn icon="sync">Reconnect</GhostBtn>
              </div>
            </Card>
            {/* cadence + automation */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>
              <Card>
                <Label style={{ marginBottom: 12 }}>Sync cadence</Label>
                <Segmented options={['Real-time', 'Hourly', 'Daily']} active="Real-time" />
                <div style={{ marginTop: 8 }}>
                  <ToggleRow label="Only sync on Wi-Fi" sub="Pause syncing on mobile data" on />
                  <ToggleRow label="Notify me if a sync fails" sub="Including expired bank connections" on />
                  <ToggleRow label="Background refresh" sub="Sync while the app is closed" last />
                </div>
              </Card>
              <Card>
                <Label style={{ marginBottom: 12 }}>Detection &amp; automation</Label>
                <ToggleRow label="Auto-detect recurring &amp; fees" sub="Find subscriptions and bank fees" on />
                <ToggleRow label="Auto-categorise with rules" sub="Apply your match rules on import" on />
                <ToggleRow label="Nightly encrypted backup" sub="Local, AES-256 — never leaves device" on last />
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Full activity &amp; job history</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: 'var(--coral-text)' }}>Sync &amp; activity <UIcon name="arrowR" size={13} /></span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── B2 · Sync & activity ───────────────────────── */

function SyncTabs({ active }) {
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line)' }}>
      {['Runs', 'Activity'].map((t) => { const on = t === active; return <div key={t} style={{ padding: '9px 14px', fontSize: 13.5, fontWeight: on ? 700 : 500, color: on ? 'var(--text)' : 'var(--text-3)', borderBottom: on ? '2px solid var(--coral)' : '2px solid transparent', marginBottom: -1 }}>{t}</div>; })}
    </div>
  );
}

function SyncHeader() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Sync &amp; activity</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 10 }}><StatusPill kind="healthy" /> Last sync 4m ago · next in ~2m</div>
      </div>
      <PrimaryBtn icon="sync">Sync now</PrimaryBtn>
    </div>
  );
}

function RunBadge({ kind }) {
  const map = { success: ['Success', 'var(--income)'], running: ['Running', 'var(--text-3)'], failed: ['Failed', 'var(--expense)'], token: ['Token expired', 'var(--warn)'] };
  const [lbl, c] = map[kind] || map.success;
  return <span style={{ fontSize: 10.5, fontWeight: 700, color: c, padding: '3px 9px', borderRadius: 'var(--radius-data)', background: `color-mix(in oklch, ${c} 13%, transparent)`, border: `1px solid color-mix(in oklch, ${c} 26%, transparent)`, whiteSpace: 'nowrap' }}>{lbl}</span>;
}

function RunsTable() {
  const rows = [
    ['sync', 'Transaction sync', 'success', '312 txns · 1 new', '2.1s', '4m ago'],
    ['percent', 'Fee scan', 'success', '2 fees found', '0.4s', '4m ago'],
    ['repeat', 'Recurring detect', 'success', '1 new sub', '0.6s', '4m ago'],
    ['sync', 'Transaction sync', 'token', 'session expired (401)', '—', '1d ago'],
    ['shield', 'Encrypted backup', 'success', '1 file · 4.2 MB', '1.8s', '1d ago'],
    ['sync', 'Transaction sync', 'success', '287 txns', '1.9s', '1d ago'],
  ];
  return (
    <Card pad={0} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.4fr 0.7fr 0.8fr', gap: 12, padding: '11px 18px', borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}>
        {['Job', 'Status', 'Result', 'Duration', 'When'].map((h, i) => <span key={h} style={{ fontSize: 10.5, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, textAlign: i >= 3 ? 'right' : 'left' }}>{h}</span>)}
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.4fr 0.7fr 0.8fr', gap: 12, padding: '13px 18px', borderBottom: '1px solid var(--line-soft)', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ color: 'var(--text-3)' }}><UIcon name={r[0]} size={16} /></span><span style={{ fontSize: 13.5, fontWeight: 600 }}>{r[1]}</span></div>
          <div><RunBadge kind={r[2]} /></div>
          <div style={{ fontSize: 12.5, color: r[2] === 'token' ? 'var(--warn)' : 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8 }}>{r[3]}{r[2] === 'token' && <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--coral-text)' }}>Reconnect</span>}</div>
          <div className="tnum" style={{ fontSize: 12.5, fontFamily: MONO, color: 'var(--text-3)', textAlign: 'right' }}>{r[4]}</div>
          <div className="tnum" style={{ fontSize: 12, fontFamily: MONO, color: 'var(--text-3)', textAlign: 'right' }}>{r[5]}</div>
        </div>
      ))}
    </Card>
  );
}

function SyncRuns() {
  return (
    <div className="up" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)' }}>
      <RailGear />
      <div style={{ flex: 1, padding: '34px 40px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
        <div><Crumb>SETTINGS › SYNC &amp; ACTIVITY</Crumb><H2>Sync &amp; activity</H2></div>
        <SyncHeader />
        <SyncTabs active="Runs" />
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Machine job history — every sync, fee scan, detection and backup run, with counts, errors and timing.</div>
        <RunsTable />
      </div>
    </div>
  );
}

function ActivityRow({ icon, accent, children, time, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '14px 0', borderBottom: last ? 'none' : '1px solid var(--line-soft)' }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: `color-mix(in oklch, ${accent} 13%, transparent)`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><UIcon name={icon} size={16} /></div>
      <div style={{ flex: 1, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.45 }}>{children}</div>
      <div className="tnum" style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: MONO, whiteSpace: 'nowrap', marginTop: 2 }}>{time}</div>
    </div>
  );
}

function SyncActivity() {
  const B = (t) => <b style={{ color: 'var(--text)', fontWeight: 600 }}>{t}</b>;
  return (
    <div className="up" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)' }}>
      <RailGear />
      <div style={{ flex: 1, padding: '34px 40px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
        <div><Crumb>SETTINGS › SYNC &amp; ACTIVITY</Crumb><H2>Sync &amp; activity</H2></div>
        <SyncHeader />
        <SyncTabs active="Activity" />
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>User-facing log — the decisions you made, in plain language. (Machine runs live under the Runs tab.)</div>
        <Card style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <ActivityRow icon="flag" accent="var(--coral)" time="2h ago">Flagged {B('Officeworks · $89.00')} as a tax deduction</ActivityRow>
          <ActivityRow icon="pause" accent="var(--transfer)" time="5h ago">Paused subscription {B('Disney+')}</ActivityRow>
          <ActivityRow icon="tag" accent="var(--income)" time="Yesterday">Created rule — merchant contains {B('“woolworths”')} → {B('Groceries')}</ActivityRow>
          <ActivityRow icon="swap" accent="var(--transfer)" time="Yesterday">Marked {B('$200 to Emergency Fund')} as a transfer</ActivityRow>
          <ActivityRow icon="wallet" accent="var(--saved)" time="2d ago">Edited budget — {B('Groceries')} $600 → {B('$650')}</ActivityRow>
          <ActivityRow icon="sync" accent="var(--warn)" time="3d ago" last>Reconnected {B('Up')} after an expired session</ActivityRow>
        </Card>
      </div>
    </div>
  );
}

/* ───────────────────────── B3 · 2Up sub-surface ───────────────────────── */

function Avatar({ name, color, size = 26 }) {
  return <span style={{ width: size, height: size, borderRadius: 999, background: `color-mix(in oklch, ${color} 22%, transparent)`, border: `1.5px solid ${color}`, color: color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42, fontWeight: 700, flexShrink: 0 }}>{name[0]}</span>;
}

// horizontal value bar scaled to a shared max
function VBar({ v, max, color }) {
  return <div style={{ height: 7, borderRadius: 999, background: 'var(--surface-3)', overflow: 'hidden' }}><div style={{ width: Math.max(2, (v / max) * 100) + '%', height: '100%', borderRadius: 999, background: color }} /></div>;
}

function ContributorPanel({ name, color, inV, outV, max }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}><Avatar name={name} color={color} size={30} /><span style={{ fontSize: 15, fontWeight: 700 }}>{name}</span></div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}><span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600 }}>Put in</span><Money n={inV} kind="income" size={13.5} weight={700} /></div>
        <VBar v={inV} max={max} color="var(--income)" />
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}><span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600 }}>Spent</span><Money n={-outV} kind="expense" size={13.5} weight={700} /></div>
        <VBar v={outV} max={max} color="var(--expense)" />
      </div>
      <div style={{ marginTop: 13, paddingTop: 11, borderTop: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600 }}>Net contributed</span>
        <Money n={inV - outV} kind="saved" size={14} weight={700} />
      </div>
    </div>
  );
}

// two-segment split bar (Sam vs Alex)
function SplitBar({ a, b, ca, cb }) {
  const tot = a + b;
  return <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', background: 'var(--surface-3)' }}><div style={{ width: (a / tot) * 100 + '%', background: ca }} /><div style={{ width: (b / tot) * 100 + '%', background: cb }} /></div>;
}

// per-category, who spent where (Sam vs Alex bars)
function CatSplit({ name, sam, alex, max }) {
  const tot = sam + alex;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 90px', gap: 14, alignItems: 'center', padding: '11px 0', borderBottom: '1px solid var(--line-soft)' }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{name}</span>
      <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: 'var(--surface-3)' }}>
        <div title={`Sam $${sam}`} style={{ width: (sam / max) * 100 + '%', background: SAM }} />
        <div title={`Alex $${alex}`} style={{ width: (alex / max) * 100 + '%', background: ALEX }} />
      </div>
      <span className="tnum" style={{ fontSize: 12.5, fontFamily: MONO, fontWeight: 700, textAlign: 'right' }}>${tot.toLocaleString()}</span>
    </div>
  );
}

function StatCard({ label, value, sub, kind, accent }) {
  return (
    <Card pad={18} style={accent ? { borderTop: `2px solid ${accent}` } : null}>
      <Label>{label}</Label>
      {kind ? <div style={{ marginTop: 7 }}><Money n={value} kind={kind} size={27} weight={700} /></div>
        : <div className="tnum" style={{ fontSize: 28, fontWeight: 700, fontFamily: MONO, marginTop: 7, letterSpacing: '-0.02em' }}>{value}</div>}
      {sub && <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>{sub}</div>}
    </Card>
  );
}

function TwoUpOverview() {
  const max = 34200; // shared scale for in/out bars
  const cats = [['Housing', 7100, 7100], ['Groceries', 3600, 3200], ['Travel', 1800, 3400], ['Dining', 1600, 2500], ['Utilities', 1200, 1200], ['Other', 500, 1200]];
  const catMax = Math.max(...cats.map(([, s, a]) => s + a));
  return (
    <div className="up" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)' }}>
      <UpRail active="look" />
      <div style={{ flex: 1, padding: '34px 40px', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <Crumb>ANALYZE › 2UP · JOINT ACCOUNT</Crumb>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><H2>Sam &amp; Alex</H2><Tag>Historical</Tag><Tag>Read-only</Tag></div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 6 }}>Jul 2022 – Mar 2025 · closed · 1,284 transactions</div>
          </div>
          <GhostBtn icon="ledger">Open ledger</GhostBtn>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <StatCard label="Total put in" value={65700} kind="income" sub="across both people" accent="var(--income)" />
          <StatCard label="Total spent" value={-34400} kind="expense" sub="over 33 months" accent="var(--expense)" />
          <StatCard label="Distributed at close" value="$31,300" sub="returned 50 / 50" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>
          {/* money in vs out per person — the heart */}
          <Card style={{ display: 'flex', flexDirection: 'column' }}>
            <Label style={{ marginBottom: 16 }}>Money in vs out · per person</Label>
            <div style={{ display: 'flex', gap: 28 }}>
              <ContributorPanel name="Sam" color={SAM} inV={34200} outV={15800} max={max} />
              <div style={{ width: 1, background: 'var(--line-soft)' }} />
              <ContributorPanel name="Alex" color={ALEX} inV={31500} outV={18600} max={max} />
            </div>
            <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-2)', borderRadius: 'var(--radius-data)', padding: '13px 15px' }}>
              <span style={{ color: 'var(--warn)', flexShrink: 0 }}><UIcon name="scale" size={20} /></span>
              <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45 }}>Spending split evenly, <b style={{ color: 'var(--text)' }}>Alex spent $1,400 over half</b> — Sam was owed <b style={{ color: 'var(--text)' }}>$1,400</b>, settled at close.</div>
            </div>
          </Card>

          {/* who contributed */}
          <Card style={{ display: 'flex', flexDirection: 'column' }}>
            <Label style={{ marginBottom: 16 }}>Who contributed</Label>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}><Avatar name="Sam" color={SAM} size={22} /> Sam <span className="tnum" style={{ color: 'var(--text-3)', fontWeight: 600 }}>52%</span></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}><span className="tnum" style={{ color: 'var(--text-3)', fontWeight: 600 }}>48%</span> Alex <Avatar name="Alex" color={ALEX} size={22} /></span>
            </div>
            <SplitBar a={34200} b={31500} ca={SAM} cb={ALEX} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <Money n={34200} kind="income" size={13} weight={700} />
              <Money n={31500} kind="income" size={13} weight={700} />
            </div>
            <div style={{ marginTop: 'auto', paddingTop: 18, borderTop: '1px solid var(--line-soft)' }}>
              <Label style={{ marginBottom: 10 }}>Contribution rhythm</Label>
              <Spark points={[2.4, 2.5, 2.5, 2.6, 2.4, 2.7, 2.6, 2.8, 2.7, 2.9, 2.8, 3.0]} w={300} h={48} stroke="var(--coral)" fill="color-mix(in oklch, var(--coral) 8%, transparent)" />
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 6 }}>~$2,650 / month combined, steady to close</div>
            </div>
          </Card>
        </div>

        {/* where it went, who spent where */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Label>Where it went · who spent where</Label>
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-2)', fontWeight: 600 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: SAM }} /> Sam</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-2)', fontWeight: 600 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: ALEX }} /> Alex</span>
            </div>
          </div>
          {cats.map(([n, s, a]) => <CatSplit key={n} name={n} sam={s} alex={a} max={catMax} />)}
        </Card>
      </div>
    </div>
  );
}

/* 2Up · explorable ledger */
function FilterChip({ label, value, active }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 34, padding: '0 12px', borderRadius: 'var(--radius-data)', border: active ? '1px solid color-mix(in oklch, var(--coral) 34%, transparent)' : '1px solid var(--line)', background: active ? 'var(--coral-dim)' : 'transparent', color: active ? 'var(--coral-text)' : 'var(--text-2)', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ color: active ? 'var(--coral-text)' : 'var(--text-3)' }}>{label}</span> {value} <UIcon name="chevron" size={13} style={{ transform: 'rotate(90deg)', opacity: 0.7 }} />
    </span>
  );
}
function TUpRow({ who, color, merchant, sub, cat, catColor, date, n, kind }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1.6fr 1fr 0.9fr auto', gap: 14, alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid var(--line-soft)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={who} color={color} size={24} /><span style={{ fontSize: 13, fontWeight: 600 }}>{who}</span></div>
      <div style={{ minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{merchant}</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</div></div>
      <div><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-2)', fontWeight: 600 }}><span style={{ width: 7, height: 7, borderRadius: 999, background: catColor }} />{cat}</span></div>
      <div className="tnum" style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: MONO }}>{date}</div>
      <div style={{ textAlign: 'right' }}><Money n={n} kind={kind} size={13.5} weight={700} /></div>
    </div>
  );
}

function TwoUpLedger() {
  const rows = [
    ['Alex', ALEX, 'Salary deposit', 'Contribution', 'Income', 'var(--income)', '1 Mar 25', 2600, 'income'],
    ['Sam', SAM, 'Coles', 'Weekly shop', 'Groceries', 'var(--viz-2)', '28 Feb 25', -142.30, 'expense'],
    ['Sam', SAM, 'Salary deposit', 'Contribution', 'Income', 'var(--income)', '26 Feb 25', 2850, 'income'],
    ['Alex', ALEX, 'Qantas', 'Flights — Cairns', 'Travel', 'var(--viz-4)', '24 Feb 25', -612.00, 'expense'],
    ['Alex', ALEX, 'Origin Energy', 'Electricity', 'Utilities', 'var(--viz-5)', '22 Feb 25', -180.40, 'expense'],
    ['Sam', SAM, 'The Grounds', 'Dinner', 'Dining', 'var(--viz-3)', '20 Feb 25', -88.50, 'expense'],
    ['Sam', SAM, 'Rent — agent', 'Monthly rent', 'Housing', 'var(--viz-1)', '1 Feb 25', -1650.00, 'expense'],
    ['Alex', ALEX, 'Woolworths', 'Top-up shop', 'Groceries', 'var(--viz-2)', '30 Jan 25', -76.20, 'expense'],
    ['Sam', SAM, 'Refund — Booking.com', 'Cancelled stay', 'Travel', 'var(--viz-4)', '28 Jan 25', 240.00, 'income'],
  ];
  return (
    <div className="up" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)' }}>
      <UpRail active="look" />
      <div style={{ flex: 1, padding: '34px 40px', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div><Crumb>ANALYZE › 2UP › TRANSACTIONS</Crumb><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><H2>2Up · Transactions</H2><Tag>Read-only</Tag></div></div>
          <GhostBtn icon="trend">Back to overview</GhostBtn>
        </div>
        {/* filter toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, height: 38, padding: '0 14px', borderRadius: 'var(--radius-data)', border: '1px solid var(--line)', background: 'var(--surface-2)', flex: '1 1 240px', minWidth: 200 }}>
            <UIcon name="search" size={16} style={{ color: 'var(--text-3)' }} /><span style={{ fontSize: 13, color: 'var(--text-3)' }}>Search merchant, note, amount…</span>
          </div>
          <FilterChip label="Person" value="All" active />
          <FilterChip label="Category" value="All" />
          <FilterChip label="Date" value="All time" />
          <FilterChip label="Amount" value="Any" />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', borderRadius: 'var(--radius-data)', border: '1px solid var(--line)', color: 'var(--text-3)', fontSize: 12.5, fontWeight: 600 }}><UIcon name="filter" size={14} /> Newest</span>
        </div>
        <Card pad={0} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1.6fr 1fr 0.9fr auto', gap: 14, padding: '11px 18px', borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}>
            {['Person', 'Merchant', 'Category', 'Date', 'Amount'].map((h, i) => <span key={h} style={{ fontSize: 10.5, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, textAlign: i === 4 ? 'right' : 'left' }}>{h}</span>)}
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {rows.map((r, i) => <TUpRow key={i} who={r[0]} color={r[1]} merchant={r[2]} sub={r[3]} cat={r[4]} catColor={r[5]} date={r[6]} n={r[7]} kind={r[8]} />)}
          </div>
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Showing 9 of 1,284 · full searchable history</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: 'var(--coral-text)' }}>Load more <UIcon name="down" size={13} /></span>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ───────────────────────── IA recommendation board ───────────────────────── */

function MiniRail() {
  const rooms = [['today', 'Today'], ['ledger', 'Money'], ['wallet', 'Budget'], ['plan', 'Plan'], ['look', 'Analyze']];
  return (
    <div style={{ width: 76, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0 14px', gap: 10 }}>
      <div style={{ width: 26, height: 26, borderRadius: 9, background: 'radial-gradient(120% 120% at 30% 20%, #ffb199, var(--coral) 55%, #e8553f)', marginBottom: 6 }} />
      {rooms.map(([id, l]) => (
        <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ width: 40, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}><UIcon name={id} size={18} /></div>
          <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 500 }}>{l}</span>
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ width: 44, height: 36, borderRadius: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, background: 'var(--coral-dim)', color: 'var(--coral)', border: '1px solid color-mix(in oklch, var(--coral) 34%, transparent)' }}>
        <UIcon name="gear" size={17} stroke={2} /><span style={{ fontSize: 7.5, fontWeight: 700 }}>Settings</span>
      </div>
    </div>
  );
}

function IABoard() {
  const homes = [
    ['gear', 'Settings', 'A full surface behind the gear (+ ⌘K). Holds account, connections & sync, budgeting/debt/tax prefs, data export, and Sync & activity.'],
    ['clock', 'Sync & activity', 'A section inside Settings, split into two tabs: Runs (machine job history) and Activity (your plain-language log).'],
    ['look', '2Up — joint account', 'A read-only sub-surface under Analyze: a first-class explorable ledger plus per-contributor money-in-vs-out analytics.'],
  ];
  return (
    <div className="up" style={{ width: '100%', height: '100%', background: 'var(--bg)', padding: 40, display: 'flex', flexDirection: 'column', gap: 22, overflow: 'hidden' }}>
      <div>
        <Crumb>ROUND 3 · IA RECOMMENDATION</Crumb>
        <H2 style={{ fontSize: 30 }}>Settings is the gear, not a sixth room</H2>
        <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.55, margin: '12px 0 0', maxWidth: 720 }}>
          The rail stays at five so it survives a phone — that principle is load-bearing. Settings is a deliberate, infrequent
          destination and too heavy for a status-only gear popover, so it earns a <b style={{ color: 'var(--text)' }}>full surface reached from the gear</b> (and ⌘K). On a phone it's reached from the avatar / overflow, never the bottom bar.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 28, flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flexShrink: 0 }}>
          <MiniRail />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, maxWidth: 150 }}>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}><b style={{ color: 'var(--text)' }}>Five rooms</b> for daily work.</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>The <b style={{ color: 'var(--coral-text)' }}>gear</b> opens Settings as its own surface — not a sixth tab competing for the rail.</div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {homes.map(([ic, t, body]) => (
            <div key={t} style={{ display: 'flex', gap: 14, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-card)', padding: 18, boxShadow: 'var(--elev-1)' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--coral-dim)', color: 'var(--coral-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><UIcon name={ic} size={19} /></div>
              <div><div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{t}</div><div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>{body}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SettingsSurface, SyncRuns, SyncActivity, TwoUpOverview, TwoUpLedger, IABoard });

})();
