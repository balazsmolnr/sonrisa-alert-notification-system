import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { MockEventSource } from "@/lib/events/mock";
import { NewsApiSource } from "@/lib/events/newsapi";
import { matchAlerts } from "@/lib/events/matcher";
import { dispatch } from "@/lib/channels/dispatcher";

type FullAlert = Prisma.AlertGetPayload<{
  include: { conditions: true; channels: true };
}>;

function authorize(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "[ingest] CRON_SECRET is not set. Add it to .env to call this endpoint."
      );
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const header = req.headers.get("authorization");
  if (header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function POST(req: NextRequest) {
  const authError = authorize(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const useMock =
    searchParams.get("mock") === "true" &&
    process.env.NODE_ENV !== "production";

  const source = useMock ? new MockEventSource() : new NewsApiSource();

  let incoming;
  try {
    incoming = await source.fetch();
  } catch (err) {
    console.error("[ingest] Failed to fetch events:", err);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }

  // Dedup: one batch query instead of N upserts — see DECISIONS.md
  const existingSourceIds = new Set(
    (
      await prisma.event.findMany({
        where: { sourceId: { in: incoming.map((e) => e.sourceId) } },
        select: { sourceId: true },
      })
    ).map((e) => e.sourceId)
  );

  const toCreate = incoming.filter((e) => !existingSourceIds.has(e.sourceId));
  const skipped = incoming.length - toCreate.length;

  if (toCreate.length === 0) {
    return NextResponse.json({ processed: 0, skipped });
  }

  await prisma.event.createMany({
    data: toCreate.map((e) => ({
      sourceId: e.sourceId,
      headline: e.headline,
      summary: e.summary,
      category: e.category,
      severity: e.severity,
      url: e.url,
      publishedAt: e.publishedAt,
    })),
    skipDuplicates: true,
  });

  // Fetch saved records to get DB ids for dispatch and log writes
  const savedEvents = await prisma.event.findMany({
    where: { sourceId: { in: toCreate.map((e) => e.sourceId) } },
  });

  // Load all active alerts once — reused across all events this run
  const alerts = (await prisma.alert.findMany({
    where: { isActive: true },
    include: { conditions: true, channels: true },
  })) as FullAlert[];

  let processed = 0;

  for (const event of savedEvents) {
    const incomingEvent = toCreate.find((e) => e.sourceId === event.sourceId)!;
    const matched = matchAlerts(incomingEvent, alerts);

    for (const alert of matched) {
      await dispatch(alert, event);
    }

    await prisma.event.update({
      where: { id: event.id },
      data: { processedAt: new Date() },
    });

    processed++;
  }

  return NextResponse.json({ processed, skipped });
}
