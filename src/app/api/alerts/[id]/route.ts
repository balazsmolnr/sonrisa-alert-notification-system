import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ConditionType, ChannelType } from "@prisma/client";
import { authenticate, validateConditions, validateChannels } from "@/lib/api-helpers";

type RouteContext = { params: Promise<{ id: string }> };

async function getOwnedAlert(
  userId: string,
  alertId: string,
  include?: { conditions: true; channels: true }
) {
  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
    include: include ?? undefined,
  });
  if (!alert) return { error: "Not found", status: 404 as const };
  if (alert.userId !== userId) return { error: "Forbidden", status: 403 as const };
  return { alert };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await getOwnedAlert(user.id, id, { conditions: true, channels: true });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ alert: result.alert });
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ownership = await getOwnedAlert(user.id, id);
  if ("error" in ownership) {
    return NextResponse.json({ error: ownership.error }, { status: ownership.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, isActive, conditions, channels } = body as {
    name?: unknown;
    isActive?: unknown;
    conditions?: unknown;
    channels?: unknown;
  };

  if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
    return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
  }
  if (isActive !== undefined && typeof isActive !== "boolean") {
    return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 });
  }
  if (conditions !== undefined) {
    const err = validateConditions(conditions);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
  }
  if (channels !== undefined) {
    const err = validateChannels(channels);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
  }

  const alert = await prisma.$transaction(async (tx) => {
    if (conditions !== undefined) {
      await tx.alertCondition.deleteMany({ where: { alertId: id } });
      await tx.alertCondition.createMany({
        data: (conditions as { type: ConditionType; value: string }[]).map((c) => ({
          alertId: id,
          type: c.type,
          value: c.value.trim(),
        })),
      });
    }
    if (channels !== undefined) {
      await tx.alertChannel.deleteMany({ where: { alertId: id } });
      await tx.alertChannel.createMany({
        data: (channels as { channelType: ChannelType; config: object }[]).map((ch) => ({
          alertId: id,
          channelType: ch.channelType,
          config: ch.config,
        })),
      });
    }
    return tx.alert.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: (name as string).trim() }),
        ...(isActive !== undefined && { isActive: isActive as boolean }),
      },
      include: { conditions: true, channels: true },
    });
  });

  return NextResponse.json({ alert });
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ownership = await getOwnedAlert(user.id, id);
  if ("error" in ownership) {
    return NextResponse.json({ error: ownership.error }, { status: ownership.status });
  }

  await prisma.alert.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
