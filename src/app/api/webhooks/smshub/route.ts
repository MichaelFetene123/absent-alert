import { NextRequest, NextResponse } from "next/server";
import { verifySmsHubWebhook, recordWebhookEvent } from "@/lib/services/webhook-service";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-smshub-signature");
    const secret = process.env.SMSHUB_WEBHOOK_SECRET;

    // Check token param (?token=... or ?secret=...), X-Webhook-Secret header, or HMAC signature
    const tokenParam = req.nextUrl.searchParams.get("token") || req.nextUrl.searchParams.get("secret");
    const headerSecret = req.headers.get("x-webhook-secret");

    let isVerified = false;
    if (!secret) {
      isVerified = true;
    } else {
      const isTokenMatch = (tokenParam && tokenParam === secret) || (headerSecret && headerSecret === secret);
      const isHmacMatch = verifySmsHubWebhook(rawBody, signature, secret);
      isVerified = Boolean(isTokenMatch || isHmacMatch);
    }

    if (secret && !isVerified) {
      return NextResponse.json(
        { status: "unauthorized", message: "Invalid webhook signature or secret token" },
        { status: 401 }
      );
    }

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
