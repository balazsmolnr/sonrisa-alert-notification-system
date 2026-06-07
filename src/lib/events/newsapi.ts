import type { EventSource, IncomingEvent } from "./types";

type NewsApiArticle = {
  url: string;
  title: string;
  description: string | null;
  source: { id: string | null; name: string };
  publishedAt: string;
};

type NewsApiResponse = {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
  message?: string;
};

// NewsAPI has no severity concept — all ingested events are assigned "medium".
// See DECISIONS.md: severity for NewsAPI events is hardcoded.
const DEFAULT_SEVERITY = "medium";

export class NewsApiSource implements EventSource {
  async fetch(): Promise<IncomingEvent[]> {
    const apiKey = process.env.NEWSAPI_KEY;
    if (!apiKey) {
      throw new Error("NewsApiSource: NEWSAPI_KEY environment variable is not set");
    }

    const url = new URL("https://newsapi.org/v2/top-headlines");
    url.searchParams.set("language", "en");
    url.searchParams.set("pageSize", "20");
    url.searchParams.set("apiKey", apiKey);

    const res = await fetch(url.toString());

    if (!res.ok) {
      throw new Error(`NewsAPI error ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as NewsApiResponse;

    if (data.status !== "ok") {
      throw new Error(`NewsAPI returned status "${data.status}": ${data.message ?? ""}`);
    }

    return data.articles
      .filter((a) => a.url && a.title)
      .map((a) => ({
        sourceId: a.url,
        headline: a.title,
        summary: a.description ?? undefined,
        // category is mapped from source.id (a source identifier like "bbc-news"),
        // not a semantic category. See DECISIONS.md for known limitation.
        category: a.source.id ?? "general",
        severity: DEFAULT_SEVERITY,
        url: a.url,
        publishedAt: new Date(a.publishedAt),
      }));
  }
}
