import { createHash } from "crypto";
import type { Request } from "express";
import { logger } from "./logger";

const GRAPH_API_VERSION = "v21.0";

export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    return first.trim();
  }
  return req.socket?.remoteAddress ?? "";
}

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

interface MetaUserData {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  clientIpAddress: string;
  clientUserAgent: string;
  fbp?: string | null;
  fbc?: string | null;
}

interface MetaEventInput {
  eventName: "Purchase" | "AddToCart" | "InitiateCheckout" | "PageView" | "ViewContent";
  eventId: string;
  eventSourceUrl?: string;
  actionSource?: "website";
  user: MetaUserData;
  customData?: Record<string, unknown>;
}

/**
 * Sends a server-side event to the Meta Conversions API. Uses the SAME
 * event_id the browser Pixel fires with (see cart.tsx / checkout.tsx), so
 * Meta deduplicates the two into a single event but still gets the
 * server-side hit for anyone whose browser pixel was blocked, delayed, or
 * never loaded (ad blockers, Safari ITP, etc.) — this is what fixes
 * inaccurate/undercounted numbers in Ads Manager.
 *
 * No-ops with a debug log when Meta env vars aren't configured, so it's
 * always safe to call, including in local dev.
 */
export async function sendMetaEvent(input: MetaEventInput): Promise<void> {
  const pixelId = process.env["META_PIXEL_ID"];
  const accessToken = process.env["META_CAPI_ACCESS_TOKEN"];

  if (!pixelId || !accessToken) {
    logger.debug({ event: input.eventName }, "[meta-capi] skipped — META_PIXEL_ID / META_CAPI_ACCESS_TOKEN not set");
    return;
  }

  const { user, customData, eventName, eventId, eventSourceUrl } = input;

  const user_data: Record<string, unknown> = {
    client_ip_address: user.clientIpAddress,
    client_user_agent: user.clientUserAgent,
  };
  if (user.email) user_data.em = [sha256(user.email)];
  if (user.phone) user_data.ph = [sha256(user.phone.replace(/[^\d]/g, ""))];
  if (user.firstName) user_data.fn = [sha256(user.firstName)];
  if (user.lastName) user_data.ln = [sha256(user.lastName)];
  if (user.city) user_data.ct = [sha256(user.city)];
  if (user.state) user_data.st = [sha256(user.state)];
  if (user.country) user_data.country = [sha256(user.country)];
  if (user.fbp) user_data.fbp = user.fbp;
  if (user.fbc) user_data.fbc = user.fbc;

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: input.actionSource ?? "website",
        event_source_url: eventSourceUrl,
        user_data,
        custom_data: customData,
      },
    ],
    ...(process.env["META_TEST_EVENT_CODE"] ? { test_event_code: process.env["META_TEST_EVENT_CODE"] } : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      logger.error({ status: res.status, body: text, event: eventName }, "[meta-capi] Meta rejected event");
    } else {
      logger.info({ event: eventName, eventId }, "[meta-capi] event sent");
    }
  } catch (err) {
    logger.error({ err, event: eventName }, "[meta-capi] request failed");
  }
}
