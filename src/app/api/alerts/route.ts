import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ConditionType, ChannelType } from "@prisma/client";
import { authenticate, validateConditions, validateChannels } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const activeParam = searchParams.get("active");

  const where: { userId: string; isActive?: boolean } = { userId: user.id };
  if (activeParam === "true") where.isActive = true;
  if (activeParam === "false") where.isActive = false;

  const alerts = await prisma.alert.findMany({
    where,
    include: { conditions: true, channels: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ alerts });
}

export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, conditions, channels } = body as {
    name?: unknown;
    conditions?: unknown;
    channels?: unknown;
  };

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const conditionError = validateConditions(conditions);
  if (conditionError) {
    return NextResponse.json({ error: conditionError }, { status: 400 });
  }

  const channelError = validateChannels(channels);
  if (channelError) {
    return NextResponse.json({ error: channelError }, { status: 400 });
  }

  const alert = await prisma.alert.create({
    data: {
      userId: user.id,
      name: name.trim(),
      conditions: {
        create: (conditions as { type: ConditionType; value: string }[]).map(
          (c) => ({ type: c.type, value: c.value.trim() })
        ),
      },
      channels: {
        create: (channels as { channelType: ChannelType; config: object }[]).map(
          (ch) => ({ channelType: ch.channelType, config: ch.config })
        ),
      },
    },
    include: { conditions: true, channels: true },
  });

  return NextResponse.json({ alert }, { status: 201 });
}