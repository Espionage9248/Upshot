import { createHash } from "node:crypto";

export function rowHash(input: {
  date: string; time: string; amountCents: number; balanceCents: number;
}): string {
  return createHash("sha256")
    .update(`${input.date}|${input.time}|${input.amountCents}|${input.balanceCents}`)
    .digest("hex")
    .slice(0, 32);
}
