/**
 * Monte Carlo goal-confidence.
 *
 * NEW logic (no V1 reference). Estimates the probability that a goal is reached
 * by its target month, by empirically resampling the historical monthly
 * net-inflow series: each simulated month draws one past month's net inflow
 * uniformly at random, and the path "succeeds" if its projected balance meets
 * the target at the target month. Confidence is the success fraction over N
 * paths.
 *
 * Deterministic given a seed: a first-party mulberry32 PRNG is the ONLY source
 * of randomness (no Math.random), so the same seed yields an identical result.
 *
 * Integer cents throughout. The PRNG drives ONLY index selection into the
 * historical array; money never gets multiplied by a float. Balances
 * accumulate by integer addition of resampled integer-cent values.
 */

export interface GoalConfidenceInput {
  currentBalanceCents: number;
  targetCents: number;
  /** Integer ≥ 0. */
  monthsToTarget: number;
  /** Per-month signed net inflow in cents, most-recent-last. */
  historicalNetInflowsCents: number[];
}

export interface GoalConfidenceResult {
  /** 0..1 */
  confidence: number;
  /** "low" < 0.5, "medium" 0.5–0.85 (inclusive both ends), "high" > 0.85. */
  band: "low" | "medium" | "high";
}

/**
 * mulberry32: a tiny seeded PRNG returning a float in [0, 1). Used only to pick
 * an index into the historical array, never to scale a money value.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function bandFor(confidence: number): GoalConfidenceResult["band"] {
  if (confidence < 0.5) return "low";
  if (confidence > 0.85) return "high";
  return "medium";
}

export function goalConfidence(
  input: GoalConfidenceInput,
  seed: number,
  paths = 1000,
): GoalConfidenceResult {
  const { currentBalanceCents, targetCents, monthsToTarget } = input;

  if (monthsToTarget === 0) {
    const confidence = currentBalanceCents >= targetCents ? 1 : 0;
    return { confidence, band: bandFor(confidence) };
  }

  const history =
    input.historicalNetInflowsCents.length > 0
      ? input.historicalNetInflowsCents
      : [0];
  const n = history.length;

  const rand = mulberry32(seed);
  let successes = 0;

  for (let p = 0; p < paths; p++) {
    let balance = currentBalanceCents;
    for (let m = 0; m < monthsToTarget; m++) {
      const idx = Math.floor(rand() * n);
      balance += history[idx]!;
    }
    if (balance >= targetCents) successes++;
  }

  const confidence = successes / paths;
  return { confidence, band: bandFor(confidence) };
}
