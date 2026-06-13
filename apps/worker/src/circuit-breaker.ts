/** Opens after `threshold` consecutive failures; any success resets the count. */
export class CircuitBreaker {
  private consecutiveFailures = 0;
  constructor(private readonly threshold: number) {}
  recordFailure(): void { this.consecutiveFailures++; }
  recordSuccess(): void { this.consecutiveFailures = 0; }
  isOpen(): boolean { return this.consecutiveFailures >= this.threshold; }
}
