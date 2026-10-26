import { NextRequest, NextResponse } from "next/server";
import { verifySmsHubWebhook, recordWebhookEvent } from "@/lib/services/webhook-service";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-smshub-signature");

    const secret = process.env.SMSHUB_WEBHOOK_SECRET;
    const isVerified = secret ? verifySmsHubWebhook(rawBody, signature, secret) : true;

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = { text: rawBody };
    }

    const eventType = payload.event || payload.type || "message.sent";
    const messageId = payload.message_id || payload.data?.message_id;
    const msisdn = payload.msisdn || payload.data?.msisdn;

    recordWebhookEvent({
      eventType,
      receivedAt: new Date().toISOString(),
      messageId,
      msisdn,
      status: payload.status || "received",
      rawPayload: payload,
      verified: isVerified,
    });

    return NextResponse.json({
      status: "success",
      received: true,
      verified: isVerified,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message || "Failed to process webhook" },
      { status: 500 }
    );
  }
}
