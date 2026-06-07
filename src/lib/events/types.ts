export interface EventSource {
  fetch(): Promise<IncomingEvent[]>;
}

export type IncomingEvent = {
  sourceId: string;
  headline: string;
  summary?: string;
  category: string;
  severity: string;
  url?: string;
  publishedAt: Date;
};