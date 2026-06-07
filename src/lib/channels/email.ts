import { Resend } from "resend";
import type { Alert, Event } from "@prisma/client";
import type { NotificationChannel, EmailConfig } from "./types";

export class EmailChannel implements NotificationChannel {
  private readonly resend: Resend;
  private readonly config: EmailConfig;

  constructor(config: EmailConfig) {
    if (!config.address) {
      throw new Error("EmailChannel: config.address is required");
    }
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("EmailChannel: RESEND_API_KEY environment variable is not set");
    }
    this.resend = new Resend(apiKey);
    this.config = config;
  }

  async send(alert: Alert, event: Event): Promise<void> {
    const subject = `[${event.severity.toUpperCase()}] ${event.headline}`;

    const lines = [
      `Alert: ${alert.name}`,
      ``,
      `Headline: ${event.headline}`,
      `Category: ${event.category}`,
      `Severity: ${event.severity}`,
    ];

    if (event.summary) {
      lines.push(``, event.summary);
    }

    if (event.url) {
      lines.push(``, `Read more: ${event.url}`);
    }

    lines.push(``, `Published: ${event.publishedAt.toISOString()}`);

    const { error } = await this.resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "alerts@sonrisa.app",
      to: this.config.address,
      subject,
      text: lines.join("\n"),
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }
  }
}
