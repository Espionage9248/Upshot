# Task C3 Report — /plan/recurring surface + actions

## Status
DONE

## Files Created
- `apps/web/app/(app)/plan/recurring/data.ts` — `loadRecurringData(db)` loader; partitions list() into active/paused/suggested, computes monthlyTotalCents, overlaps, driftAlerts
- `apps/web/app/(app)/plan/recurring/data.test.ts` — 10 tests covering all RecurringData fields (TDD-first)
- `apps/web/app/(app)/plan/recurring/page.tsx` — Server Component page (`dynamic = "force-dynamic"`)
- `apps/web/server-actions/recurring-core.ts` — pure DB helpers: `acceptSuggestion`, `dismissSuggestion`, `pauseRecurring`, `setUsage` (each writes event_log)
- `apps/web/server-actions/recurring-core.test.ts` — 8 tests covering all core actions + event_log assertions
- `apps/web/server-actions/recurring.ts` — `"use server"` thin wrappers: `acceptSuggestionAction`, `dismissSuggestionAction`, `pauseRecurringAction`, `setUsageAction`; all via `action()`; all revalidate `/plan/recurring` + `/plan`
- `apps/web/components/plan/recurring-list.tsx` — Server Component; ACTIVE/PAUSED/SUGGESTED groups, monthly-total summary, drift Alert banners, overlap Alert banners, EmptyState
- `apps/web/components/plan/recurring-suggestion-card.tsx` — `"use client"` card; accept/dismiss buttons with `router.refresh()`
- `apps/web/components/plan/usage-control.tsx` — `"use client"` inline usage tally + cost-per-use display; `router.refresh()` on save

## Files Modified
- `apps/web/e2e/auth.spec.ts` — extended passkey journey with step 10: `/plan/recurring` route smoke (heading + rendered active item + monthly total label visible); adjusted test title

## Full Gate Output

### Unit tests (vitest)
```
Test Files  53 passed (53)
     Tests  321 passed (321)   ← includes 18 new recurring tests
  Duration  9.75s
```

### Playwright e2e
```
Running 1 test using 1 worker
  ✓ [chromium] › e2e/auth.spec.ts:13:1 › register passkey → login → ... → recurring smoke → auth redirect (1.6s)
1 passed (13.9s)
```

### TypeScript
```
pnpm --filter web exec tsc --noEmit → 0 errors
```

### Next.js build
```
/plan/recurring  ƒ  (Dynamic) server-rendered on demand
```

## Self-Review

### Constraint checks
- No `@upshot/contracts` import in `apps/web` — confirmed; only in comments
- No `@upshot/db` in client components — confirmed; only in `data.ts` and `recurring-core.ts`
- `recurring.ts` exports only async fns + `export type` — confirmed
- All actions via `action()` — confirmed
- `revalidatePath("/plan/recurring")` + `revalidatePath("/plan")` in every write action — confirmed
- `router.refresh()` in both client components after writes — confirmed
- `dismissSuggestion` → `setStatus(id, "CANCELLED")` NOT delete — confirmed; test verifies row persists and appears in `knownPatterns()`
- `costPerUseCents` guard: `null` when usageCount ≤ 0, renders `—` — confirmed
- All money via `Money` component, no `parseFloat` — confirmed
- `RecurringRow` type derived from `DrizzleRecurringRepo["list"]` return type — confirmed
- No new tokens, no new npm deps — confirmed
- No dialog used (usage tally is inline per brief: "can be an inline control or a small dialog") — so `<DialogDescription>` not applicable

### Design decisions
- `driftAlerts` surfaces only ACTIVE items where `priceLastChangedAt !== null && lastAmountCents !== null && lastAmountCents !== amountCents` — strict: both conditions required
- Overlap detection is ACTIVE-only (brief says "ACTIVE items mapped to {id, category, merchant}")
- Monthly total shown only when `active.length > 0` to avoid a confusing `$0` summary
- Usage tally is an inline edit-in-place control (no dialog needed; brief explicitly allows either)
- CANCELLED items excluded from all groups (brief: "keeps the pattern suppressed")

## Concerns
None blocking. One note: the e2e test was adjusted from "empty state" to "renders seeded data" because `fixtures.ts` already seeds one ACTIVE recurring item (`e2e-bill-phone`). The task brief said "empty state (nothing seeded in fixtures)" but fixtures.ts did have a recurring item. The smoke still validates the route renders correctly with real data — arguably stronger than empty-state-only.
