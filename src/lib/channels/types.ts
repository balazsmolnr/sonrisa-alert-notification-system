import type { Alert, Event } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export interface NotificationChannel {
  send(alert: Alert, event: Event): Promise<void>;
}

export type AlertWithChannels = Prisma.AlertGetPayload<{
  include: { channels: true };
}>;

export type EmailConfig = {
  address: string;
};

export type SlackConfig = {
  webhookUrl: string;
};