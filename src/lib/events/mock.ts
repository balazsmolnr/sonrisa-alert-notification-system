import type { EventSource, IncomingEvent } from "./types";

export class MockEventSource implements EventSource {
  async fetch(): Promise<IncomingEvent[]> {
    return [
      {
        sourceId: "mock-001",
        headline: "Major earthquake strikes southern region",
        summary:
          "A magnitude 7.2 earthquake struck the southern coastal region early this morning, causing widespread damage and triggering tsunami warnings.",
        category: "disaster",
        severity: "critical",
        url: "https://example.com/news/earthquake-001",
        publishedAt: new Date(),
      },
      {
        sourceId: "mock-002",
        headline: "Central bank announces emergency interest rate cut",
        summary:
          "The central bank cut interest rates by 50 basis points in an unscheduled meeting, citing deteriorating economic conditions.",
        category: "economy",
        severity: "high",
        url: "https://example.com/news/rates-002",
        publishedAt: new Date(),
      },
      {
        sourceId: "mock-003",
        headline: "Wildfire spreads across national park",
        summary:
          "Fuelled by strong winds and dry conditions, a wildfire has consumed over 10,000 acres and forced evacuation of nearby communities.",
        category: "disaster",
        severity: "high",
        url: "https://example.com/news/wildfire-003",
        publishedAt: new Date(),
      },
    ];
  }
}
