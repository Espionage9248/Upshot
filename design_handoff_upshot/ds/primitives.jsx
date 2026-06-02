// ds/primitives.jsx — primitive library, rendered with states + Radix/CVA notes.

function Comp({ title, radix, children, notes, span = 1 }) {
  return (
    <div style={{ gridColumn: `span ${span}`, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-card)', padding: 20, boxShadow: 'var(--elev-1)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
        {radix && <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>{radix}</span>}
      </div>
      {children}
      {notes && <div style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.45, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--line-soft)' }}>{notes}</div>}
    </div>
  );
}
function StateLabel({ children }) { return <div style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, marginBottom: 9, marginTop: 4 }}>{children}</div>; }

function Btn({ variant = 'primary', size = 'md', state, children }) {
  const sz = { sm: ['0 12px', 32, 12.5], md: ['0 16px', 38, 13.5], lg: ['0 20px', 44, 14.5] }[size];
  const base = { display: 'inline-flex', alignItems: 'center', gap: 7, height: sz[1], padding: sz[0], fontSize: sz[2], fontWeight: 600, fontFamily: 'var(--font-sans)', borderRadius: 'var(--radius-data)', border: '1px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all var(--duration-fast) var(--ease-out)' };
  const variants = {
    primary: { background: 'var(--coral)', color: 'var(--on-coral)' },
    secondary: { background: 'var(--surface-2)', color: 'var(--text)', borderColor: 'var(--line)' },
    ghost: { background: 'transparent', color: 'var(--text-2)' },
    danger: { background: 'color-mix(in oklch, var(--expense) 14%, transparent)', color: 'var(--expense)', borderColor: 'color-mix(in oklch, var(--expense) 30%, transparent)' },
  };
  let s = { ...base, ...variants[variant] };
  if (state === 'hover') s.filter = 'brightness(1.08)';
  if (state === 'active') s.transform = 'translateY(1px)';
  if (state === 'focus') { s.outline = '2px solid var(--focus)'; s.outlineOffset = '2px'; }
  if (state === 'disabled') { s.opacity = 0.42; s.cursor = 'not-allowed'; }
  return <button style={s}>{children}</button>;
}

function PrimButtons() {
  return (
    <Comp title="Button" radix="<button> + cva({variant,size})" span={2}
      notes="Variants: primary · secondary · ghost · danger. Sizes: sm 32 / md 38 / lg 44 (≥44 hit-target on touch). States: default · hover (brightness) · active (1px nudge) · focus-visible (coral ring) · disabled (0.42, no pointer). Loading swaps the leading icon for a spinner and disables.">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <StateLabel>Variants · md</StateLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Btn variant="primary"><Icon name="plus" size={15} /> Add</Btn>
            <Btn variant="secondary">Edit</Btn>
            <Btn variant="ghost">Cancel</Btn>
            <Btn variant="danger">Delete</Btn>
          </div>
          <StateLabel>Sizes</StateLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Btn size="sm">Small</Btn><Btn size="md">Medium</Btn><Btn size="lg">Large</Btn>
          </div>
        </div>
        <div>
          <StateLabel>States · primary</StateLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Btn>Default</Btn><Btn state="hover">Hover</Btn><Btn state="active">Active</Btn><Btn state="focus">Focus</Btn><Btn state="disabled">Disabled</Btn>
          </div>
        </div>
      </div>
    </Comp>
  );
}

function Field({ state, value, placeholder, label }) {
  const s = { width: '100%', height: 38, padding: '0 12px', fontSize: 13.5, fontFamily: 'var(--font-sans)', color: value ? 'var(--text)' : 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--radius-data)', outline: 'none' };
  if (state === 'focus') { s.borderColor = 'var(--focus)'; s.boxShadow = '0 0 0 3px color-mix(in oklch, var(--coral) 22%, transparent)'; }
  if (state === 'error') { s.borderColor = 'var(--expense)'; }
  if (state === 'disabled') { s.opacity = 0.5; }
  return (
    <div>
      {label && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>{label}</div>}
      <div style={{ ...s, display: 'flex', alignItems: 'center' }}>{value || placeholder}{state === 'focus' && <span style={{ width: 1.5, height: 16, background: 'var(--coral)', marginLeft: 1 }} />}</div>
      {state === 'error' && <div style={{ fontSize: 11.5, color: 'var(--expense)', marginTop: 5 }}>Enter a valid amount.</div>}
    </div>
  );
}

function PrimInputs() {
  return (
    <Comp title="Input · Select · Textarea" radix="Label + control + cva(state)" notes="States: default · focus (coral ring) · error (expense border + message) · disabled. Selects use Radix Select; the trigger matches input metrics. Money inputs render mono + right-align.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Default" placeholder="Search merchants…" />
        <Field label="Focus" value="Woolworths" state="focus" />
        <Field label="Error" value="—" state="error" />
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Select</div>
          <div style={{ height: 38, padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--radius-data)', fontSize: 13.5 }}>Groceries <Icon name="chevron" size={14} style={{ transform: 'rotate(90deg)', color: 'var(--text-3)' }} /></div>
        </div>
      </div>
    </Comp>
  );
}

function Toggle({ on }) {
  return <div style={{ width: 38, height: 22, borderRadius: 999, background: on ? 'var(--coral)' : 'var(--surface-3)', padding: 2, display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start', transition: 'all var(--duration-fast) var(--ease-out)' }}><div style={{ width: 18, height: 18, borderRadius: 999, background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }} /></div>;
}
function PrimControls() {
  return (
    <Comp title="Switch · Slider · Checkbox" radix="Radix Switch / Slider / Checkbox">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Toggle on /><span style={{ fontSize: 13 }}>On</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Toggle /><span style={{ fontSize: 13, color: 'var(--text-2)' }}>Off</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.45 }}><Toggle on /><span style={{ fontSize: 13 }}>Disabled</span></div>
        </div>
        <div>
          <div style={{ height: 5, borderRadius: 999, background: 'var(--surface-3)', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '62%', background: 'var(--coral)', borderRadius: 999 }} />
            <div style={{ position: 'absolute', left: '62%', top: '50%', transform: 'translate(-50%,-50%)', width: 16, height: 16, borderRadius: 999, background: '#fff', border: '2px solid var(--coral)', boxShadow: 'var(--elev-1)' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>Extra payment · $620/mo</div>
        </div>
        <div style={{ display: 'flex', gap: 18 }}>
          {[['check', true], ['', false]].map(([c, on], i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ width: 18, height: 18, borderRadius: 5, background: on ? 'var(--coral)' : 'transparent', border: on ? 'none' : '1.5px solid var(--line)', color: 'var(--on-coral)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{on && <Icon name="check" size={12} stroke={3} />}</span><span style={{ fontSize: 13 }}>{on ? 'Deductible' : 'Not flagged'}</span></div>)}
        </div>
      </div>
    </Comp>
  );
}

function PrimTabsBadge() {
  return (
    <Comp title="Tabs · Badge · Progress" radix="Radix Tabs · cva(badge)">
      <StateLabel>Tabs</StateLabel>
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line)', marginBottom: 18 }}>
        {['Overview', 'Assets', 'Debts'].map((t, i) => <div key={t} style={{ padding: '8px 14px', fontSize: 13, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? 'var(--text)' : 'var(--text-3)', borderBottom: i === 0 ? '2px solid var(--coral)' : '2px solid transparent', marginBottom: -1 }}>{t}</div>)}
      </div>
      <StateLabel>Badges</StateLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
        {[['Bill', 'var(--text-2)'], ['Saver', 'var(--saved)'], ['Overspent', 'var(--expense)'], ['Manual', 'var(--text-3)'], ['NEW', 'var(--coral-text)']].map(([t, c]) => <span key={t} style={{ fontSize: 11, fontWeight: 700, color: c, padding: '3px 10px', borderRadius: 'var(--radius-data)', background: `color-mix(in oklch, ${c} 13%, transparent)`, border: `1px solid color-mix(in oklch, ${c} 26%, transparent)` }}>{t}</span>)}
      </div>
      <StateLabel>Progress</StateLabel>
      <div style={{ height: 6, borderRadius: 999, background: 'var(--surface-3)', overflow: 'hidden' }}><div style={{ width: '68%', height: '100%', background: 'linear-gradient(90deg, color-mix(in oklch, var(--coral) 80%, #fff), var(--coral))', borderRadius: 999 }} /></div>
    </Comp>
  );
}

function PrimFeedback() {
  return (
    <Comp title="Alert · Skeleton · Empty" radix="Radix-free cards + cva(tone)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 'var(--radius-data)', background: 'color-mix(in oklch, var(--warn) 12%, transparent)', border: '1px solid color-mix(in oklch, var(--warn) 28%, transparent)' }}><span style={{ color: 'var(--warn)' }}><Icon name="alert" size={16} /></span><span style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.4 }}>Origin Energy is due in 3 days — $142.10.</span></div>
        <div>
          <StateLabel>Skeleton (loading)</StateLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['70%', '90%', '50%'].map((w, i) => <div key={i} style={{ height: 12, width: w, borderRadius: 6, background: 'linear-gradient(90deg, var(--surface-2), var(--surface-3), var(--surface-2))', backgroundSize: '200% 100%' }} />)}
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '14px 0', border: '1px dashed var(--line)', borderRadius: 'var(--radius-data)' }}>
          <div style={{ color: 'var(--text-3)', marginBottom: 6, display: 'flex', justifyContent: 'center' }}><Icon name="ledger" size={22} /></div>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 600 }}>No transactions yet</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>They’ll appear here after your next sync.</div>
        </div>
      </div>
    </Comp>
  );
}

function PrimOverlays() {
  return (
    <Comp title="Dialog · Sheet · Popover" radix="Radix Dialog / Popover" span={2}
      notes="Overlays animate with --ease-out: dialog scales 0.96→1 + fade (slow); sheet slides from edge (slow); popover fades + 4px rise (base). Scrim is a low-alpha warm black with a 2px backdrop blur. All trap focus and restore it on close (Radix).">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div>
          <StateLabel>Dialog</StateLabel>
          <div style={{ borderRadius: 'var(--radius-card)', background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: 'var(--elev-3)', padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Delete rule?</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.45, marginBottom: 14 }}>This match rule won’t be applied to future transactions.</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><Btn variant="ghost" size="sm">Cancel</Btn><Btn variant="danger" size="sm">Delete</Btn></div>
          </div>
        </div>
        <div>
          <StateLabel>Sheet (mobile edit)</StateLabel>
          <div style={{ borderRadius: '16px 16px 0 0', background: 'var(--surface)', border: '1px solid var(--line)', borderBottom: 'none', boxShadow: 'var(--elev-3)', padding: 16, height: 132 }}>
            <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--surface-3)', margin: '0 auto 14px' }} />
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Categorise</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{['Groceries', 'Transport', 'Fun'].map((t) => <span key={t} style={{ fontSize: 12, padding: '5px 11px', borderRadius: 999, border: '1px solid var(--line)', color: 'var(--text-2)' }}>{t}</span>)}</div>
          </div>
        </div>
        <div>
          <StateLabel>Popover</StateLabel>
          <div style={{ borderRadius: 'var(--radius-card)', background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: 'var(--elev-pop)', padding: 14, width: 'fit-content' }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, marginBottom: 8 }}>QUICK ACTIONS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{[['flag', 'Flag deductible'], ['swap', 'Mark transfer'], ['repeat', 'Make recurring']].map(([ic, t]) => <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px', borderRadius: 7, fontSize: 12.5, color: 'var(--text-2)' }}><Icon name={ic} size={14} />{t}</div>)}</div>
          </div>
        </div>
      </div>
    </Comp>
  );
}

Object.assign(window, { Comp, StateLabel, Btn, PrimButtons, PrimInputs, PrimControls, PrimTabsBadge, PrimFeedback, PrimOverlays });
