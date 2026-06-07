import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ConditionType, ChannelType } from "@prisma/client";

// Returns the authenticated User or null if the API key is missing/invalid.
// Runs a DB query on every call — acceptable at prototype scale.
// See DECISIONS.md: "authenticate() hits the database on every request"
export async function authenticate(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) return null;
  return prisma.user.findUnique({ where: { apiKey } });
}

// Returns an error message string, or null if valid.
export function validateConditions(conditions: unknown): string | null {
  if (!Array.isArray(conditions) || conditions.length === 0) {
    return "At least one condition is required";
  }
  const validTypes = Object.values(ConditionType);
  for (const c of conditions) {
    if (!c || typeof c !== "object") return "Invalid condition";
    const { type, value } = c as { type?: unknown; value?: unknown };
    if (!validTypes.includes(type as ConditionType)) {
      return `Invalid condition type: ${type}`;
    }
    if (!value || typeof value !== "string" || value.trim() === "") {
      return "Condition value is required";
    }
  }
  return null;
}

// Returns an error message string, or null if valid.
export function validateChannels(channels: unknown): string | null {
  if (!Array.isArray(channels) || channels.length === 0) {
    return "At least one channel is required";
  }
  const validTypes = Object.values(ChannelType);
  for (const ch of channels) {
    if (!ch || typeof ch !== "object") return "Invalid channel";
    const { channelType, config } = ch as {
      channelType?: unknown;
      config?: unknown;
    };
    if (!validTypes.includes(channelType as ChannelType)) {
      return `Invalid channel type: ${channelType}`;
    }
    if (!config || typeof config !== "object" || Array.isArray(config)) {
      return "Channel config must be a non-null object";
    }
  }
  return null;
}