import "server-only";
import crypto from "node:crypto";

export type WebhookEventItem = {
  id: string;
  eventType: "message.sent" | "message.failed" | "credits.low";
  receivedAt: string;
  messageId?: string;
  msisdn?: string;
  status: string;
  rawPayload: any;
  verified: boolean;
};

// Global in-memory log for webhook events
const globalForWebhooks = globalThis as unknown as {
  smshubWebhookEvents?: WebhookEventItem[];
};

export const webhookEvents: WebhookEventItem[] =
  globalForWebhooks.smshubWebhookEvents ?? [
    {
      id: "ev-1",
      eventType: "message.sent",
      receivedAt: new Date(Date.now() - 3600000).toISOString(),
      messageId: "msg_9b2d4e6f8a0c1e3b5d7f",
      msisdn: "0911223344",
      status: "sent",
      verified: true,
      rawPayload: {
        event: "message.sent",
        message_id: "msg_9b2d4e6f8a0c1e3b5d7f",
        msisdn: "0911223344",
        network: "ethio",
        credits_used: 1,
      },
    },
    {
      id: "ev-2",
      eventType: "credits.low",
      receivedAt: new Date(Date.now() - 7200000).toISOString(),
      status: "warning",
      verified: true,
      rawPayload: {
        event: "credits.low",
        current_balance: 18,
        threshold: 20,
        message: "SMSHub account balance dropped below low-credit threshold",
      },
    },
  ];

if (process.env.NODE_ENV !== "production") {
  globalForWebhooks.smshubWebhookEvents = webhookEvents;
}

import { verifySmsHubWebhook } from "@/lib/webhook-verify";
export { verifySmsHubWebhook };

export function recordWebhookEvent(event: Omit<WebhookEventItem, "id">) {
  const item: WebhookEventItem = {
    ...event,
    id: `ev-${Date.now()}`,
  };
  webhookEvents.unshift(item);
  if (webhookEvents.length > 50) {
    webhookEvents.pop();
  }
  return item;
}

export async function getWebhookLogs(): Promise<WebhookEventItem[]> {
  return webhookEvents;
}
