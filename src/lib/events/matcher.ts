import type { Prisma } from "@prisma/client";
import { ConditionType } from "@prisma/client";
import type { IncomingEvent } from "./types";

export type AlertWithConditions = Prisma.AlertGetPayload<{
  include: { conditions: true };
}>;

function matches(event: IncomingEvent, alert: AlertWithConditions): boolean {
  return alert.conditions.some((condition) => {
    switch (condition.type) {
      case ConditionType.keyword:
        return (
          event.headline.toLowerCase().includes(condition.value.toLowerCase()) ||
          (event.summary?.toLowerCase().includes(condition.value.toLowerCase()) ?? false)
        );
      case ConditionType.category:
        return event.category.toLowerCase() === condition.value.toLowerCase();
      case ConditionType.severity:
        return event.severity.toLowerCase() === condition.value.toLowerCase();
      default:
        return false;
    }
  });
}

export function matchAlerts<T extends AlertWithConditions>(
  event: IncomingEvent,
  alerts: T[]
): T[] {
  return alerts.filter((alert) => matches(event, alert));
}