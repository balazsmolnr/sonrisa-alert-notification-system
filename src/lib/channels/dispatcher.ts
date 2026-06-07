import type { Event } from "@prisma/client";
import { ChannelType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { EmailChannel } from "./email";
import { SlackChannel } from "./slack";
import type { AlertWithChannels, EmailConfig, SlackConfig } from "./types";

export async function dispatch(
  alert: AlertWithChannels,
  event: Event
): Promise<void> {
  await Promise.all(
    alert.channels.map(async (channel) => {
      let status: "sent" | "failed" = "sent";
      let errorMessage: string | undefined;

      try {
        if (channel.channelType === ChannelType.email) {
          await new EmailChannel(channel.config as EmailConfig).send(alert, event);
        } else if (channel.channelType === ChannelType.slack) {
          await new SlackChannel(channel.config as SlackConfig).send(alert, event);
        } else {
          throw new Error(`Unknown channel type: ${channel.channelType}`);
        }
      } catch (err) {
        status = "failed";
        errorMessage = err instanceof Error ? err.message : String(err);
      }

      try {
        await prisma.notificationLog.create({
          data: {
            alertId: alert.id,
            eventId: event.id,
            channelType: channel.channelType,
            status,
            errorMessage,
          },
        });
      } catch (err) {
        console.error(
          `Failed to write notification log for alert ${alert.id}, event ${event.id}:`,
          err
        );
      }
    })
  );
}
