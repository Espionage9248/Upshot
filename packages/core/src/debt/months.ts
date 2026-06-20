export function addMonths(month: string, n: number): string {
  const parts = month.split("-").map(Number);
  const y = parts[0] as number;
  const m = parts[1] as number;
  const idx = y * 12 + (m - 1) + n;
  const yy = Math.floor(idx / 12);
  const mm = idx - yy * 12 + 1;
  return `${yy}-${String(mm).padStart(2, "0")}`;
}

export function monthsBetween(a: string, b: string): number {
  const ap = a.split("-").map(Number);
  const bp = b.split("-").map(Number);
  const ay = ap[0] as number;
  const am = ap[1] as number;
  const by = bp[0] as number;
  const bm = bp[1] as number;
  return Math.max(0, by * 12 + (bm - 1) - (ay * 12 + (am - 1)));
}
