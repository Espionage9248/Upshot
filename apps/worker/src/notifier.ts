export interface NotifyMessage {
  title: string;
  body: string;
  priority?: "default" | "high" | "urgent";
}

export interface Notifier {
  notify(message: NotifyMessage): Promise<void>;
}

/** Posts to an ntfy topic URL. The URL is read from env by the caller; never logged. */
export class NtfyNotifier implements Notifier {
  constructor(private readonly url: string, private readonly fetchImpl: typeof fetch = ((input, init) => fetch(input, init))) {}
  async notify(message: NotifyMessage): Promise<void> {
    await this.fetchImpl(this.url, {
      method: "POST",
      headers: { Title: message.title, Priority: message.priority ?? "default" },
      body: message.body,
    });
  }
}

/** No-op notifier (used when NTFY_URL is unset, and in tests). */
export class NullNotifier implements Notifier {
  async notify(): Promise<void> {}
}
