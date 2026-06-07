import type { Alert, Event } from "@prisma/client";
import type { NotificationChannel, SlackConfig } from "./types";

export class SlackChannel implements NotificationChannel {
  private readonly config: SlackConfig;

  constructor(config: SlackConfig) {
    if (!config.webhookUrl) {
      throw new Error("SlackChannel: config.webhookUrl is required");
    }
    this.config = config;
  }

  async send(alert: Alert, event: Event): Promise<void> {
    const severityEmoji: Record<string, string> = {
      critical: ":red_circle:",
      high: ":large_orange_circle:",
      medium: ":large_yellow_circle:",
      low: ":large_blue_circle:",
    };
    const emoji = severityEmoji[event.severity.toLowerCase()] ?? ":white_circle:";

    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${emoji} ${event.headline}`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Alert*\n${alert.name}` },
          { type: "mrkdwn", text: `*Category*\n${event.category}` },
          { type: "mrkdwn", text: `*Severity*\n${event.severity}` },
          {
            type: "mrkdwn",
            text: `*Published*\n${event.publishedAt.toISOString()}`,
          },
        ],
      },
    ];

    if (event.summary) {
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: event.summary },
      } as (typeof blocks)[number]);
    }

    if (event.url) {
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: `<${event.url}|Read more>` },
      } as (typeof blocks)[number]);
    }

    const res = await fetch(this.config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Slack webhook error ${res.status}: ${body}`);
    }
  }
}
