---
max_turns: 15
timeout_seconds: 600
allowed_tools: [Read, Grep, Skill]
model: opus
runs: 3
---
Here's my plan for a notification-preferences service (TypeScript, Node). Before I build it, is this the right design?

```ts
interface ChannelStrategy {
  channel: "email" | "sms" | "push";
  isEnabled(userId: string, category: string): Promise<boolean>;
  setEnabled(userId: string, category: string, enabled: boolean): Promise<void>;
  getQuietHours(userId: string): Promise<{ start: string; end: string } | null>;
}

class EmailStrategy implements ChannelStrategy { /* reads email_prefs table */ }
class SmsStrategy implements ChannelStrategy { /* reads sms_prefs table */ }
class PushStrategy implements ChannelStrategy { /* reads push_prefs table */ }

class PreferenceManager {
  constructor(private strategies: Map<string, ChannelStrategy>) {}

  getStrategy(channel: string): ChannelStrategy {
    return this.strategies.get(channel)!;
  }

  async shouldSend(userId: string, channel: string, category: string, now: Date): Promise<boolean> {
    const s = this.getStrategy(channel);
    if (!(await s.isEnabled(userId, category))) return false;
    const qh = await s.getQuietHours(userId);
    return !qh || !inWindow(now, qh);
  }
}
```

Callers are the notification senders (one per channel) and a settings page that lets users toggle categories per channel. We expect to add WhatsApp and in-app channels next year.
