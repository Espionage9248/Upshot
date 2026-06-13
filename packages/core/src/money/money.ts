export const DEFAULT_CURRENCY = "AUD";

/** Integer-cents money value object. Immutable, currency-guarded, never a float. */
export class Money {
  private constructor(
    readonly cents: number,
    readonly currency: string,
  ) {
    Object.freeze(this);
  }

  static fromCents(cents: number, currency: string = DEFAULT_CURRENCY): Money {
    if (!Number.isInteger(cents)) {
      throw new RangeError(`Money.fromCents requires an integer, received ${cents}`);
    }
    if (!Number.isSafeInteger(cents)) {
      throw new RangeError(`Money cents outside safe-integer range: ${cents}`);
    }
    return new Money(cents === 0 ? 0 : cents, currency); // collapse -0 → 0
  }

  static zero(currency: string = DEFAULT_CURRENCY): Money {
    return new Money(0, currency);
  }

  /** Parse a decimal money string ("-59.99", "12.3", "1000") into exact integer cents. */
  static fromUpAmount(value: string, currency: string = DEFAULT_CURRENCY): Money {
    const match = /^(-)?(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
    if (!match) {
      throw new RangeError(`Invalid money string: "${value}"`);
    }
    const sign = match[1];
    const whole = match[2]!;
    const frac = (match[3] ?? "").padEnd(2, "0");
    const cents = Number(whole) * 100 + Number(frac);
    return Money.fromCents(sign && cents !== 0 ? -cents : cents, currency);
  }

  private assertSameCurrency(other: Money): void {
    if (other.currency !== this.currency) {
      throw new TypeError(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.fromCents(this.cents + other.cents, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.fromCents(this.cents - other.cents, this.currency);
  }

  negate(): Money {
    return Money.fromCents(-this.cents, this.currency);
  }

  abs(): Money {
    return Money.fromCents(Math.abs(this.cents), this.currency);
  }

  multiply(scalar: number): Money {
    if (!Number.isInteger(scalar)) {
      throw new RangeError(`Money.multiply requires an integer scalar, received ${scalar}`);
    }
    return Money.fromCents(this.cents * scalar, this.currency);
  }

  equals(other: Money): boolean {
    return this.cents === other.cents && this.currency === other.currency;
  }

  isZero(): boolean {
    return this.cents === 0;
  }

  isNegative(): boolean {
    return this.cents < 0;
  }

  /** Machine round-trippable decimal string: "-59.99", "0.00". */
  toDecimalString(): string {
    const negative = this.cents < 0;
    const abs = Math.abs(this.cents);
    const whole = Math.floor(abs / 100);
    const frac = (abs % 100).toString().padStart(2, "0");
    return `${negative ? "-" : ""}${whole}.${frac}`;
  }

  /** Human display string. The UI Money atom owns richer presentation; this is the VO's plain form. */
  format(): string {
    const negative = this.cents < 0;
    const abs = Math.abs(this.cents);
    const whole = Math.floor(abs / 100)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const frac = (abs % 100).toString().padStart(2, "0");
    const symbol = this.currency === "AUD" ? "$" : `${this.currency} `;
    return `${negative ? "-" : ""}${symbol}${whole}.${frac}`;
  }
}
